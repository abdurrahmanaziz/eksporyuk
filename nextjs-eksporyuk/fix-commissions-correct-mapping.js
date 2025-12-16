const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { PRODUCT_MEMBERSHIP_MAPPING, getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');

async function fixCommissionsWithCorrectMapping() {
  console.log('🔧 FIX COMMISSION - Prioritas Berdasarkan Jumlah Transaksi');
  console.log('============================================================\n');

  try {
    // 1. Load sejoli data
    const sejoliFull = fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8');
    const sejoli = JSON.parse(sejoliFull);
    
    // 2. Create mapping: amount → product_id with count (prioritize by frequency)
    const amountToProducts = new Map();
    
    sejoli.orders.forEach(order => {
      if (order.status === 'completed' && order.affiliate_id && order.affiliate_id !== '0') {
        const key = `${parseFloat(order.grand_total)}`;
        if (!amountToProducts.has(key)) {
          amountToProducts.set(key, new Map());
        }
        
        const products = amountToProducts.get(key);
        products.set(order.product_id, (products.get(order.product_id) || 0) + 1);
      }
    });
    
    // 3. For each amount, pick the most common product (or based on priority rules)
    const amountToMainProduct = new Map();
    
    amountToProducts.forEach((products, amount) => {
      // Sort by count descending
      const sorted = Array.from(products.entries()).sort((a, b) => b[1] - a[1]);
      
      // SPECIAL RULES for conflicting prices
      const amt = parseFloat(amount);
      
      if (amt === 35000) {
        // Prioritize product 18528 (Zoom Ekspor 30 Juli) with 20k commission
        const targetProduct = sorted.find(([pid]) => pid === '18528');
        amountToMainProduct.set(amount, targetProduct ? targetProduct[0] : sorted[0][0]);
      } else if (amt === 899000) {
        // FORCE product 13399 (Paket Ekspor Yuk 12 Bulan) with 250k commission
        amountToMainProduct.set(amount, '13399');
      } else {
        // Use most common product
        amountToMainProduct.set(amount, sorted[0][0]);
      }
    });
    
    console.log('📊 Mapping created for', amountToMainProduct.size, 'unique amounts\n');
    
    // 4. Update AffiliateConversions
    const conversions = await prisma.affiliateConversion.findMany({
      include: { transaction: true }
    });
    
    let updated = 0;
    let skipped = 0;
    let totalOldComm = 0;
    let totalNewComm = 0;
    
    const changes = [];
    
    for (const conv of conversions) {
      const tx = conv.transaction;
      if (!tx) {
        skipped++;
        continue;
      }
      
      const amount = tx.amount;
      const key = `${amount}`;
      
      const productId = amountToMainProduct.get(key);
      
      if (!productId) {
        skipped++;
        continue;
      }
      
      const correctCommission = getCommissionForProduct(productId);
      
      if (correctCommission !== conv.commissionAmount) {
        totalOldComm += conv.commissionAmount;
        totalNewComm += correctCommission;
        
        await prisma.affiliateConversion.update({
          where: { id: conv.id },
          data: { commissionAmount: correctCommission }
        });
        
        const productInfo = PRODUCT_MEMBERSHIP_MAPPING[productId];
        changes.push({
          amount: amount,
          productId: productId,
          productName: productInfo?.name || 'Unknown',
          oldCommission: conv.commissionAmount,
          newCommission: correctCommission
        });
        
        updated++;
        
        if (updated % 500 === 0) {
          console.log(`   Updated ${updated} conversions...`);
        }
      } else {
        skipped++;
      }
    }
    
    console.log('\n📊 HASIL UPDATE:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    
    console.log('\n💰 PERUBAHAN TOTAL:');
    console.log(`   Old Total: Rp ${totalOldComm.toLocaleString('id-ID')}`);
    console.log(`   New Total: Rp ${totalNewComm.toLocaleString('id-ID')}`);
    console.log(`   Difference: Rp ${(totalNewComm - totalOldComm).toLocaleString('id-ID')}`);
    
    // Show key changes
    console.log('\n📝 PERUBAHAN PENTING:');
    
    const keyChanges = changes.filter(c => 
      c.amount === 35000 || 
      c.amount === 899000 || 
      c.amount === 100000 ||
      c.amount === 699000 ||
      c.amount === 999000
    );
    
    keyChanges.slice(0, 10).forEach(c => {
      console.log(`   [${c.productId}] ${c.productName}`);
      console.log(`   Rp ${c.amount?.toLocaleString('id-ID')} | ${c.oldCommission?.toLocaleString('id-ID')} → ${c.newCommission?.toLocaleString('id-ID')}\n`);
    });
    
    // Final total
    const finalTotal = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    
    console.log('🎉 FINAL TOTAL COMMISSION:');
    console.log(`   💵 Rp ${finalTotal._sum.commissionAmount?.toLocaleString('id-ID')}`);
    
    // Verify specific prices
    console.log('\n✅ VERIFIKASI:');
    const verifyPrices = [35000, 100000, 699000, 899000, 999000];
    
    for (const price of verifyPrices) {
      const sample = await prisma.affiliateConversion.findFirst({
        where: { transaction: { amount: price } }
      });
      
      if (sample) {
        const productId = amountToMainProduct.get(`${price}`);
        const product = PRODUCT_MEMBERSHIP_MAPPING[productId];
        console.log(`   Rp ${price.toLocaleString('id-ID')} → Komisi: Rp ${sample.commissionAmount.toLocaleString('id-ID')} (${product?.name})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixCommissionsWithCorrectMapping().catch(console.error);
