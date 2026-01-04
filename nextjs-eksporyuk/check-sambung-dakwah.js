const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  // Cari user Sambung Dakwah
  const user = await p.user.findFirst({
    where: { name: { contains: 'Sambung' } },
    include: { wallet: true, affiliateProfile: true }
  });
  
  if (!user) {
    console.log('User Sambung Dakwah tidak ditemukan');
    // List all users with affiliate profiles
    const affiliates = await p.user.findMany({
      where: { affiliateProfile: { isNot: null } },
      select: { id: true, name: true, email: true },
      take: 10
    });
    console.log('Sample affiliates:', affiliates);
    await p.$disconnect();
    return;
  }
  
  console.log('=== USER ===');
  console.log('ID:', user.id);
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  
  console.log('');
  console.log('=== WALLET ===');
  if (user.wallet) {
    console.log('Wallet ID:', user.wallet.id);
    console.log('Balance:', Number(user.wallet.balance));
    console.log('BalancePending:', Number(user.wallet.balancePending));
    console.log('TotalEarnings:', Number(user.wallet.totalEarnings));
    console.log('TotalPayout:', Number(user.wallet.totalPayout));
    
    // Check wallet transactions
    const walletTx = await p.walletTransaction.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('');
    console.log('=== WALLET TRANSACTIONS ===');
    console.log('Count:', walletTx.length);
    walletTx.forEach(tx => {
      console.log('- Type:', tx.type, '| Amount:', Number(tx.amount), '| Desc:', tx.description);
    });
  } else {
    console.log('NO WALLET RECORD');
  }
  
  console.log('');
  console.log('=== AFFILIATE PROFILE ===');
  if (user.affiliateProfile) {
    console.log('Profile ID:', user.affiliateProfile.id);
    console.log('TotalEarnings:', Number(user.affiliateProfile.totalEarnings));
    console.log('TotalConversions:', user.affiliateProfile.totalConversions);
    
    // Check conversions
    const convs = await p.affiliateConversion.findMany({
      where: { affiliateId: user.affiliateProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    const totalConvSum = await p.affiliateConversion.aggregate({
      where: { affiliateId: user.affiliateProfile.id },
      _sum: { commissionAmount: true },
      _count: true
    });
    
    console.log('');
    console.log('=== AFFILIATE CONVERSIONS ===');
    console.log('Total Count:', totalConvSum._count);
    console.log('Total Sum:', Number(totalConvSum._sum.commissionAmount || 0));
    console.log('');
    console.log('Recent conversions:');
    convs.forEach(c => {
      console.log('- Amount:', Number(c.commissionAmount), '| PaidOut:', c.paidOut, '| Date:', c.createdAt);
    });
  } else {
    console.log('NO AFFILIATE PROFILE');
  }
  
  await p.$disconnect();
}
check();
