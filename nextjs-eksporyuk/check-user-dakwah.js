const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  // Cari user dengan nama mengandung 'dakwah' atau 'sambung' (case insensitive)
  const users = await p.user.findMany({
    where: {
      OR: [
        { name: { contains: 'dakwah', mode: 'insensitive' } },
        { name: { contains: 'sambung', mode: 'insensitive' } },
        { email: { contains: 'dakwah', mode: 'insensitive' } },
        { email: { contains: 'sambung', mode: 'insensitive' } }
      ]
    },
    include: { wallet: true, affiliateProfile: true }
  });
  
  console.log('Found users:', users.length);
  
  if (users.length === 0) {
    console.log('No users with dakwah/sambung found');
    
    // Check recent registered users
    console.log('\n=== RECENT USERS ===');
    const recentUsers = await p.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, email: true, createdAt: true }
    });
    recentUsers.forEach(u => {
      console.log('- Name:', u.name, '| Email:', u.email, '| Created:', u.createdAt);
    });
    
    await p.$disconnect();
    return;
  }
  
  for (const user of users) {
    console.log('\n=== USER ===');
    console.log('ID:', user.id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    
    console.log('');
    console.log('=== WALLET ===');
    if (user.wallet) {
      console.log('Wallet ID:', user.wallet.id);
      console.log('Balance:', Number(user.wallet.balance));
      console.log('TotalEarnings:', Number(user.wallet.totalEarnings));
    } else {
      console.log('NO WALLET RECORD');
    }
    
    console.log('');
    console.log('=== AFFILIATE PROFILE ===');
    if (user.affiliateProfile) {
      console.log('Profile ID:', user.affiliateProfile.id);
      console.log('TotalEarnings:', Number(user.affiliateProfile.totalEarnings));
      
      // Check conversions
      const totalConvSum = await p.affiliateConversion.aggregate({
        where: { affiliateId: user.affiliateProfile.id },
        _sum: { commissionAmount: true },
        _count: true
      });
      
      console.log('');
      console.log('=== AFFILIATE CONVERSIONS ===');
      console.log('Total Count:', totalConvSum._count);
      console.log('Total Sum:', Number(totalConvSum._sum.commissionAmount || 0));
    } else {
      console.log('NO AFFILIATE PROFILE');
    }
  }
  
  await p.$disconnect();
}
check();
