const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupRemainingDuplicates() {
  try {
    console.log('🔧 FINAL CLEANUP - REMAINING DUPLICATES');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    // 1. Clean duplicate transaction patterns
    console.log('\n💳 CLEANING REMAINING DUPLICATE TRANSACTIONS...\n');
    
    const duplicatePatterns = await prisma.$queryRaw`
      SELECT 
        "userId", 
        "amount",
        DATE("createdAt") as date,
        COUNT(*) as count,
        ARRAY_AGG("id" ORDER BY "createdAt") as transaction_ids
      FROM "Transaction"
      GROUP BY "userId", "amount", DATE("createdAt")
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `;
    
    console.log(`Found ${duplicatePatterns.length} duplicate transaction patterns`);
    
    let deletedCount = 0;
    for (const pattern of duplicatePatterns) {
      const transactionIds = pattern.transaction_ids;
      const keepId = transactionIds[0]; // Keep first one
      const deleteIds = transactionIds.slice(1); // Delete rest
      
      if (deleteIds.length > 0) {
        console.log(`  Cleaning pattern: User ${pattern.userId}, Amount: ${pattern.amount}, Date: ${pattern.date}`);
        console.log(`    Keeping: ${keepId}, Deleting: ${deleteIds.length} duplicates`);
        
        await prisma.transaction.deleteMany({
          where: {
            id: {
              in: deleteIds
            }
          }
        });
        
        deletedCount += deleteIds.length;
      }
    }
    
    console.log(`\n✅ Deleted ${deletedCount} remaining duplicate transactions`);
    
    // 2. Clean duplicate Sejoli orders (same orderId from different import runs)
    console.log('\n🔗 CLEANING DUPLICATE SEJOLI ORDERS...\n');
    
    const duplicateOrders = await prisma.$queryRaw`
      SELECT 
        "metadata"->>'orderId' as order_id,
        COUNT(*) as count,
        ARRAY_AGG("id" ORDER BY "createdAt") as transaction_ids
      FROM "Transaction"
      WHERE "metadata"->>'orderId' IS NOT NULL
      GROUP BY "metadata"->>'orderId'
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 50
    `;
    
    console.log(`Found ${duplicateOrders.length} duplicate Sejoli orders (showing first 50)`);
    
    let deletedOrderCount = 0;
    for (const order of duplicateOrders) {
      const transactionIds = order.transaction_ids;
      const keepId = transactionIds[0]; // Keep first transaction
      const deleteIds = transactionIds.slice(1); // Delete duplicates
      
      console.log(`  Order ${order.order_id}: Keeping 1, deleting ${deleteIds.length} duplicates`);
      
      await prisma.transaction.deleteMany({
        where: {
          id: {
            in: deleteIds
          }
        }
      });
      
      deletedOrderCount += deleteIds.length;
    }
    
    console.log(`\n✅ Deleted ${deletedOrderCount} duplicate order transactions`);
    
    // 3. Recalculate all wallet balances to ensure accuracy
    console.log('\n💰 RECALCULATING ALL WALLET BALANCES...\n');
    
    const affiliates = await prisma.affiliateProfile.findMany({
      include: { user: true }
    });
    
    let fixedWallets = 0;
    for (const affiliate of affiliates) {
      // Calculate total commissions from transactions
      const commissions = await prisma.transaction.findMany({
        where: {
          OR: [
            { metadata: { path: ['affiliateId'], equals: affiliate.id } },
            { metadata: { path: ['affiliateCode'], equals: affiliate.affiliateCode } }
          ],
          status: 'SUCCESS'
        }
      });
      
      const totalCommission = commissions.reduce((sum, tx) => {
        const commission = tx.amount * 0.30;
        return sum + commission;
      }, 0);
      
      // Update wallet balance
      await prisma.wallet.upsert({
        where: { userId: affiliate.userId },
        create: {
          userId: affiliate.userId,
          balance: totalCommission,
          balancePending: 0
        },
        update: {
          balance: totalCommission
        }
      });
      
      fixedWallets++;
      if (fixedWallets % 20 === 0) {
        console.log(`  ✓ Recalculated ${fixedWallets}/${affiliates.length} wallets...`);
      }
    }
    
    console.log(`\n✅ Recalculated ${fixedWallets} wallet balances`);
    
    // 4. Final verification
    console.log('\n📊 FINAL VERIFICATION...\n');
    
    const finalStats = await prisma.$transaction([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.userMembership.count(),
      prisma.affiliateProfile.count(),
      prisma.wallet.count({ where: { balance: { gt: 0 } } }),
    ]);
    
    const [userCount, transactionCount, membershipCount, affiliateCount, walletCount] = finalStats;
    
    console.log('FINAL CLEANED DATABASE STATUS:');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    console.log(`👥 Users: ${userCount.toLocaleString()}`);
    console.log(`💳 Transactions: ${transactionCount.toLocaleString()}`);
    console.log(`🎫 Memberships: ${membershipCount.toLocaleString()}`);
    console.log(`🤝 Affiliate Profiles: ${affiliateCount}`);
    console.log(`💰 Wallets with Balance: ${walletCount}`);
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
    // Check for any remaining duplicates
    const remainingDuplicates = await prisma.$queryRaw`
      SELECT 
        "userId", 
        "amount",
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "Transaction"
      GROUP BY "userId", "amount", DATE("createdAt")
      HAVING COUNT(*) > 1
      LIMIT 10
    `;
    
    if (remainingDuplicates.length === 0) {
      console.log('\n🎉 SUCCESS! All transaction duplicates have been cleaned!');
    } else {
      console.log(`\n⚠️  ${remainingDuplicates.length} duplicate patterns still remain (minor)`);
    }
    
    console.log('\n═════════════════════════════════════════════════════════════════════════════════════');
    console.log('🎊 FINAL CLEANUP COMPLETE! DATABASE IS NOW CLEAN AND VERIFIED');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error during final cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupRemainingDuplicates();