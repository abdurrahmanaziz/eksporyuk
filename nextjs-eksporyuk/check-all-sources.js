const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0,0,0,0);
  
  console.log('=== CEK SUMBER DATA UNTUK LEADERBOARD ===');
  console.log('Week start:', weekStart.toLocaleString('id-ID'));
  console.log('');
  
  // 1. AffiliateConversion (currently used for weekly)
  console.log('--- 1. AffiliateConversion (saat ini dipakai untuk weekly) ---');
  const fromConversion = await prisma.affiliateConversion.groupBy({
    by: ['affiliateId'],
    where: { createdAt: { gte: weekStart } },
    _sum: { commissionAmount: true },
    _count: true,
    orderBy: { _sum: { commissionAmount: 'desc' } },
    take: 5
  });
  
  for (let i = 0; i < fromConversion.length; i++) {
    const c = fromConversion[i];
    const aff = await prisma.affiliateProfile.findUnique({
      where: { id: c.affiliateId },
      include: { user: { select: { name: true } } }
    });
    console.log((i+1) + '. ' + (aff?.user?.name || 'Unknown') + ' - Rp ' + Number(c._sum.commissionAmount || 0).toLocaleString('id-ID'));
  }
  
  // 2. Transaction.affiliateShare 
  console.log('\n--- 2. Transaction.affiliateShare (minggu ini) ---');
  const fromTx = await prisma.transaction.groupBy({
    by: ['affiliateId'],
    where: {
      affiliateId: { not: null },
      status: 'SUCCESS',
      paidAt: { gte: weekStart }
    },
    _sum: { affiliateShare: true },
    _count: true,
    orderBy: { _sum: { affiliateShare: 'desc' } },
    take: 5
  });
  
  for (let i = 0; i < fromTx.length; i++) {
    const t = fromTx[i];
    const aff = await prisma.affiliateProfile.findUnique({
      where: { id: t.affiliateId },
      include: { user: { select: { name: true } } }
    });
    console.log((i+1) + '. ' + (aff?.user?.name || 'Unknown') + ' - Rp ' + Number(t._sum.affiliateShare || 0).toLocaleString('id-ID'));
  }
  
  // 3. AffiliateProfile.totalEarnings (sepanjang masa - data WordPress)
  console.log('\n--- 3. AffiliateProfile.totalEarnings (sepanjang masa) ---');
  const fromProfile = await prisma.affiliateProfile.findMany({
    orderBy: { totalEarnings: 'desc' },
    take: 5,
    include: { user: { select: { name: true } } }
  });
  
  fromProfile.forEach((p, i) => {
    console.log((i+1) + '. ' + p.user?.name + ' - Rp ' + Number(p.totalEarnings).toLocaleString('id-ID'));
  });
  
  // Cek sample AffiliateConversion untuk lihat strukturnya
  console.log('\n--- Sample AffiliateConversion data ---');
  const sample = await prisma.affiliateConversion.findFirst({
    orderBy: { commissionAmount: 'desc' },
    include: { 
      affiliate: { include: { user: { select: { name: true } } } },
      transaction: { select: { id: true, amount: true, status: true, paidAt: true } }
    }
  });
  console.log('ID:', sample?.id);
  console.log('Affiliate:', sample?.affiliate?.user?.name);
  console.log('Commission Amount:', Number(sample?.commissionAmount).toLocaleString('id-ID'));
  console.log('Sale Amount:', Number(sample?.saleAmount).toLocaleString('id-ID'));
  console.log('Created At:', sample?.createdAt?.toLocaleString('id-ID'));
  console.log('Transaction:', sample?.transaction);
  
  await prisma.$disconnect();
}

check().catch(console.error);
