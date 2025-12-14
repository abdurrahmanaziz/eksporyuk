/**
 * CREATE AFFILIATE PROFILES - Only for users who earned commission
 * Based on imported transactions with affiliate metadata
 */

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Commission rate - standard affiliate rate
const COMMISSION_RATE = 0.30; // 30%

(async () => {
  console.log('🤝 CREATING AFFILIATE PROFILES FOR COMMISSION EARNERS\n');
  
  // Get all transactions with affiliate metadata
  console.log('📊 Analyzing transactions with affiliate data...');
  
  const transactionsWithAffiliates = await p.transaction.findMany({
    where: {
      status: 'SUCCESS',
      metadata: {
        not: undefined
      }
    }
  });
  
  console.log(`Found ${transactionsWithAffiliates.length} successful transactions\n`);
  
  // Parse affiliate data from metadata
  const affiliateEarnings = new Map(); // userId => { totalCommission, orderCount, totalValue }
  let processedCount = 0;
  
  for (const tx of transactionsWithAffiliates) {
    try {
      const metadata = JSON.parse(tx.metadata);
      const affiliateId = metadata.affiliateId;
      
      if (affiliateId && affiliateId > 0) {
        // Find affiliate user by their original WordPress user ID
        // We need to match affiliateId (WP user ID) to current user
        // This requires checking against our imported user data
        
        const commission = tx.amount * COMMISSION_RATE;
        processedCount++;
        
        // For now, we'll track the affiliate WP IDs and process later
        if (!affiliateEarnings.has(affiliateId)) {
          affiliateEarnings.set(affiliateId, {
            wpUserId: affiliateId,
            totalCommission: 0,
            orderCount: 0,
            totalValue: 0,
            orders: []
          });
        }
        
        const stats = affiliateEarnings.get(affiliateId);
        stats.totalCommission += commission;
        stats.orderCount += 1;
        stats.totalValue += tx.amount;
        stats.orders.push(tx.id);
      }
    } catch (error) {
      // Skip invalid metadata
    }
  }
  
  console.log(`📈 AFFILIATE ANALYSIS:`)
  console.log(`  Processed transactions: ${processedCount}`);
  console.log(`  Unique affiliate IDs: ${affiliateEarnings.size}`);
  
  // Get top affiliates by commission
  const topAffiliates = Array.from(affiliateEarnings.values())
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 20);
  
  console.log(`\\n🏆 TOP 20 AFFILIATES BY COMMISSION:`);
  topAffiliates.forEach((aff, idx) => {
    console.log(`${idx + 1}. WP User ${aff.wpUserId}: ${aff.orderCount} orders, Rp ${aff.totalCommission.toLocaleString()} commission`);
  });
  
  // Now we need to map WP User IDs to current user IDs
  console.log(`\\n🔄 MAPPING AFFILIATE WP IDs to Current Users...`);
  
  // Load the original JSON data to get WP user email mapping
  const fs = require('fs');
  const jsonPath = './scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
  const originalData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Build WP user ID to email mapping
  const wpUserMap = new Map();
  originalData.users.forEach(u => wpUserMap.set(u.id, u.user_email));
  
  // Get current users
  const currentUsers = await p.user.findMany({
    select: { id: true, email: true }
  });
  const emailToUserIdMap = new Map();
  currentUsers.forEach(u => emailToUserIdMap.set(u.email, u.id));
  
  console.log(`Loaded ${wpUserMap.size} WP users and ${emailToUserIdMap.size} current users\\n`);
  
  // Create affiliate profiles
  let affiliatesCreated = 0;
  let totalCommissionDistributed = 0;
  
  console.log('🚀 CREATING AFFILIATE PROFILES...\\n');
  
  for (const [wpUserId, stats] of affiliateEarnings.entries()) {
    const email = wpUserMap.get(wpUserId);
    if (!email) continue;
    
    const currentUserId = emailToUserIdMap.get(email);
    if (!currentUserId) continue;
    
    try {
      // Generate unique affiliate code
      const user = currentUsers.find(u => u.id === currentUserId);
      const affiliateCode = `AFF${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      const shortLink = `${user.email.split('@')[0].toLowerCase()}-aff`;
      
      // Create affiliate profile
      const affiliateProfile = await p.affiliateProfile.upsert({
        where: { userId: currentUserId },
        update: {
          totalSales: stats.totalCommission,
          totalEarnings: stats.totalCommission
        },
        create: {
          userId: currentUserId,
          affiliateCode: affiliateCode,
          shortLink: shortLink,
          commissionRate: 30,
          totalConversions: stats.orderCount,
          totalSales: stats.totalCommission,
          totalEarnings: stats.totalCommission,
          isActive: true,
          applicationStatus: 'APPROVED'
        }
      });
      
      // Update wallet balance
      await p.wallet.update({
        where: { userId: currentUserId },
        data: {
          balance: { increment: stats.totalCommission },
          totalEarnings: { increment: stats.totalCommission }
        }
      });
      
      affiliatesCreated++;
      totalCommissionDistributed += stats.totalCommission;
      
      console.log(`✓ ${email}: ${stats.orderCount} orders, Rp ${stats.totalCommission.toLocaleString()} commission`);
      
    } catch (error) {
      console.log(`⚠️  Error for ${email}:`, error.message);
    }
  }
  
  console.log('\\n═══════════════════════════════════════');
  console.log('🎉 AFFILIATE CREATION COMPLETE!');
  console.log('═══════════════════════════════════════');
  console.log(`🤝 Affiliates Created: ${affiliatesCreated}`);
  console.log(`💰 Total Commission: Rp ${totalCommissionDistributed.toLocaleString()}`);
  console.log(`💰 Average per Affiliate: Rp ${(totalCommissionDistributed / affiliatesCreated).toLocaleString()}`);
  
  // Final count
  const finalAffiliateCount = await p.affiliateProfile.count();
  console.log(`📊 Total Affiliates in DB: ${finalAffiliateCount}`);
  console.log('═══════════════════════════════════════\\n');
  
  await p.$disconnect();
})();