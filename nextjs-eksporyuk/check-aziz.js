const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const user = await p.user.findFirst({
    where: { email: 'azizbiasa@gmail.com' },
    include: { 
      wallet: true, 
      affiliateProfile: true 
    }
  });
  
  if (!user) {
    console.log('User not found');
    await p.$disconnect();
    return;
  }
  
  console.log('=== USER ===');
  console.log('ID:', user.id);
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  
  console.log('\n=== WALLET ===');
  if (user.wallet) {
    console.log('Balance:', Number(user.wallet.balance));
    console.log('TotalEarnings:', Number(user.wallet.totalEarnings));
    console.log('TotalPayout:', Number(user.wallet.totalPayout));
    console.log('BalancePending:', Number(user.wallet.balancePending));
  } else {
    console.log('NO WALLET');
  }
  
  console.log('\n=== AFFILIATE PROFILE ===');
  if (user.affiliateProfile) {
    console.log('Profile ID:', user.affiliateProfile.id);
    console.log('TotalEarnings:', Number(user.affiliateProfile.totalEarnings));
    console.log('TotalClicks:', user.affiliateProfile.totalClicks);
    console.log('TotalConversions:', user.affiliateProfile.totalConversions);
    
    // Check conversions
    const conversions = await p.affiliateConversion.findMany({
      where: { affiliateId: user.affiliateProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\n=== RECENT CONVERSIONS ===');
    console.log('Count:', conversions.length);
    conversions.forEach(c => {
      console.log('- Amount:', Number(c.commissionAmount), '| PaidOut:', c.paidOut, '| Date:', c.createdAt);
    });
    
    const total = await p.affiliateConversion.aggregate({
      where: { affiliateId: user.affiliateProfile.id },
      _sum: { commissionAmount: true },
      _count: true
    });
    console.log('\nTotal Conversions:', total._count);
    console.log('Total Commission Sum:', Number(total._sum.commissionAmount || 0));
  } else {
    console.log('NO AFFILIATE PROFILE');
  }
  
  // Check wallet transactions
  if (user.wallet) {
    const txs = await p.walletTransaction.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('\n=== WALLET TRANSACTIONS ===');
    console.log('Count:', txs.length);
    txs.forEach(t => {
      console.log('- Type:', t.type, '| Amount:', Number(t.amount), '| Date:', t.createdAt);
    });
  }
  
  await p.$disconnect();
}
check();
