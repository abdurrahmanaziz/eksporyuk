const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncAllCommissionsToWallet() {
  console.log('🔄 SYNCING ALL AFFILIATE COMMISSIONS TO WALLET\n');
  
  try {
    // Get all affiliate profiles with their total commissions from conversions
    const conversionsByAffiliate = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      _sum: { commissionAmount: true },
      _count: { id: true },
    });
    
    console.log(`Found ${conversionsByAffiliate.length} affiliates with commissions\n`);
    
    let processedCount = 0;
    let walletCreatedCount = 0;
    let walletUpdatedCount = 0;
    let totalSynced = 0;
    
    for (const conv of conversionsByAffiliate) {
      const affiliateId = conv.affiliateId;
      const totalCommission = Number(conv._sum.commissionAmount || 0);
      const conversionCount = conv._count.id;
      
      // Get affiliate profile
      const affiliate = await prisma.affiliateProfile.findUnique({
        where: { id: affiliateId },
        select: { userId: true, totalEarnings: true },
      });
      
      if (!affiliate) {
        console.log(`⚠️  Affiliate ${affiliateId} not found, skipping`);
        continue;
      }
      
      // Get or create wallet
      const wallet = await prisma.wallet.upsert({
        where: { userId: affiliate.userId },
        create: {
          userId: affiliate.userId,
          balance: totalCommission,
          totalEarnings: totalCommission,
        },
        update: {
          balance: { increment: totalCommission - (Number(await prisma.wallet.findUnique({
            where: { userId: affiliate.userId },
            select: { totalEarnings: true },
          }))?.totalEarnings || 0) },
          totalEarnings: totalCommission,
        },
      });
      
      // Get user info for display
      const user = await prisma.user.findUnique({
        where: { id: affiliate.userId },
        select: { name: true, email: true },
      });
      
      console.log(`✓ ${user?.name} (${conversionCount} conversions) - Rp ${totalCommission.toLocaleString('id-ID')}`);
      
      processedCount++;
      totalSynced += totalCommission;
      
      if (wallet.createdAt === wallet.updatedAt) {
        walletCreatedCount++;
      } else {
        walletUpdatedCount++;
      }
    }
    
    console.log(`\n✅ SYNC COMPLETE!\n`);
    console.log(`Affiliates processed: ${processedCount}`);
    console.log(`Wallets created: ${walletCreatedCount}`);
    console.log(`Wallets updated: ${walletUpdatedCount}`);
    console.log(`Total synced: Rp ${totalSynced.toLocaleString('id-ID')}`);
    
    // Verify sync
    const walletStats = await prisma.wallet.aggregate({
      _sum: {
        totalEarnings: true,
        balance: true,
      },
    });
    
    console.log(`\n📊 VERIFICATION:`);
    console.log(`Total in wallets: Rp ${Number(walletStats._sum.totalEarnings || 0).toLocaleString('id-ID')}`);
    console.log(`Total balance: Rp ${Number(walletStats._sum.balance || 0).toLocaleString('id-ID')}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncAllCommissionsToWallet();
