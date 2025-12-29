const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTopAffiliates() {
  const topAffiliateIds = [
    'cmjmtt2u4019bitz0ynpn7y3f',
    'cmjmtp1k7003titz0zqc3nyua',
    'cmjmttc5901c8itz0pq5gau4k',
    'cmjmtp44s004mitz08komz0ld',
    'cmjmtrb9l00rwitz0gxqlrxpp'
  ];
  
  console.log('🔍 TOP 5 AFFILIATES - WALLET DATA CHECK\n');
  
  for (const affId of topAffiliateIds) {
    const aff = await prisma.affiliateProfile.findUnique({
      where: { id: affId },
      select: { userId: true, totalEarnings: true },
    });
    
    if (!aff) {
      console.log(affId + ': NO AFFILIATE PROFILE\n');
      continue;
    }
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId: aff.userId },
      select: { totalEarnings: true, balance: true },
    });
    
    const user = await prisma.user.findUnique({
      where: { id: aff.userId },
      select: { name: true, email: true },
    });
    
    const convTotal = await prisma.affiliateConversion.aggregate({
      where: { affiliateId: affId },
      _sum: { commissionAmount: true },
    });
    
    console.log(`User: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Conversion Total (SUM): Rp ${Number(convTotal._sum.commissionAmount || 0).toLocaleString('id-ID')}`);
    console.log(`  AffiliateProfile.totalEarnings: Rp ${Number(aff.totalEarnings || 0).toLocaleString('id-ID')}`);
    console.log(`  Wallet.totalEarnings: Rp ${Number(wallet?.totalEarnings || 0).toLocaleString('id-ID')}`);
    console.log(`  Wallet.balance: Rp ${Number(wallet?.balance || 0).toLocaleString('id-ID')}`);
    
    // Check for mismatch
    const convNum = Number(convTotal._sum.commissionAmount || 0);
    const walletNum = Number(wallet?.totalEarnings || 0);
    const profNum = Number(aff.totalEarnings || 0);
    
    if (Math.abs(convNum - walletNum) > 100) {
      console.log(`  ❌ MISMATCH: Conversion (${convNum}) != Wallet (${walletNum})`);
    } else {
      console.log(`  ✅ SYNC OK`);
    }
    
    console.log('');
  }
  
  await prisma.$disconnect();
}

checkTopAffiliates().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
