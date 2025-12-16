const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import correct commission mapping
const { PRODUCT_MEMBERSHIP_MAPPING, getCommissionForProduct } = require('./scripts/migration/product-membership-mapping.js');

async function fixCommissionWithOrderMatching() {
  console.log('🔧 FIX COMMISSION - Match ke Sejoli Order untuk Product ID yang TEPAT');
  console.log('=========================================================================\n');

  try {
    // 1. Load sejoli data
    const sejoliFull = fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8');
    const sejoli = JSON.parse(sejoliFull);
    
    console.log(`📊 Loaded ${sejoli.orders.length} orders from Sejoli\n`);
    
    // 2. Create order lookup by Sejoli order ID
    const orderById = new Map();
    sejoli.orders.forEach(order => {
      if (order.status === 'completed' && order.affiliate_id && order.affiliate_id !== '0') {
        orderById.set(order.id.toString(), order);
      }
    });
    
    console.log(`📋 Found ${orderById.size} completed orders with affiliate\n`);
    
    // 3. Get all transactions with their conversions
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        affiliateId: { not: null }
      },
      include: {
        affiliateConversion: true
      }
    });
    
    console.log(`💰 Found ${transactions.length} transactions with affiliate\n`);
    
    // 4. Match and update commissions
    let updated = 0;
    let notMatched = 0;
    let alreadyCorrect = 0;
    let totalOldComm = 0;
    let totalNewComm = 0;
    
    const changes = [];
    const unmatchedTransactions = [];
    
    for (const tx of transactions) {
      if (!tx.affiliateConversion) {
        notMatched++;
        continue;
      }
      
      // Extract Sejoli order ID from externalId
      // externalId format bisa: "sejoli_123", "123", atau format lain
      let sejoliOrderId = null;
      
      if (tx.externalId) {
        // Try to extract number from externalId
        const match = tx.externalId.match(/\d+/);
        if (match) {
          sejoliOrderId = match[0];
        }
      }
      
      // Try to find matching Sejoli order
      let sejoliOrder = null;
      
      if (sejoliOrderId && orderById.has(sejoliOrderId)) {
        sejoliOrder = orderById.get(sejoliOrderId);
      }
      
      // If not found by ID, try to match by amount and approximate time
      if (!sejoliOrder) {
        // Find orders with same amount
        const matchingOrders = Array.from(orderById.values()).filter(o => 
          parseFloat(o.grand_total) === tx.amount
        );
        
        if (matchingOrders.length === 1) {
          sejoliOrder = matchingOrders[0];
        } else if (matchingOrders.length > 1) {
          // Multiple matches - try to match by date proximity
          const txDate = new Date(tx.createdAt);
          let closestOrder = null;
          let minTimeDiff = Infinity;
          
          matchingOrders.forEach(o => {
            const orderDate = new Date(o.created_at);
            const timeDiff = Math.abs(txDate - orderDate);
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              closestOrder = o;
            }
          });
          
          // Only use if within 7 days
          if (minTimeDiff < 7 * 24 * 60 * 60 * 1000) {
            sejoliOrder = closestOrder;
          }
        }
      }
      
      if (!sejoliOrder) {
        notMatched++;
        unmatchedTransactions.push({
          txId: tx.id,
          externalId: tx.externalId,
          amount: tx.amount,
          currentCommission: tx.affiliateConversion.commissionAmount
        });
        continue;
      }
      
      // Get correct commission from product_id
      const productId = parseInt(sejoliOrder.product_id);
      const correctCommission = getCommissionForProduct(productId);
      const currentCommission = tx.affiliateConversion.commissionAmount;
      
      if (correctCommission !== currentCommission) {
        totalOldComm += currentCommission;
        totalNewComm += correctCommission;
        
        await prisma.affiliateConversion.update({
          where: { id: tx.affiliateConversion.id },
          data: { commissionAmount: correctCommission }
        });
        
        const productInfo = PRODUCT_MEMBERSHIP_MAPPING[productId];
        changes.push({
          txId: tx.id,
          externalId: tx.externalId,
          amount: tx.amount,
          productId: productId,
          productName: productInfo?.name || `Unknown (${productId})`,
          oldCommission: currentCommission,
          newCommission: correctCommission
        });
        
        updated++;
        
        if (updated % 100 === 0) {
          console.log(`   Processing... ${updated} updated`);
        }
      } else {
        alreadyCorrect++;
      }
    }
    
    console.log('\n📊 HASIL UPDATE:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Already Correct: ${alreadyCorrect}`);
    console.log(`   ❓ Not Matched: ${notMatched}`);
    
    console.log('\n💰 PERUBAHAN TOTAL KOMISI:');
    console.log(`   Old Total: Rp ${totalOldComm.toLocaleString('id-ID')}`);
    console.log(`   New Total: Rp ${totalNewComm.toLocaleString('id-ID')}`);
    console.log(`   Difference: Rp ${(totalNewComm - totalOldComm).toLocaleString('id-ID')}`);
    
    // Show top 30 changes
    console.log('\n📝 TOP 30 PERUBAHAN:');
    changes.slice(0, 30).forEach((c, i) => {
      console.log(`   ${i+1}. [${c.productId}] ${c.productName}`);
      console.log(`      Rp ${c.amount?.toLocaleString('id-ID')} | ${c.oldCommission?.toLocaleString('id-ID')} → ${c.newCommission?.toLocaleString('id-ID')}\n`);
    });
    
    // Show sample unmatched
    if (unmatchedTransactions.length > 0) {
      console.log('\n⚠️  SAMPLE UNMATCHED TRANSACTIONS (first 10):');
      unmatchedTransactions.slice(0, 10).forEach(u => {
        console.log(`   TX ${u.txId} | External: ${u.externalId} | Rp ${u.amount?.toLocaleString('id-ID')} | Current Comm: Rp ${u.currentCommission?.toLocaleString('id-ID')}`);
      });
    }
    
    // Final total
    const finalTotal = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    
    console.log('\n🎉 FINAL TOTAL COMMISSION:');
    console.log(`   💵 Rp ${finalTotal._sum.commissionAmount?.toLocaleString('id-ID')}`);
    
    // Save detailed changes to file
    fs.writeFileSync(
      'commission-order-matching-changes.json',
      JSON.stringify({ changes, unmatchedTransactions }, null, 2)
    );
    console.log(`\n📄 Detailed changes saved to: commission-order-matching-changes.json`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixCommissionWithOrderMatching().catch(console.error);
