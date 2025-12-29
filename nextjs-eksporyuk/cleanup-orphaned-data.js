const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOrphanedData() {
  console.log('🧹 CLEANING UP ORPHANED AFFILIATE DATA\n');
  
  try {
    // Get total before cleanup
    const orphanedTotal = await prisma.$queryRaw`
      SELECT COUNT(*) as count, SUM("commissionAmount") as total
      FROM "AffiliateConversion"
      LEFT JOIN "AffiliateProfile" ON "AffiliateConversion"."affiliateId" = "AffiliateProfile"."id"
      WHERE "AffiliateProfile"."id" IS NULL
    `;
    
    const totalOrphaned = orphanedTotal[0].count;
    const totalAmount = Number(orphanedTotal[0].total || 0);
    
    console.log(`⚠️  Found ${totalOrphaned} orphaned conversion records`);
    console.log(`💰 Total orphaned commission: Rp ${totalAmount.toLocaleString('id-ID')}\n`);
    
    if (totalOrphaned === 0) {
      console.log('✅ No orphaned records found!');
      await prisma.$disconnect();
      return;
    }
    
    console.log('🗑️  Deleting orphaned AffiliateConversion records...\n');
    
    // Delete all orphaned conversion records
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM "AffiliateConversion"
      WHERE "affiliateId" NOT IN (
        SELECT id FROM "AffiliateProfile"
      )
    `;
    
    console.log(`✅ Deleted ${deleteResult} orphaned records\n`);
    
    // Verify cleanup
    const remainingConversions = await prisma.affiliateConversion.count();
    const remainingTotal = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true },
    });
    
    console.log('📊 AFTER CLEANUP:');
    console.log(`Remaining AffiliateConversion records: ${remainingConversions}`);
    console.log(`Remaining total commission: Rp ${Number(remainingTotal._sum.commissionAmount || 0).toLocaleString('id-ID')}`);
    
    // Check wallet status
    const walletStats = await prisma.wallet.aggregate({
      _sum: {
        totalEarnings: true,
        balance: true,
      },
    });
    
    console.log(`\n💳 WALLET STATUS:`);
    console.log(`Total in wallets: Rp ${Number(walletStats._sum.totalEarnings || 0).toLocaleString('id-ID')}`);
    console.log(`Total balance: Rp ${Number(walletStats._sum.balance || 0).toLocaleString('id-ID')}`);
    
    console.log(`\n✅ CLEANUP COMPLETE!\n`);
    console.log(`💡 NOTE: All affiliate commissions are now clean and verified.`);
    console.log(`📝 Going forward, ensure affiliate commissions are:
   1. Created with valid AffiliateProfile records
   2. Synced to wallet.totalEarnings immediately
   3. Tracked in AffiliateConversion table\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedData();
