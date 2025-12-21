/**
 * CLEAN IMPORT SEJOLI TO NEXTJS DATABASE
 * 18 Desember 2025
 * 
 * Source: File JSON yang sudah di-download dari Sejoli API
 * Target: PostgreSQL Neon Database (NextJS)
 * 
 * Steps:
 * 1. Load dan validasi data dari JSON files
 * 2. Clean existing Sejoli data dari database
 * 3. Import products dengan commission info
 * 4. Import transactions dengan revenue split
 * 5. Verify hasil import
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Load data dari file
console.log('📂 Loading data from JSON files...\n');

const productsData = JSON.parse(fs.readFileSync('sejoli-products-latest.json', 'utf8'));
const salesDataRaw = JSON.parse(fs.readFileSync('sejoli-sales-raw.json', 'utf8'));
const salesData = salesDataRaw.orders || salesDataRaw;

console.log(`✅ Products loaded: ${productsData.length}`);
console.log(`✅ Sales loaded: ${salesData.length}`);

// Validate data
console.log('\n🔍 VALIDATING DATA...');
console.log('='.repeat(60));

const orderIds = salesData.map(o => o.ID);
const uniqueOrderIds = new Set(orderIds);
console.log(`  Total orders: ${orderIds.length}`);
console.log(`  Unique order IDs: ${uniqueOrderIds.size}`);
console.log(`  Duplicates: ${orderIds.length - uniqueOrderIds.size}`);

if (orderIds.length !== uniqueOrderIds.size) {
  console.error('❌ ERROR: DUPLICATE ORDER IDs FOUND!');
  process.exit(1);
}

const completedOrders = salesData.filter(o => o.status === 'completed');
console.log(`  Completed orders: ${completedOrders.length}`);

let totalOmset = 0;
completedOrders.forEach(o => {
  totalOmset += parseFloat(o.grand_total) || 0;
});
console.log(`  Total omset: Rp ${totalOmset.toLocaleString()}`);

// Status distribution
const statusCount = {};
salesData.forEach(o => {
  statusCount[o.status] = (statusCount[o.status] || 0) + 1;
});
console.log('\n  Status distribution:');
Object.entries(statusCount).forEach(([status, count]) => {
  console.log(`    ${status}: ${count}`);
});

console.log('\n✅ Data validation PASSED!\n');

async function cleanExistingData() {
  console.log('🗑️  CLEANING EXISTING SEJOLI DATA...');
  console.log('='.repeat(60));
  
  // Delete transactions
  const deletedTx = await prisma.transaction.deleteMany({
    where: {
      OR: [
        { paymentProvider: 'SEJOLI' },
        { externalId: { startsWith: 'sejoli-' } }
      ]
    }
  });
  console.log(`  Deleted transactions: ${deletedTx.count}`);
  
  // Delete products (by checking metadata for sejoliProductId)
  const existingProducts = await prisma.product.findMany({
    where: {
      description: { contains: 'Sejoli:', mode: 'insensitive' }
    },
    select: { id: true }
  });
  
  if (existingProducts.length > 0) {
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        id: { in: existingProducts.map(p => p.id) }
      }
    });
    console.log(`  Deleted products: ${deletedProducts.count}`);
  } else {
    console.log(`  No existing Sejoli products found`);
  }
  
  console.log('✅ Cleanup complete!\n');
}

async function importProducts() {
  console.log('📦 IMPORTING PRODUCTS...');
  console.log('='.repeat(60));
  
  let imported = 0;
  let errors = 0;
  
  // Get admin user
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!adminUser) {
    throw new Error('❌ Admin user not found!');
  }
  
  for (const product of productsData) {
    try {
      // Extract commission info
      let commissionRate = 0;
      let commissionType = 'PERCENTAGE';
      
      if (product.affiliate && product.affiliate['1']) {
        const affData = product.affiliate['1'];
        if (affData.type === 'fixed') {
          commissionType = 'FLAT';
          commissionRate = parseFloat(affData.fee) || 0;
        } else if (affData.type === 'percentage') {
          commissionType = 'PERCENTAGE';
          commissionRate = parseFloat(affData.fee) || 0;
        }
      }
      
      await prisma.product.create({
        data: {
          name: product.title || 'Unknown Product',
          description: `Sejoli: ${product.title || 'Unknown Product'}`,
          shortDescription: product.description || null,
          price: parseFloat(product.price) || 0,
          isActive: true,
          commissionType: commissionType,
          affiliateCommissionRate: commissionRate,
          productType: 'DIGITAL',
          productStatus: 'PUBLISHED',
          createdById: adminUser.id,
          metadata: {
            sejoliProductId: product.id,
            sejoliData: {
              id: product.id,
              title: product.title,
              price: product.price,
              affiliate: product.affiliate
            }
          }
        }
      });
      
      imported++;
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.error(`  Error importing product ${product.id}:`, err.message);
      }
    }
  }
  
  console.log(`✅ Products imported: ${imported}, errors: ${errors}\n`);
  return imported;
}

async function importTransactions() {
  console.log('💰 IMPORTING TRANSACTIONS...');
  console.log('='.repeat(60));
  
  // Get admin user
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  // Build product maps
  const productMap = {};
  productsData.forEach(p => {
    productMap[p.id] = p;
  });
  
  const dbProducts = await prisma.product.findMany({
    where: {
      description: { startsWith: 'Sejoli:' }
    },
    select: {
      id: true,
      metadata: true
    }
  });
  
  const productIdMap = {};
  dbProducts.forEach(p => {
    if (p.metadata && p.metadata.sejoliProductId) {
      productIdMap[p.metadata.sejoliProductId] = p.id;
    }
  });
  
  let imported = 0;
  let errors = 0;
  const batchSize = 100;
  
  console.log(`  Processing ${completedOrders.length} completed orders...\n`);
  
  for (let i = 0; i < completedOrders.length; i += batchSize) {
    const batch = completedOrders.slice(i, i + batchSize);
    
    for (const order of batch) {
      try {
        const externalId = `sejoli-${order.ID}`;
        const sejoliProduct = productMap[order.product_id];
        const dbProductId = productIdMap[order.product_id];
        
        // Calculate commission
        let commission = 0;
        if (sejoliProduct && sejoliProduct.affiliate && sejoliProduct.affiliate['1']) {
          const affData = sejoliProduct.affiliate['1'];
          if (affData.type === 'fixed') {
            commission = parseFloat(affData.fee) || 0;
          } else if (affData.type === 'percentage') {
            commission = (parseFloat(affData.fee) / 100) * parseFloat(order.grand_total);
          }
        }
        
        const amount = parseFloat(order.grand_total) || 0;
        
        // Revenue split: After affiliate commission
        // 15% admin, 60% founder, 40% cofounder from remaining
        const afterAffiliate = Math.max(0, amount - commission);
        const adminFee = Math.round(afterAffiliate * 0.15);
        const remaining = Math.max(0, afterAffiliate - adminFee);
        const founderShare = Math.round(remaining * 0.60);
        const cofounderShare = Math.round(remaining * 0.40);
        
        // Parse date
        let orderDate = new Date(order.created_at);
        if (isNaN(orderDate.getTime())) {
          orderDate = new Date(order.order_date + ' 00:00:00');
        }
        if (isNaN(orderDate.getTime())) {
          orderDate = new Date();
        }
        
        // Determine transaction type
        let transactionType = 'PRODUCT';
        if (sejoliProduct) {
          const productName = sejoliProduct.title.toLowerCase();
          if (productName.includes('paket ekspor') || 
              productName.includes('membership') || 
              productName.includes('bulan') || 
              productName.includes('lifetime')) {
            transactionType = 'MEMBERSHIP';
          }
        }
        
        // Create transaction
        await prisma.transaction.create({
          data: {
            userId: adminUser.id,
            productId: dbProductId || null,
            type: transactionType,
            status: 'SUCCESS',
            amount: amount,
            originalAmount: amount,
            customerName: order.user_name || 'Unknown',
            customerEmail: order.user_email || null,
            description: `Sejoli: ${sejoliProduct ? sejoliProduct.title : 'Unknown Product'}`,
            reference: `SEJOLI-${order.ID}`,
            externalId: externalId,
            paymentMethod: 'SEJOLI_IMPORT',
            paymentProvider: 'SEJOLI',
            founderShare: founderShare,
            coFounderShare: cofounderShare,
            affiliateShare: commission,
            companyFee: adminFee,
            affiliateId: order.affiliate_id ? String(order.affiliate_id) : null,
            paidAt: orderDate,
            createdAt: orderDate,
            metadata: {
              sejoliOrderId: order.ID,
              sejoliProductId: order.product_id,
              sejoliAffiliateId: order.affiliate_id,
              sejoliAffiliateName: order.affiliate_name,
              sejoliStatus: order.status,
              importedAt: new Date().toISOString()
            }
          }
        });
        
        imported++;
      } catch (err) {
        errors++;
        if (errors <= 5) {
          console.error(`  Error importing order ${order.ID}:`, err.message);
        }
      }
    }
    
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= completedOrders.length) {
      console.log(`    Progress: ${Math.min(i + batchSize, completedOrders.length)}/${completedOrders.length} (${imported} imported, ${errors} errors)`);
    }
  }
  
  console.log(`\n✅ Transactions imported: ${imported}, errors: ${errors}\n`);
  return imported;
}

async function verifyImport() {
  console.log('✅ VERIFYING IMPORT...');
  console.log('='.repeat(60));
  
  // Count products
  const productCount = await prisma.product.count({
    where: {
      description: { startsWith: 'Sejoli:' }
    }
  });
  
  // Count and sum transactions
  const txStats = await prisma.transaction.aggregate({
    where: {
      paymentProvider: 'SEJOLI',
      status: 'SUCCESS'
    },
    _count: true,
    _sum: {
      amount: true,
      affiliateShare: true,
      founderShare: true,
      coFounderShare: true,
      companyFee: true
    }
  });
  
  // Get date range
  const earliest = await prisma.transaction.findFirst({
    where: { paymentProvider: 'SEJOLI' },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true, externalId: true }
  });
  
  const latest = await prisma.transaction.findFirst({
    where: { paymentProvider: 'SEJOLI' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, externalId: true }
  });
  
  // Count by type
  const byType = await prisma.transaction.groupBy({
    by: ['type'],
    where: { paymentProvider: 'SEJOLI' },
    _count: true
  });
  
  console.log('\n📊 IMPORT RESULTS:');
  console.log('  Products in DB:', productCount);
  console.log('  Transactions in DB:', txStats._count);
  
  console.log('\n💰 REVENUE SUMMARY:');
  console.log(`  Total Omset: Rp ${parseFloat(txStats._sum.amount || 0).toLocaleString()}`);
  console.log(`  Affiliate Commission: Rp ${parseFloat(txStats._sum.affiliateShare || 0).toLocaleString()}`);
  console.log(`  Founder Share (60%): Rp ${parseFloat(txStats._sum.founderShare || 0).toLocaleString()}`);
  console.log(`  Co-Founder Share (40%): Rp ${parseFloat(txStats._sum.coFounderShare || 0).toLocaleString()}`);
  console.log(`  Admin Fee (15%): Rp ${parseFloat(txStats._sum.companyFee || 0).toLocaleString()}`);
  
  console.log('\n📅 DATE RANGE:');
  if (earliest) {
    console.log(`  Earliest: ${earliest.createdAt.toISOString().split('T')[0]} (${earliest.externalId})`);
  }
  if (latest) {
    console.log(`  Latest: ${latest.createdAt.toISOString().split('T')[0]} (${latest.externalId})`);
  }
  
  console.log('\n📊 BY TYPE:');
  byType.forEach(t => {
    console.log(`  ${t.type}: ${t._count}`);
  });
  
  console.log('\n📊 COMPARISON WITH SEJOLI DASHBOARD:');
  console.log('  Expected (from Sejoli):');
  console.log('    Total Sales: 12,851');
  console.log('    Total Omset: Rp 4,133,322,962');
  console.log('  Imported (to NextJS DB):');
  console.log(`    Total Sales: ${txStats._count}`);
  console.log(`    Total Omset: Rp ${parseFloat(txStats._sum.amount || 0).toLocaleString()}`);
  console.log('  Difference:');
  console.log(`    Sales: ${12851 - txStats._count}`);
  console.log(`    Omset: Rp ${(4133322962 - parseFloat(txStats._sum.amount || 0)).toLocaleString()}`);
}

async function main() {
  console.log('🚀 CLEAN IMPORT SEJOLI TO NEXTJS DATABASE');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // Step 1: Clean existing data
    await cleanExistingData();
    
    // Step 2: Import products
    const productsImported = await importProducts();
    
    // Step 3: Import transactions
    const txImported = await importTransactions();
    
    // Step 4: Verify
    await verifyImport();
    
    console.log('\n✅ IMPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Finished at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
