const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { PRODUCT_MEMBERSHIP_MAPPING } = require('./scripts/migration/product-membership-mapping.js');

const prisma = new PrismaClient();

async function generateReport() {
  console.log('=== GENERATING COMPREHENSIVE REPORT ===\n');
  
  // Load Sejoli data
  const sejoli = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
  
  // Get transactions from database
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    include: {
      affiliateConversion: {
        include: {
          affiliate: {
            include: {
              user: { select: { name: true, email: true } }
            }
          }
        }
      }
    }
  });
  
  console.log('Total SUCCESS transactions in DB:', transactions.length);
  
  // Group by product
  const productStats = {};
  
  for (const tx of transactions) {
    // Find Sejoli order
    const sejOrder = sejoli.orders.find(o => String(o.id) === String(tx.externalId));
    if (!sejOrder) continue;
    
    const productId = sejOrder.product_id;
    const productInfo = PRODUCT_MEMBERSHIP_MAPPING[productId];
    
    if (!productStats[productId]) {
      productStats[productId] = {
        productId: productId,
        productName: productInfo?.name || 'Unknown',
        membershipType: productInfo?.membershipSlug || 'N/A',
        productType: productInfo?.type || 'unknown',
        commissionFlat: productInfo?.commissionFlat || 0,
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0,
        withAffiliate: 0
      };
    }
    
    productStats[productId].totalOrders++;
    productStats[productId].totalSales += tx.amount;
    
    if (tx.affiliateConversion) {
      productStats[productId].withAffiliate++;
      productStats[productId].totalCommission += tx.affiliateConversion.commissionAmount;
    }
  }
  
  // Sort by total orders
  const sortedProducts = Object.values(productStats).sort((a, b) => b.totalOrders - a.totalOrders);
  
  console.log('\n=== TOP 20 PRODUK BERDASARKAN JUMLAH TRANSAKSI ===\n');
  console.log('No | Product ID | Nama Produk | Type | Orders | Sales | Commission | With Aff');
  console.log('---|------------|-------------|------|--------|-------|------------|----------');
  
  sortedProducts.slice(0, 20).forEach((p, i) => {
    console.log(
      `${(i+1).toString().padStart(2)} | ` +
      `${p.productId.toString().padEnd(10)} | ` +
      `${p.productName.substring(0, 30).padEnd(30)} | ` +
      `${p.productType.padEnd(10)} | ` +
      `${p.totalOrders.toString().padStart(6)} | ` +
      `${(p.totalSales/1000000).toFixed(1).padStart(7)}M | ` +
      `${(p.totalCommission/1000000).toFixed(1).padStart(8)}M | ` +
      `${p.withAffiliate.toString().padStart(8)}`
    );
  });
  
  // Summary by type
  console.log('\n\n=== SUMMARY BY PRODUCT TYPE ===\n');
  const typeStats = {};
  
  for (const p of sortedProducts) {
    if (!typeStats[p.productType]) {
      typeStats[p.productType] = {
        products: 0,
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0
      };
    }
    typeStats[p.productType].products++;
    typeStats[p.productType].totalOrders += p.totalOrders;
    typeStats[p.productType].totalSales += p.totalSales;
    typeStats[p.productType].totalCommission += p.totalCommission;
  }
  
  console.log('Type | Products | Orders | Total Sales | Total Commission');
  console.log('-----|----------|--------|-------------|------------------');
  
  for (const [type, stats] of Object.entries(typeStats)) {
    console.log(
      `${type.padEnd(12)} | ` +
      `${stats.products.toString().padStart(8)} | ` +
      `${stats.totalOrders.toString().padStart(6)} | ` +
      `Rp ${(stats.totalSales/1000000).toFixed(1).padStart(7)}M | ` +
      `Rp ${(stats.totalCommission/1000000).toFixed(1).padStart(8)}M`
    );
  }
  
  // Grand totals
  const grandTotal = {
    orders: sortedProducts.reduce((sum, p) => sum + p.totalOrders, 0),
    sales: sortedProducts.reduce((sum, p) => sum + p.totalSales, 0),
    commission: sortedProducts.reduce((sum, p) => sum + p.totalCommission, 0),
    withAffiliate: sortedProducts.reduce((sum, p) => sum + p.withAffiliate, 0)
  };
  
  console.log('\n=== GRAND TOTAL ===');
  console.log('Total Products:', sortedProducts.length);
  console.log('Total Orders:', grandTotal.orders.toLocaleString('id-ID'));
  console.log('Total Sales:', 'Rp', grandTotal.sales.toLocaleString('id-ID'));
  console.log('Total Commission:', 'Rp', grandTotal.commission.toLocaleString('id-ID'));
  console.log('Orders with Affiliate:', grandTotal.withAffiliate.toLocaleString('id-ID'));
  
  // Save to file
  const report = {
    generatedAt: new Date().toISOString(),
    products: sortedProducts,
    typeStats,
    grandTotal
  };
  
  fs.writeFileSync('PRODUCT_COMMISSION_REPORT.json', JSON.stringify(report, null, 2));
  console.log('\n✅ Report saved to PRODUCT_COMMISSION_REPORT.json');
  
  await prisma.$disconnect();
}

generateReport().catch(console.error);
