/**
 * CLEAN DUPLICATES - Remove duplicate transactions and fix data integrity
 */

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  console.log('🧹 CLEANING DUPLICATE DATA\n');
  console.log('═'.repeat(80));
  
  // STEP 1: Find and remove duplicate transactions
  console.log('💳 CLEANING DUPLICATE TRANSACTIONS...\n');
  
  // Find transactions grouped by user, amount, and date
  const duplicateGroups = await p.$queryRaw`
    SELECT "userId", amount, DATE("createdAt") as date, COUNT(*) as count, 
           array_agg(id ORDER BY "createdAt" DESC) as transaction_ids
    FROM "Transaction"
    GROUP BY "userId", amount, DATE("createdAt")
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;
  
  console.log(`Found ${duplicateGroups.length} groups with duplicate transactions`);
  
  let deletedTransactions = 0;
  
  for (const group of duplicateGroups) {
    const txIds = group.transaction_ids;
    // Keep the first one, delete the rest
    const toDelete = txIds.slice(1);
    
    console.log(`User ${group.userId}, Amount: ${group.amount}, Date: ${group.date}`);
    console.log(`  Keeping: ${txIds[0]}, Deleting: ${toDelete.length} duplicates`);
    
    if (toDelete.length > 0) {
      await p.transaction.deleteMany({
        where: {
          id: { in: toDelete }
        }
      });
      deletedTransactions += toDelete.length;
    }
  }
  
  console.log(`\n✅ Deleted ${deletedTransactions} duplicate transactions\n`);
  
  // STEP 2: Clean duplicate memberships
  console.log('🎫 CLEANING DUPLICATE MEMBERSHIPS...\n');
  
  const duplicateMemberships = await p.$queryRaw`
    SELECT "userId", "membershipId", COUNT(*) as count,
           array_agg(id ORDER BY "createdAt" DESC) as membership_ids
    FROM "UserMembership"
    GROUP BY "userId", "membershipId"
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;
  
  console.log(`Found ${duplicateMemberships.length} users with duplicate memberships`);
  
  let deletedMemberships = 0;
  
  for (const group of duplicateMemberships) {
    const memIds = group.membership_ids;
    const toDelete = memIds.slice(1);
    
    console.log(`User ${group.userId}, Membership: ${group.membershipId}`);
    console.log(`  Keeping: ${memIds[0]}, Deleting: ${toDelete.length} duplicates`);
    
    if (toDelete.length > 0) {
      await p.userMembership.deleteMany({
        where: {
          id: { in: toDelete }
        }
      });
      deletedMemberships += toDelete.length;
    }
  }
  
  console.log(`\n✅ Deleted ${deletedMemberships} duplicate memberships\n`);
  
  // STEP 3: Clean duplicate affiliate profiles  
  console.log('🤝 CLEANING DUPLICATE AFFILIATE PROFILES...\n');
  
  const duplicateAffiliates = await p.$queryRaw`
    SELECT "userId", COUNT(*) as count,
           array_agg(id ORDER BY "createdAt" DESC) as affiliate_ids
    FROM "AffiliateProfile"
    GROUP BY "userId"
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;
  
  console.log(`Found ${duplicateAffiliates.length} users with duplicate affiliate profiles`);
  
  let deletedAffiliates = 0;
  
  for (const group of duplicateAffiliates) {
    const affIds = group.affiliate_ids;
    const toDelete = affIds.slice(1);
    
    console.log(`User ${group.userId}: Keeping ${affIds[0]}, Deleting ${toDelete.length} duplicates`);
    
    if (toDelete.length > 0) {
      await p.affiliateProfile.deleteMany({
        where: {
          id: { in: toDelete }
        }
      });
      deletedAffiliates += toDelete.length;
    }
  }
  
  console.log(`\n✅ Deleted ${deletedAffiliates} duplicate affiliate profiles\n`);
  
  // STEP 4: Fix wallet balances (recalculate from affiliate profiles)
  console.log('💰 RECALCULATING WALLET BALANCES...\n');
  
  const affiliates = await p.affiliateProfile.findMany({
    select: {
      userId: true,
      totalEarnings: true
    }
  });
  
  let walletsFixed = 0;
  
  for (const aff of affiliates) {
    const earnings = parseFloat(aff.totalEarnings);
    
    // Reset wallet to exactly match affiliate earnings
    await p.wallet.update({
      where: { userId: aff.userId },
      data: {
        balance: earnings,
        totalEarnings: earnings
      }
    });
    
    walletsFixed++;
    
    if (walletsFixed % 20 === 0) {
      console.log(`  ✓ Fixed ${walletsFixed}/${affiliates.length} wallets...`);
    }
  }
  
  console.log(`\n✅ Fixed ${walletsFixed} wallet balances\n`);
  
  // STEP 5: Final count verification
  console.log('📊 POST-CLEANUP VERIFICATION...\n');
  
  const [finalUsers, finalTx, finalMem, finalAff, finalWallets] = await Promise.all([
    p.user.count(),
    p.transaction.count(), 
    p.userMembership.count(),
    p.affiliateProfile.count(),
    p.wallet.count({ where: { balance: { gt: 0 } } })
  ]);
  
  console.log('CLEANED DATABASE STATUS:');
  console.log('──────────────────────────────────────────────────────────────────────────────');
  console.log(`👥 Users: ${finalUsers.toLocaleString()}`);
  console.log(`💳 Transactions: ${finalTx.toLocaleString()} (removed ${deletedTransactions} duplicates)`);
  console.log(`🎫 Memberships: ${finalMem.toLocaleString()} (removed ${deletedMemberships} duplicates)`);
  console.log(`🤝 Affiliate Profiles: ${finalAff.toLocaleString()} (removed ${deletedAffiliates} duplicates)`);
  console.log(`💰 Wallets with Balance: ${finalWallets.toLocaleString()}`);
  console.log('──────────────────────────────────────────────────────────────────────────────');
  
  // Check for remaining duplicates
  const remainingDuplicates = await p.$queryRaw`
    SELECT "userId", amount, DATE("createdAt") as date, COUNT(*) as count
    FROM "Transaction"
    GROUP BY "userId", amount, DATE("createdAt")
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 5
  `;
  
  if (remainingDuplicates.length > 0) {
    console.log('\n⚠️  Some duplicates may remain:');
    remainingDuplicates.forEach(dup => {
      console.log(`  User ${dup.userId}: ${dup.count} transactions on ${dup.date}`);
    });
  } else {
    console.log('\n✅ NO MORE DUPLICATE TRANSACTIONS FOUND!');
  }
  
  console.log('\n═'.repeat(80));
  console.log('🎉 DUPLICATE CLEANUP COMPLETE!');
  console.log('═'.repeat(80));
  console.log(`Summary:`);
  console.log(`  🗑️  Deleted ${deletedTransactions} duplicate transactions`);
  console.log(`  🗑️  Deleted ${deletedMemberships} duplicate memberships`);  
  console.log(`  🗑️  Deleted ${deletedAffiliates} duplicate affiliate profiles`);
  console.log(`  💰 Fixed ${walletsFixed} wallet balances`);
  console.log('');
  
  await p.$disconnect();
})();