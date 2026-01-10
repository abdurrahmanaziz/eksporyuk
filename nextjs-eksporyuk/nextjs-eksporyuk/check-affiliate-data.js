import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('📊 AFFILIATE DATA STATUS\n');
  
  // Check AffiliateConversion
  const conversions = await prisma.affiliateConversion.count();
  console.log(`AffiliateConversion records: ${conversions}`);
  
  if (conversions > 0) {
    const total = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    console.log(`Total Commission: Rp ${total._sum.commissionAmount?.toLocaleString('id-ID') || 0}`);
    
    const paidOut = await prisma.affiliateConversion.count({
      where: { paidOut: true }
    });
    console.log(`Paid Out: ${paidOut}`);
    console.log(`Pending: ${conversions - paidOut}`);
  }
  
  // Check Wallet with commission
  const wallets = await prisma.wallet.findMany({
    where: {
      OR: [
        { balance: { gt: 0 } },
        { balancePending: { gt: 0 } }
      ]
    },
    include: {
      user: { select: { name: true, email: true, role: true } }
    },
    take: 10
  });
  
  console.log(`\nWallets with balance: ${wallets.length}`);
  wallets.forEach(w => {
    console.log(`├─ ${w.user.name} (${w.user.role}): Balance Rp ${w.balance.toLocaleString('id-ID')}, Pending Rp ${w.balancePending.toLocaleString('id-ID')}`);
  });
  
  // Check users with AFFILIATE role
  const affiliates = await prisma.user.count({
    where: { role: 'AFFILIATE' }
  });
  console.log(`\nUsers with AFFILIATE role: ${affiliates}`);
  
  await prisma.$disconnect();
}

check();
