const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import correct commission mapping
const { PRODUCT_MEMBERSHIP_MAPPING, getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');

async function fixCommissionsByProductId() {
  console.log('🔧 FIX COMMISSION - Berdasarkan Product ID dari Sejoli');
  console.log('=======================================================\n');

  try {
    // 1. Load sejoli data
    const sejoliFull = fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8');
    const sejoli = JSON.parse(sejoliFull);
    
    console.log(`📊 Loaded ${sejoli.orders.length} orders from Sejoli\n`);
    
    // 2. Create mapping: transaction amount → product_id
    const amountToProductId = new Map();
    
    sejoli.orders.forEach(order => {
      if (order.status === 'completed' && order.affiliate_id && order.affiliate_id !== '0') {
        const key = `${parseFloat(order.grand_total)}`;
        if (!amountToProductId.has(key)) {
          amountToProductId.set(key, new Set());
        }
        amountToProductId.get(key).add(order.product_id);
      }
    });
    
    console.log(`📋 Found ${amountToProductId.size} unique transaction amounts\n`);
    
    // 3. Get all AffiliateConversions
    const conversions = await prisma.affiliateConversion.findMany({
      include: { transaction: true }
    });
    
    console.log(`💰 Found ${conversions.length} AffiliateConversions to update\n`);
    
    // 4. Update each conversion with correct commission based on product_id
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
      
      // Get possible product IDs for this amount
      const productIds = amountToProductId.get(key);
      
      if (!productIds || productIds.size === 0) {
        skipped++;
        continue;
      }
      
      // If multiple products, try to find the one with commission
      let correctCommission = 0;
      let matchedProductId = null;
      
      for (const productId of productIds) {
        const comm = getCommissionForProduct(productId);
        if (comm > 0) {
          correctCommission = comm;
          matchedProductId = productId;
          break;
        }
      }
      
      // If no product has commission, use first product ID anyway
      if (correctCommission === 0 && productIds.size > 0) {
        matchedProductId = Array.from(productIds)[0];
        correctCommission = getCommissionForProduct(matchedProductId);
      }
      
      // Update if different
      if (correctCommission !== conv.commissionAmount) {
        totalOldComm += conv.commissionAmount;
        totalNewComm += correctCommission;
        
        await prisma.affiliateConversion.update({
          where: { id: conv.id },
          data: { commissionAmount: correctCommission }
        });
        
        const productInfo = PRODUCT_MEMBERSHIP_MAPPING[matchedProductId];
        changes.push({
          txId: tx.id,
          amount: amount,
          productId: matchedProductId,
          productName: productInfo?.name || `Unknown`,
          oldCommission: conv.commissionAmount,
          newCommission: correctCommission
        });
        
        updated++;
        
        if (updated % 500 === 0) {
          console.log(`   Processing... ${updated} updated`);
        }
      } else {
        skipped++;
      }
    }
    
    console.log('\n📊 HASIL UPDATE:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (already correct): ${skipped}`);
    
    console.log('\n💰 PERUBAHAN TOTAL KOMISI:');
    console.log(`   Old Total: Rp ${totalOldComm.toLocaleString('id-ID')}`);
    console.log(`   New Total: Rp ${totalNewComm.toLocaleString('id-ID')}`);
    console.log(`   Difference: Rp ${(totalNewComm - totalOldComm).toLocaleString('id-ID')}`);
    
    // Show top 20 changes
    console.log('\n📝 TOP 20 PERUBAHAN:');
    changes.slice(0, 20).forEach(c => {
      console.log(`   [${c.productId}] ${c.productName}`);
      console.log(`   Rp ${c.amount?.toLocaleString('id-ID')} | ${c.oldCommission?.toLocaleString('id-ID')} → ${c.newCommission?.toLocaleString('id-ID')}\n`);
    });
    
    // Final total
    const finalTotal = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    
    console.log('🎉 FINAL TOTAL COMMISSION:');
    console.log(`   💵 Rp ${finalTotal._sum.commissionAmount?.toLocaleString('id-ID')}`);
    
    // Save detailed changes to file
    fs.writeFileSync(
      'commission-changes-detailed.json',
      JSON.stringify(changes, null, 2)
    );
    console.log(`\n📄 Detailed changes saved to: commission-changes-detailed.json`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixCommissionsByProductId().catch(console.error);
