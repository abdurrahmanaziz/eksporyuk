const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeMonthlyData() {
  console.log('📊 ANALISIS DATA CONVERSION PER BULAN\n');
  
  // Get all conversions
  const conversions = await prisma.affiliateConversion.findMany({
    select: { createdAt: true, commissionAmount: true },
    orderBy: { createdAt: 'desc' }
  });
  
  // Group by month
  const byMonth = {};
  
  for (const conv of conversions) {
    const date = new Date(conv.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { count: 0, total: 0 };
    }
    byMonth[monthKey].count++;
    byMonth[monthKey].total += Number(conv.commissionAmount);
  }
  
  // Sort and display
  const sorted = Object.entries(byMonth)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);
  
  console.log('Conversions per Bulan (12 bulan terakhir):');
  console.log('─'.repeat(70));
  
  for (const [month, data] of sorted) {
    const monthName = new Date(month + '-01').toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    console.log(`${monthName.padEnd(25)} : ${String(data.count).padStart(4)} conversions - Rp ${data.total.toLocaleString('id-ID')}`);
  }
  
  // December 2025 detail
  console.log('\n📅 DESEMBER 2025 DETAIL:');
  const dec2025 = conversions.filter(c => {
    const d = new Date(c.createdAt);
    return d.getFullYear() === 2025 && d.getMonth() === 11;
  });
  
  console.log(`Total: ${dec2025.length} conversions`);
  console.log(`Commission: Rp ${dec2025.reduce((sum, c) => sum + Number(c.commissionAmount), 0).toLocaleString('id-ID')}`);
  
  if (dec2025.length > 0) {
    const dates = dec2025.map(c => new Date(c.createdAt).getDate());
    const uniqueDates = [...new Set(dates)].sort((a, b) => a - b);
    console.log(`Tanggal: ${uniqueDates.join(', ')}`);
  }
  
  // November 2025 detail
  console.log('\n📅 NOVEMBER 2025 DETAIL:');
  const nov2025 = conversions.filter(c => {
    const d = new Date(c.createdAt);
    return d.getFullYear() === 2025 && d.getMonth() === 10;
  });
  
  console.log(`Total: ${nov2025.length} conversions`);
  console.log(`Commission: Rp ${nov2025.reduce((sum, c) => sum + Number(c.commissionAmount), 0).toLocaleString('id-ID')}`);
  
  // Current month (this month in calendar)
  const now = new Date();
  const thisMonth = conversions.filter(c => {
    const d = new Date(c.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  
  console.log(`\n📊 BULAN INI (${now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}):`);
  console.log(`Total: ${thisMonth.length} conversions`);
  console.log(`Commission: Rp ${thisMonth.reduce((sum, c) => sum + Number(c.commissionAmount), 0).toLocaleString('id-ID')}`);
  
  await prisma.$disconnect();
}

analyzeMonthlyData();
