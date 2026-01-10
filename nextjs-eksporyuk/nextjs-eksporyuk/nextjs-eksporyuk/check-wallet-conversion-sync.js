const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWalletSync() {
  console.log('🔍 CHECKING WALLET VS CONVERSION SYNC\n');
  
  // Get all affiliates with conversion records
  const conversions = await prisma.affiliateConversion.groupBy({
    by: ['affiliateId'],
    _sum: {
      commissionAmount: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        commissionAmount: 'desc',
      },
    },
    take: 20,
  });
  
  console.log(`Found ${conversions.length} affiliates with commissions\n`);
  console.log('Top 10 Affiliates - Wallet vs Conversion Sync:\n');
  
  for (const conv of conversions.slice(0, 10)) {
    const affiliateId = conv.affiliateId;
    const expectedTotal = Number(conv._sum.commissionAmount) || 0;
    const conversionCount = conv._count.id;
    
    console.log(`Processing affiliateId: ${affiliateId}`);
    
    // Get user info
    const aff = await prisma.affiliateProfile.findUnique({
      where: { id: affiliateId },
      select: { userId: true },
    });
    
    console.log(`Found affiliate profile: ${aff ? 'YES' : 'NO'}`);
    
    if (!aff) {
      console.log(`No profile found for ${affiliateId}, skipping\n`);
      continue;
    }
    
    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: aff.userId },
      select: { totalEarnings: true, balance: true, id: true },
    });
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: aff.userId },
      select: { name: true, email: true },
    });
    
    const walletTotal = Number(wallet?.totalEarnings || 0);
    const diff = Math.abs(walletTotal - expectedTotal);
    const status = diff < 100 ? '✅' : '❌';
    
    console.log(`${status} ${user?.name || 'Unknown'}`);
    console.log(`   Email: ${user?.email}`);
    console.log(`   Conversions: ${conversionCount} (Rp ${expectedTotal.toLocaleString('id-ID')})`);
    console.log(`   Wallet Total Earnings: Rp ${walletTotal.toLocaleString('id-ID')}`);
    console.log(`   Wallet Balance: Rp ${Number(wallet?.balance || 0).toLocaleString('id-ID')}`);
    if (diff > 100) {
      console.log(`   ❌ MISMATCH: Rp ${diff.toLocaleString('id-ID')}`);
    }
    console.log('');
  }
  
  await prisma.$disconnect();
}

checkWalletSync();
