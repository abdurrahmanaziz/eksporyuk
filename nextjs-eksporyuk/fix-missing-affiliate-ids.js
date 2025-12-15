const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMissingAffiliateIds() {
  console.log('🔧 FIX MISSING AFFILIATE IDs in TRANSACTIONS');
  console.log('============================================');

  try {
    // 1. Load sejoli data
    const sejoliFull = fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8');
    const sejoli = JSON.parse(sejoliFull);
    
    console.log(`📊 Loaded ${sejoli.orders.length} orders from Sejoli`);
    
    // 2. Filter orders with affiliate_id
    const ordersWithAffiliate = sejoli.orders.filter(order => 
      order.affiliate_id && order.affiliate_id !== '0' && order.status === 'completed'
    );
    
    console.log(`🎯 Found ${ordersWithAffiliate.length} completed orders with affiliate_id`);
    
    // 3. Get all affiliate profiles for mapping
    const affiliateProfiles = await prisma.affiliateProfile.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`📋 Found ${affiliateProfiles.length} affiliate profiles in database`);
    
    // 4. Create mapping: Sejoli affiliate_id -> Eksporyuk AffiliateProfile.id
    const affiliateMapping = new Map();
    
    // Match by email (since that's how users were migrated)
    for (const order of ordersWithAffiliate) {
      // Find the affiliate user in Sejoli data
      const affiliateUser = sejoli.users.find(u => u.id === order.affiliate_id);
      if (affiliateUser) {
        // Find corresponding affiliate profile in Eksporyuk by email
        const eksporyukAffiliate = affiliateProfiles.find(ap => 
          ap.user.email === affiliateUser.user_email
        );
        
        if (eksporyukAffiliate) {
          affiliateMapping.set(order.affiliate_id, eksporyukAffiliate.id);
        }
      }
    }
    
    console.log(`🔗 Created mapping for ${affiliateMapping.size} affiliates`);
    
    // 5. Update transactions with affiliateId
    let updated = 0;
    let notFound = 0;
    
    console.log('\\n🔄 Updating transactions with affiliateId...');
    
    for (const order of ordersWithAffiliate) {
      try {
        const affiliateProfileId = affiliateMapping.get(order.affiliate_id);
        
        if (!affiliateProfileId) {
          notFound++;
          continue;
        }
        
        // Find transaction by amount and approximate date (since externalId might be different)
        const transaction = await prisma.transaction.findFirst({
          where: {
            amount: parseFloat(order.grand_total),
            status: 'SUCCESS',
            affiliateId: null // Only update if not already set
          }
        });
        
        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { affiliateId: affiliateProfileId }
          });
          
          updated++;
          
          if (updated % 100 === 0) {
            console.log(`   ✅ Updated ${updated} transactions...`);
          }
        }
        
      } catch (error) {
        console.error(`   ❌ Error updating transaction for order ${order.id}:`, error.message);
      }
    }
    
    console.log('\\n📊 HASIL UPDATE:');
    console.log(`   ✅ Updated transactions: ${updated}`);
    console.log(`   ❓ Affiliate not found: ${notFound}`);
    
    // 6. Verify results
    const transactionsWithAffiliate = await prisma.transaction.count({
      where: { affiliateId: { not: null } }
    });
    
    console.log(`\\n✅ Final result: ${transactionsWithAffiliate} transactions now have affiliateId`);
    
    // 7. Now run create affiliate conversions
    console.log('\\n🚀 Creating AffiliateConversions...');
    
    const transactionsForConversion = await prisma.transaction.findMany({
      where: {
        affiliateId: { not: null },
        status: 'SUCCESS',
        affiliateConversion: null
      }
    });
    
    console.log(`📝 Creating ${transactionsForConversion.length} affiliate conversions...`);
    
    // Load commission mapping
    const productCommissionMap = {
      248999: 50000,  // 249k -> 50k
      249999: 50000,  // 250k -> 50k  
      499000: 150000, // 499k -> 150k
      999000: 300000, // 999k -> 300k
      1999000: 600000, // 1.999jt -> 600k
      2999000: 900000  // 2.999jt -> 900k
    };
    
    let conversionsCreated = 0;
    
    for (const tx of transactionsForConversion) {
      try {
        const commissionAmount = productCommissionMap[tx.amount] || Math.round(tx.amount * 0.3);
        
        await prisma.affiliateConversion.create({
          data: {
            affiliateId: tx.affiliateId,
            transactionId: tx.id,
            commissionAmount: commissionAmount,
            commissionRate: 30,
            paidOut: false
          }
        });
        
        conversionsCreated++;
        
        if (conversionsCreated % 200 === 0) {
          console.log(`   ✅ Created ${conversionsCreated} conversions...`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error creating conversion for tx ${tx.id}:`, error.message);
      }
    }
    
    console.log(`\\n🎉 COMPLETED! Created ${conversionsCreated} affiliate conversions`);
    
    // Final stats
    const finalConversions = await prisma.affiliateConversion.count();
    const totalCommission = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    
    console.log('\\n📊 FINAL STATISTICS:');
    console.log(`   💰 Total AffiliateConversions: ${finalConversions}`);
    console.log(`   💵 Total Commission: Rp ${totalCommission._sum.commissionAmount?.toLocaleString('id-ID') || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingAffiliateIds().catch(console.error);