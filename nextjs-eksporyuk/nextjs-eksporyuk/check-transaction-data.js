const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Cek transaksi dengan affiliateId
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0,0,0,0);
  
  // Top affiliates dari Transaction minggu ini
  const topFromTx = await prisma.transaction.groupBy({
    by: ['affiliateId'],
    where: {
      affiliateId: { not: null },
      status: 'SUCCESS',
      paidAt: { gte: weekStart }
    },
    _sum: { affiliateShare: true },
    _count: true,
    orderBy: { _sum: { affiliateShare: 'desc' } },
    take: 10
  });
  
  console.log('=== TOP 10 AFFILIATE DARI TRANSACTION (MINGGU INI) ===');
  console.log('Week start:', weekStart.toLocaleString('id-ID'));
  console.log('');
  
  for (let i = 0; i < topFromTx.length; i++) {
    const t = topFromTx[i];
    if (!t.affiliateId) continue;
    const aff = await prisma.affiliateProfile.findUnique({
      where: { id: t.affiliateId },
      include: { user: { select: { name: true } } }
    });
    console.log((i+1) + '. ' + (aff?.user?.name || 'Unknown') + ' - Rp ' + Number(t._sum.affiliateShare || 0).toLocaleString('id-ID') + ' (' + t._count + ' transaksi)');
  }
  
  // Bandingkan dengan AffiliateProfile
  console.log('\n=== TOP 10 DARI AffiliateProfile.totalEarnings (SEPANJANG MASA) ===');
  const topProfile = await prisma.affiliateProfile.findMany({
    orderBy: { totalEarnings: 'desc' },
    take: 10,
    include: { user: { select: { name: true } } }
  });
  
  topProfile.forEach((p, i) => {
    console.log((i+1) + '. ' + p.user?.name + ' - Rp ' + Number(p.totalEarnings).toLocaleString('id-ID') + ' (' + p.totalConversions + ' konversi)');
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
