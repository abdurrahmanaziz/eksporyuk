const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCommissionStatus() {
  console.log('🔍 CHECKING COMMISSION STATUS\n');
  
  // Check total conversions
  const totalConversions = await prisma.affiliateConversion.count();
  const totalConvAmount = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
  });
  
  console.log(`Total AffiliateConversion records: ${totalConversions}`);
  console.log(`Total commission amount: Rp ${Number(totalConvAmount._sum.commissionAmount || 0).toLocaleString('id-ID')}`);
  
  // Check wallets
  const walletStats = await prisma.wallet.aggregate({
    _sum: {
      totalEarnings: true,
      balance: true,
    },
  });
  
  console.log(`\nWallet Stats:`);
  console.log(`Total in wallets (totalEarnings): Rp ${Number(walletStats._sum.totalEarnings || 0).toLocaleString('id-ID')}`);
  console.log(`Total balance available: Rp ${Number(walletStats._sum.balance || 0).toLocaleString('id-ID')}`);
  
  // Check if there's a mismatch
  const expectedTotal = Number(totalConvAmount._sum.commissionAmount || 0);
  const walletTotal = Number(walletStats._sum.totalEarnings || 0);
  const diff = expectedTotal - walletTotal;
  
  console.log(`\n💰 MISMATCH ANALYSIS:`);
  console.log(`Expected (from conversions): Rp ${expectedTotal.toLocaleString('id-ID')}`);
  console.log(`In wallets: Rp ${walletTotal.toLocaleString('id-ID')}`);
  console.log(`Missing: Rp ${diff.toLocaleString('id-ID')}`);
  
  if (diff > 0) {
    console.log(`\n⚠️  PROBLEM: Rp ${diff.toLocaleString('id-ID')} belum masuk ke wallet!\n`);
    
    // Get affiliates with conversions but no wallet entry
    console.log('📋 Affiliates with conversion records:');
    const convByAff = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      _sum: { commissionAmount: true },
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: 20,
    });
    
    for (const conv of convByAff) {
      const aff = await prisma.affiliateProfile.findUnique({
        where: { id: conv.affiliateId },
        select: { userId: true },
      });
      
      if (!aff) continue;
      
      const wallet = await prisma.wallet.findUnique({
        where: { userId: aff.userId },
        select: { totalEarnings: true, balance: true },
      });
      
      const user = await prisma.user.findUnique({
        where: { id: aff.userId },
        select: { name: true, email: true },
      });
      
      const convAmount = Number(conv._sum.commissionAmount || 0);
      const walletAmount = Number(wallet?.totalEarnings || 0);
      
      if (convAmount !== walletAmount) {
        console.log(`  ${user?.name} - Expected: Rp ${convAmount.toLocaleString('id-ID')}, In wallet: Rp ${walletAmount.toLocaleString('id-ID')}`);
      }
    }
  } else {
    console.log(`\n✅ SEMUA KOMISI SUDAH TERBAYARKAN!`);
  }
  
  await prisma.$disconnect();
}

checkCommissionStatus().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
