/**
 * SIMPLE IMPORT: SEJOLI TRANSACTIONS ONLY
 * 18 Desember 2025
 * 
 * Fokus: Import transaksi saja dengan revenue split
 * Skip: Products import (sudah ada jika diperlukan)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

console.log('📂 Loading Sejoli data...\n');

const productsData = JSON.parse(fs.readFileSync('sejoli-products-latest.json', 'utf8'));
const salesDataRaw = JSON.parse(fs.readFileSync('sejoli-sales-raw.json', 'utf8'));
const salesData = salesDataRaw.orders || salesDataRaw;

console.log(`✅ Products: ${productsData.length}`);
console.log(`✅ Sales: ${salesData.length}`);

// Build product map
const productMap = {};
productsData.forEach(p => {
  let commission = 0;
  if (p.affiliate && p.affiliate['1']) {
    const affData = p.affiliate['1'];
    if (affData.type === 'fixed') {
      commission = parseFloat(affData.fee) || 0;
    } else if (affData.type === 'percentage') {
      commission = (parseFloat(affData.fee) / 100) * parseFloat(p.price || 0);
    }
  }
  productMap[p.id] = {
    ...p,
    calculatedCommission: commission
  };
});

const completedOrders = salesData.filter(o => o.status === 'completed');
console.log(`✅ Completed orders: ${completedOrders.length}\n`);

async function main() {
  console.log('🚀 IMPORTING SEJOLI TRANSACTIONS');
  console.log('='.repeat(60));
  
  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!adminUser) {
    throw new Error('❌ Admin user not found!');
  }
  
  console.log(`✅ Admin user found: ${adminUser.email}\n`);
  
  // Clean existing Sejoli transactions
  console.log('🗑️  Cleaning existing transactions...');
  const deleted = await prisma.transaction.deleteMany({
    where: {
      OR: [
        { paymentProvider: 'SEJOLI' },
        { externalId: { startsWith: 'sejoli-' } }
      ]
    }
  });
  console.log(`✅ Deleted: ${deleted.count} transactions\n`);
  
  // Import transactions
  console.log('💰 Importing transactions...');
  let imported = 0;
  let errors = 0;
  const batchSize = 100;
  
  for (let i = 0; i < completedOrders.length; i += batchSize) {
    const batch = completedOrders.slice(i, i + batchSize);
    
    for (const order of batch) {
      try {
        const product = productMap[order.product_id];
        const commission = product ? product.calculatedCommission : 0;
        const amount = parseFloat(order.grand_total) || 0;
        
        // Revenue split
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
        
        // Determine type
        let transactionType = 'PRODUCT';
        if (product) {
          const name = product.title.toLowerCase();
          if (name.includes('paket ekspor') || name.includes('bulan') || name.includes('lifetime')) {
            transactionType = 'MEMBERSHIP';
          }
        }
        
        await prisma.transaction.create({
          data: {
            userId: adminUser.id,
            type: transactionType,
            status: 'SUCCESS',
            amount: amount,
            originalAmount: amount,
            customerName: order.user_name || 'Unknown',
            customerEmail: order.user_email || null,
            description: product ? product.title : 'Unknown Product',
            reference: `SEJOLI-${order.ID}`,
            externalId: `sejoli-${order.ID}`,
            paymentMethod: 'SEJOLI_IMPORT',
            paymentProvider: 'SEJOLI',
            founderShare: founderShare,
            coFounderShare: cofounderShare,
            affiliateShare: commission,
            companyFee: adminFee,
            affiliateId: order.affiliate_id ? String(order.affiliate_id) : null,
            paidAt: orderDate,
            createdAt: orderDate
          }
        });
        
        imported++;
      } catch (err) {
        errors++;
        if (errors <= 3) {
          console.error(`  Error: ${err.message}`);
        }
      }
    }
    
    if ((i + batchSize) % 1000 === 0) {
      console.log(`  Progress: ${Math.min(i + batchSize, completedOrders.length)}/${completedOrders.length}`);
    }
  }
  
  console.log(`\n✅ Imported: ${imported}, Errors: ${errors}\n`);
  
  // Verify
  console.log('✅ VERIFICATION');
  console.log('='.repeat(60));
  
  const stats = await prisma.transaction.aggregate({
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
  
  const byType = await prisma.transaction.groupBy({
    by: ['type'],
    where: { paymentProvider: 'SEJOLI' },
    _count: true
  });
  
  console.log(`Total Transactions: ${stats._count}`);
  console.log(`Total Omset: Rp ${parseFloat(stats._sum.amount || 0).toLocaleString()}`);
  console.log(`Affiliate Commission: Rp ${parseFloat(stats._sum.affiliateShare || 0).toLocaleString()}`);
  console.log(`Founder Share: Rp ${parseFloat(stats._sum.founderShare || 0).toLocaleString()}`);
  console.log(`Co-Founder Share: Rp ${parseFloat(stats._sum.coFounderShare || 0).toLocaleString()}`);
  console.log(`Admin Fee: Rp ${parseFloat(stats._sum.companyFee || 0).toLocaleString()}`);
  
  console.log('\nBy Type:');
  byType.forEach(t => console.log(`  ${t.type}: ${t._count}`));
  
  console.log('\n✅ IMPORT COMPLETE!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
