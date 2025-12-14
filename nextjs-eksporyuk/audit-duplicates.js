/**
 * COMPREHENSIVE DUPLICATE CHECK - Audit database for duplications
 * Check for duplicate transactions, commissions, users, memberships
 */

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  console.log('🔍 COMPREHENSIVE DUPLICATE CHECK - DATABASE AUDIT\n');
  console.log('═'.repeat(80));
  
  // 1. CHECK DUPLICATE USERS
  console.log('👥 CHECKING DUPLICATE USERS...\n');
  
  const duplicateEmails = await p.$queryRaw`
    SELECT email, COUNT(*) as count 
    FROM "User" 
    GROUP BY email 
    HAVING COUNT(*) > 1 
    ORDER BY count DESC
  `;
  
  console.log(`Found ${duplicateEmails.length} duplicate emails:`);
  if (duplicateEmails.length > 0) {
    duplicateEmails.slice(0, 10).forEach(dup => {
      console.log(`  ❌ ${dup.email}: ${dup.count} accounts`);
    });
  } else {
    console.log('  ✅ No duplicate emails found');
  }
  
  // 2. CHECK DUPLICATE TRANSACTIONS
  console.log('\n💳 CHECKING DUPLICATE TRANSACTIONS...\n');
  
  // Check for identical transactions (same user, amount, date)
  const duplicateTransactions = await p.$queryRaw`
    SELECT "userId", amount, DATE("createdAt") as date, COUNT(*) as count
    FROM "Transaction"
    GROUP BY "userId", amount, DATE("createdAt")
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 20
  `;
  
  console.log(`Found ${duplicateTransactions.length} potential duplicate transaction groups:`);
  if (duplicateTransactions.length > 0) {
    duplicateTransactions.slice(0, 10).forEach(dup => {
      console.log(`  ⚠️  User ${dup.userId}: ${dup.count} transactions of Rp ${parseFloat(dup.amount).toLocaleString()} on ${dup.date}`);
    });
  } else {
    console.log('  ✅ No obvious duplicate transactions found');
  }
  
  // Check transactions from same metadata (Sejoli order ID)
  console.log('\n🔍 CHECKING SEJOLI ORDER ID DUPLICATES...\n');
  
  const transactionsWithMetadata = await p.transaction.findMany({
    where: {
      metadata: { not: undefined }
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      metadata: true,
      createdAt: true
    }
  });
  
  const orderIdMap = new Map();
  let duplicateOrderIds = 0;
  
  transactionsWithMetadata.forEach(tx => {
    try {
      const metadata = JSON.parse(tx.metadata);
      const orderId = metadata.orderId || metadata.sejoliOrderId;
      
      if (orderId) {
        if (orderIdMap.has(orderId)) {
          orderIdMap.get(orderId).push(tx);
          duplicateOrderIds++;
        } else {
          orderIdMap.set(orderId, [tx]);
        }
      }
    } catch (e) {
      // Skip invalid metadata
    }
  });
  
  const duplicateOrders = Array.from(orderIdMap.entries()).filter(([_, txs]) => txs.length > 1);
  
  console.log(`Found ${duplicateOrders.length} Sejoli orders with multiple transactions:`);
  if (duplicateOrders.length > 0) {
    duplicateOrders.slice(0, 5).forEach(([orderId, txs]) => {
      console.log(`  ❌ Order ${orderId}: ${txs.length} transactions`);
      txs.forEach(tx => {
        console.log(`    - TX ${tx.id}: User ${tx.userId}, Rp ${parseFloat(tx.amount).toLocaleString()}, ${tx.createdAt.toISOString().split('T')[0]}`);
      });
    });
  } else {
    console.log('  ✅ No duplicate Sejoli orders found');
  }
  
  // 3. CHECK DUPLICATE MEMBERSHIPS
  console.log('\n🎫 CHECKING DUPLICATE MEMBERSHIPS...\n');
  
  const duplicateMemberships = await p.$queryRaw`
    SELECT "userId", "membershipId", COUNT(*) as count
    FROM "UserMembership"
    GROUP BY "userId", "membershipId"
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;
  
  console.log(`Found ${duplicateMemberships.length} users with duplicate memberships:`);
  if (duplicateMemberships.length > 0) {
    duplicateMemberships.slice(0, 10).forEach(dup => {
      console.log(`  ❌ User ${dup.userId}: ${dup.count} instances of membership ${dup.membershipId}`);
    });
  } else {
    console.log('  ✅ No duplicate memberships found');
  }
  
  // 4. CHECK DUPLICATE AFFILIATE PROFILES
  console.log('\n🤝 CHECKING DUPLICATE AFFILIATE PROFILES...\n');
  
  const duplicateAffiliates = await p.$queryRaw`
    SELECT "userId", COUNT(*) as count
    FROM "AffiliateProfile"
    GROUP BY "userId"
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;
  
  console.log(`Found ${duplicateAffiliates.length} users with duplicate affiliate profiles:`);
  if (duplicateAffiliates.length > 0) {
    duplicateAffiliates.slice(0, 10).forEach(dup => {
      console.log(`  ❌ User ${dup.userId}: ${dup.count} affiliate profiles`);
    });
  } else {
    console.log('  ✅ No duplicate affiliate profiles found');
  }
  
  // 5. CHECK COMMISSION CALCULATION INTEGRITY
  console.log('\n💰 CHECKING COMMISSION INTEGRITY...\n');
  
  const affiliatesWithEarnings = await p.affiliateProfile.findMany({
    include: {
      user: { select: { email: true } }
    },
    orderBy: { totalEarnings: 'desc' },
    take: 10
  });
  
  console.log('Top 10 affiliates - commission vs wallet balance:');
  
  for (const aff of affiliatesWithEarnings) {
    const wallet = await p.wallet.findUnique({
      where: { userId: aff.userId }
    });
    
    const earnings = parseFloat(aff.totalEarnings);
    const balance = wallet ? parseFloat(wallet.balance) : 0;
    const isConsistent = Math.abs(earnings - balance) < 1000; // Allow Rp 1000 tolerance
    
    console.log(`  ${isConsistent ? '✅' : '❌'} ${aff.user.email}:`);
    console.log(`    Affiliate earnings: Rp ${earnings.toLocaleString()}`);
    console.log(`    Wallet balance: Rp ${balance.toLocaleString()}`);
    console.log(`    Difference: Rp ${Math.abs(earnings - balance).toLocaleString()}`);
  }
  
  // 6. TRANSACTION STATISTICS
  console.log('\n📊 TRANSACTION STATISTICS...\n');
  
  const txStats = await p.$queryRaw`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount
    FROM "Transaction"
    GROUP BY status
    ORDER BY count DESC
  `;
  
  console.log('Transaction breakdown by status:');
  txStats.forEach(stat => {
    console.log(`  ${stat.status}: ${stat.count} transactions, Total: Rp ${parseFloat(stat.total_amount).toLocaleString()}, Avg: Rp ${parseFloat(stat.avg_amount).toLocaleString()}`);
  });
  
  // 7. CHECK FOR ORPHANED RECORDS
  console.log('\n🔗 CHECKING ORPHANED RECORDS...\n');
  
  // Transactions without users
  const orphanedTransactions = await p.$queryRaw`
    SELECT COUNT(*) as count
    FROM "Transaction" t
    LEFT JOIN "User" u ON t."userId" = u.id
    WHERE u.id IS NULL
  `;
  
  console.log(`Orphaned transactions (no user): ${orphanedTransactions[0].count}`);
  
  // Memberships without users
  const orphanedMemberships = await p.$queryRaw`
    SELECT COUNT(*) as count
    FROM "UserMembership" um
    LEFT JOIN "User" u ON um."userId" = u.id
    WHERE u.id IS NULL
  `;
  
  console.log(`Orphaned memberships (no user): ${orphanedMemberships[0].count}`);
  
  // Affiliates without users
  const orphanedAffiliates = await p.$queryRaw`
    SELECT COUNT(*) as count
    FROM "AffiliateProfile" ap
    LEFT JOIN "User" u ON ap."userId" = u.id
    WHERE u.id IS NULL
  `;
  
  console.log(`Orphaned affiliates (no user): ${orphanedAffiliates[0].count}`);
  
  // 8. SUMMARY
  console.log('\n═'.repeat(80));
  console.log('📋 DUPLICATE CHECK SUMMARY');
  console.log('═'.repeat(80));
  
  const hasDuplicates = duplicateEmails.length > 0 || 
                       duplicateTransactions.length > 0 || 
                       duplicateOrders.length > 0 ||
                       duplicateMemberships.length > 0 || 
                       duplicateAffiliates.length > 0;
  
  if (hasDuplicates) {
    console.log('⚠️  DUPLICATES FOUND - Action may be required:');
    console.log(`  - Duplicate emails: ${duplicateEmails.length}`);
    console.log(`  - Duplicate transaction patterns: ${duplicateTransactions.length}`);
    console.log(`  - Duplicate Sejoli orders: ${duplicateOrders.length}`);
    console.log(`  - Duplicate memberships: ${duplicateMemberships.length}`);
    console.log(`  - Duplicate affiliates: ${duplicateAffiliates.length}`);
  } else {
    console.log('✅ NO MAJOR DUPLICATES FOUND - Database integrity looks good!');
  }
  
  console.log('═'.repeat(80));
  
  await p.$disconnect();
})();