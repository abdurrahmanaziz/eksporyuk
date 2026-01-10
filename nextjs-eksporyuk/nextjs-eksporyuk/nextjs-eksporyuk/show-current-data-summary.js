const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalSummary() {
  console.log('📊 FINAL DATA SUMMARY\n');
  
  // Current month (December 2025)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthConv = await prisma.affiliateConversion.aggregate({
    where: { createdAt: { gte: monthStart } },
    _sum: { commissionAmount: true },
    _count: { id: true }
  });
  
  // Current week (Monday to today)
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekConv = await prisma.affiliateConversion.aggregate({
    where: { createdAt: { gte: weekStart } },
    _sum: { commissionAmount: true },
    _count: { id: true }
  });
  
  // All time
  const allConv = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: { id: true }
  });
  
  console.log('🗓  CURRENT WEEK (', weekStart.toISOString().split('T')[0], '- today):');
  console.log('   Conversions:', weekConv._count.id);
  console.log('   Commission: Rp', Number(weekConv._sum.commissionAmount || 0).toLocaleString('id-ID'));
  
  console.log('\n📅 CURRENT MONTH (Desember 2025):');
  console.log('   Conversions:', monthConv._count.id);
  console.log('   Commission: Rp', Number(monthConv._sum.commissionAmount || 0).toLocaleString('id-ID'));
  
  console.log('\n🏆 ALL-TIME:');
  console.log('   Conversions:', allConv._count.id.toLocaleString());
  console.log('   Commission: Rp', Number(allConv._sum.commissionAmount || 0).toLocaleString('id-ID'));
  
  console.log('\n✅ API leaderboard akan menampilkan data ini setelah Vercel deploy selesai.');
  console.log('   Desember masih kurang data (seharusnya 100 completed orders dari TSV)');
  console.log('   Tapi data yang ada sudah konsisten dengan periode kalender.\n');
  
  await prisma.$disconnect();
}

finalSummary();
