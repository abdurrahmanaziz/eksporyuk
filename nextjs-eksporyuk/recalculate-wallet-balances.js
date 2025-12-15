const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateAffiliateWallets() {
  console.log('💰 RECALCULATING AFFILIATE WALLET BALANCES\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get all affiliates with conversions
    const affiliates = await prisma.affiliateProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        conversions: {
          select: {
            commissionAmount: true,
            paidOut: true
          }
        }
      }
    });

    console.log(`👥 Total affiliates: ${affiliates.length}\n`);

    let updated = 0;
    let skipped = 0;

    for (const affiliate of affiliates) {
      // Calculate total commission from conversions
      const totalCommission = affiliate.conversions.reduce(
        (sum, conv) => sum + Number(conv.commissionAmount),
        0
      );

      // Get or create wallet
      let wallet = await prisma.wallet.findUnique({
        where: { userId: affiliate.userId }
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId: affiliate.userId,
            balance: totalCommission,
            balancePending: 0
          }
        });
        console.log(`✅ Created wallet for ${affiliate.user.email}: Rp ${totalCommission.toLocaleString('id-ID')}`);
        updated++;
      } else if (wallet.balance !== totalCommission) {
        await prisma.wallet.update({
          where: { userId: affiliate.userId },
          data: { balance: totalCommission }
        });
        
        if (updated < 5) {
          console.log(`🔧 Updated ${affiliate.user.email}`);
          console.log(`   Old: Rp ${wallet.balance.toLocaleString('id-ID')} → New: Rp ${totalCommission.toLocaleString('id-ID')}`);
        }
        updated++;
      } else {
        skipped++;
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Already Correct: ${skipped}`);

    // Verify total
    const totalInWallets = await prisma.wallet.aggregate({
      _sum: { balance: true },
      where: {
        balance: { gt: 0 }
      }
    });

    console.log(`\n💰 Total Commission in Wallets: Rp ${totalInWallets._sum.balance?.toLocaleString('id-ID') || '0'}`);

  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

recalculateAffiliateWallets();
