const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFromDatabase() {
  console.log('🔍 VERIFIKASI DATA DARI DATABASE EKSPORYUK');
  console.log('═'.repeat(60));
  
  // 1. Total Transactions
  const totalTransactions = await prisma.transaction.count();
  console.log(`\n📊 TOTAL TRANSAKSI DI DATABASE: ${totalTransactions.toLocaleString('id-ID')}`);
  
  // 2. By Status
  const byStatus = await prisma.transaction.groupBy({
    by: ['status'],
    _count: true,
    _sum: { amount: true }
  });
  
  console.log('\n📈 STATUS TRANSAKSI:');
  byStatus.forEach(s => {
    console.log(`   ${s.status}: ${s._count.toLocaleString('id-ID')} orders, Rp ${s._sum.amount?.toLocaleString('id-ID') || 0}`);
  });
  
  // 3. Completed transactions (Sales)
  const completedCount = await prisma.transaction.count({
    where: { status: 'SUCCESS' }
  });
  
  const completedSum = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  
  console.log(`\n💰 TOTAL SALES (SUCCESS): ${completedCount.toLocaleString('id-ID')}`);
  console.log(`   Total Omset: Rp ${completedSum._sum.amount?.toLocaleString('id-ID') || 0}`);
  
  // 4. Affiliate transactions
  const affiliateTransactions = await prisma.transaction.count({
    where: { 
      status: 'SUCCESS',
      affiliateId: { not: null }
    }
  });
  
  const affiliateSum = await prisma.transaction.aggregate({
    where: { 
      status: 'SUCCESS',
      affiliateId: { not: null }
    },
    _sum: { amount: true }
  });
  
  console.log(`\n👥 AFFILIATE TRANSACTIONS:`);
  console.log(`   Orders with Affiliate: ${affiliateTransactions.toLocaleString('id-ID')}`);
  console.log(`   Omset dari Affiliate: Rp ${affiliateSum._sum.amount?.toLocaleString('id-ID') || 0}`);
  
  // 5. Commission rate calculation
  const commissionRate = 0.302; // 30.2% dari screenshot
  const estimatedCommission = (affiliateSum._sum.amount || 0) * commissionRate;
  console.log(`   Estimated Komisi (30.2%): Rp ${Math.round(estimatedCommission).toLocaleString('id-ID')}`);
  
  // 6. Top 10 Affiliates from Database
  console.log('\n🏆 TOP 10 AFFILIATES DARI DATABASE:');
  console.log('═'.repeat(60));
  
  const topAffiliates = await prisma.$queryRaw`
    SELECT 
      u.id,
      u.name,
      u.email,
      COUNT(t.id) as total_orders,
      SUM(t.amount) as total_omset
    FROM "Transaction" t
    JOIN "User" u ON t."affiliateId" = u.id
    WHERE t.status = 'SUCCESS'
    AND t."affiliateId" IS NOT NULL
    GROUP BY u.id, u.name, u.email
    ORDER BY total_omset DESC
    LIMIT 10
  `;
  
  let rank = 1;
  let totalOmsetTop10 = 0n;
  let totalKomisiTop10 = 0;
  
  for (const aff of topAffiliates) {
    const omset = Number(aff.total_omset);
    const komisi = omset * commissionRate;
    totalOmsetTop10 += BigInt(omset);
    totalKomisiTop10 += komisi;
    
    console.log(`\n${rank}. ${aff.name}`);
    console.log(`   Email: ${aff.email}`);
    console.log(`   Orders: ${Number(aff.total_orders).toLocaleString('id-ID')}`);
    console.log(`   Omset: Rp ${omset.toLocaleString('id-ID')}`);
    console.log(`   💰 Komisi: Rp ${Math.round(komisi).toLocaleString('id-ID')}`);
    rank++;
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`📊 TOTAL TOP 10:`);
  console.log(`   Omset: Rp ${Number(totalOmsetTop10).toLocaleString('id-ID')}`);
  console.log(`   Komisi: Rp ${Math.round(totalKomisiTop10).toLocaleString('id-ID')}`);
  
  // 7. Check if owner (aziz) is in top affiliates
  const ownerCheck = await prisma.user.findFirst({
    where: { email: 'azizbiasa@gmail.com' }
  });
  
  if (ownerCheck) {
    const ownerInTop = topAffiliates.find(a => a.email === 'azizbiasa@gmail.com');
    if (ownerInTop) {
      console.log(`\n⚠️  OWNER (azizbiasa@gmail.com) ADA DI TOP AFFILIATES - PERLU DIEXCLUDE!`);
    } else {
      console.log(`\n✅ OWNER (azizbiasa@gmail.com) TIDAK ADA DI TOP 10`);
    }
  }
  
  // 8. Grand totals
  console.log('\n' + '═'.repeat(60));
  console.log('📊 GRAND TOTAL SEMUA AFFILIATES:');
  
  const grandTotal = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT t."affiliateId") as total_affiliates,
      COUNT(t.id) as total_orders,
      SUM(t.amount) as total_omset
    FROM "Transaction" t
    WHERE t.status = 'SUCCESS'
    AND t."affiliateId" IS NOT NULL
  `;
  
  const gt = grandTotal[0];
  const grandOmset = Number(gt.total_omset);
  const grandKomisi = grandOmset * commissionRate;
  
  console.log(`   Total Affiliates: ${Number(gt.total_affiliates).toLocaleString('id-ID')}`);
  console.log(`   Total Orders: ${Number(gt.total_orders).toLocaleString('id-ID')}`);
  console.log(`   Total Omset: Rp ${grandOmset.toLocaleString('id-ID')}`);
  console.log(`   Total Komisi (30.2%): Rp ${Math.round(grandKomisi).toLocaleString('id-ID')}`);
  
  // 9. Compare with screenshot
  console.log('\n' + '═'.repeat(60));
  console.log('📊 PERBANDINGAN DENGAN SCREENSHOT (14 Des 2025):');
  console.log('═'.repeat(60));
  
  const screenshotSales = 12839;
  const screenshotOmset = 4122334962;
  const screenshotKomisi = 1245421000;
  
  console.log(`                    | Screenshot      | Database        | Selisih`);
  console.log(`   Total Sales      | ${screenshotSales.toLocaleString('id-ID').padEnd(13)} | ${completedCount.toLocaleString('id-ID').padEnd(13)} | ${(screenshotSales - completedCount).toLocaleString('id-ID')}`);
  console.log(`   Total Omset      | Rp ${(screenshotOmset/1e9).toFixed(2)}B      | Rp ${(completedSum._sum.amount/1e9).toFixed(2)}B      | Rp ${((screenshotOmset - completedSum._sum.amount)/1e6).toFixed(0)}M`);
  console.log(`   Total Komisi     | Rp ${(screenshotKomisi/1e9).toFixed(2)}B      | Rp ${(grandKomisi/1e9).toFixed(2)}B      | Rp ${((screenshotKomisi - grandKomisi)/1e6).toFixed(0)}M`);
  
  console.log('\n📅 CATATAN:');
  console.log('   Data di database dari export Sejoli tanggal 9 Desember 2025');
  console.log('   Screenshot dari tanggal 14 Desember 2025');
  console.log('   Selisih ~300 transaksi = transaksi baru 5 hari terakhir');
  
  await prisma.$disconnect();
}

verifyFromDatabase().catch(console.error);
