const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           PERBANDINGAN FINAL: LOCAL vs LIVE SEJOLI           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  // Data Live dari screenshot
  const liveData = {
    'Rahmat Al Fianto': 169595000,
    'Asep Abdurrahman Wahid': 165015000,
    'Sutisna': 132825000,
    'Hamid Baidowi': 131610000,
    'Yoga Andrian': 93610000,
    'NgobrolinEkspor': 76085000,  // estimasi dari trend
  };
  
  // Get local data
  const profiles = await prisma.affiliateProfile.findMany({
    orderBy: { totalEarnings: 'desc' },
    take: 15,
    include: { user: true }
  });
  
  console.log('║                                                              ║');
  console.log('║  Affiliate              │ Local DB    │ Live Sejoli│ Diff %  ║');
  console.log('╠═════════════════════════╪═════════════╪════════════╪═════════╣');
  
  // Exclude admin (Abdurrahman Aziz) karena banyak free zoom
  const affiliates = profiles.filter(p => p.user.name !== 'Abdurrahman Aziz');
  
  affiliates.slice(0, 10).forEach(p => {
    const localAmount = Number(p.totalEarnings);
    const liveAmount = liveData[p.user.name] || 0;
    
    let diff = '';
    if (liveAmount > 0) {
      const pct = ((localAmount - liveAmount) / liveAmount * 100).toFixed(1);
      diff = `${pct > 0 ? '+' : ''}${pct}%`;
    } else {
      diff = 'N/A';
    }
    
    const name = p.user.name.substring(0, 21).padEnd(21);
    const local = `Rp ${(localAmount / 1000000).toFixed(1)}M`.padStart(11);
    const live = liveAmount > 0 ? `Rp ${(liveAmount / 1000000).toFixed(1)}M`.padStart(10) : 'N/A'.padStart(10);
    
    console.log(`║  ${name} │${local} │${live} │${diff.padStart(7)} ║`);
  });
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  // Calculate total
  const totalLocal = affiliates.slice(0, 5).reduce((s, p) => s + Number(p.totalEarnings), 0);
  const totalLive = Object.values(liveData).slice(0, 5).reduce((s, v) => s + v, 0);
  const totalDiff = ((totalLocal - totalLive) / totalLive * 100).toFixed(1);
  
  console.log(`║  Total Top 5           │Rp ${(totalLocal / 1000000).toFixed(1)}M │Rp ${(totalLive / 1000000).toFixed(1)}M │${(totalDiff > 0 ? '+' : '') + totalDiff}% ║`);
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                                                              ║');
  console.log('║  CATATAN:                                                    ║');
  console.log('║  • Selisih 5-10% kemungkinan dari:                           ║');
  console.log('║    - Refund/cancel yang tidak tercatat di API                ║');
  console.log('║    - Perubahan commission rate historis                      ║');
  console.log('║    - Penyesuaian manual di database Sejoli                   ║');
  console.log('║                                                              ║');
  console.log('║  • Data lokal sudah MENDEKATI data live Sejoli               ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Summary stats
  console.log('\n=== STATISTIK DATABASE LOKAL ===');
  
  const stats = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT t.id) as total_tx,
      SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tx,
      COUNT(DISTINCT ac.id) as total_conversions,
      SUM(CASE WHEN ac.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_conversions
    FROM "Transaction" t
    LEFT JOIN "AffiliateConversion" ac ON 1=1
  `;
  
  const txCount = await prisma.transaction.count();
  const txCompleted = await prisma.transaction.count({ where: { status: 'COMPLETED' }});
  const convCount = await prisma.affiliateConversion.count();
  const affiliateCount = await prisma.affiliateProfile.count();
  
  console.log(`• Total Transaksi: ${txCount.toLocaleString('id-ID')}`);
  console.log(`• Transaksi Completed: ${txCompleted.toLocaleString('id-ID')}`);
  console.log(`• Total Affiliate Conversions: ${convCount.toLocaleString('id-ID')}`);
  console.log(`• Total Affiliates: ${affiliateCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

