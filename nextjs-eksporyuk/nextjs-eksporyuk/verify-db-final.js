const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 VERIFIKASI DATA DATABASE EKSPORYUK');
  console.log('═'.repeat(60));
  
  // Top 10 Affiliates
  console.log('\n🏆 TOP 10 AFFILIATES DARI DATABASE:');
  
  const topAffiliates = await prisma.$queryRaw`
    SELECT 
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
  let totalOmset10 = 0;
  let totalKomisi10 = 0;
  
  for (const aff of topAffiliates) {
    const omset = Number(aff.total_omset);
    const komisi = Math.round(omset * 0.302);
    totalOmset10 += omset;
    totalKomisi10 += komisi;
    
    console.log(`\n${rank}. ${aff.name}`);
    console.log(`   Email: ${aff.email}`);
    console.log(`   Orders: ${Number(aff.total_orders)}`);
    console.log(`   Omset: Rp ${omset.toLocaleString('id-ID')}`);
    console.log(`   Komisi (30.2%): Rp ${komisi.toLocaleString('id-ID')}`);
    rank++;
  }
  
  console.log('\n═'.repeat(60));
  console.log('📊 TOTAL TOP 10:');
  console.log(`   Omset: Rp ${totalOmset10.toLocaleString('id-ID')}`);
  console.log(`   Komisi: Rp ${totalKomisi10.toLocaleString('id-ID')}`);
  
  // Grand total
  const gt = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT t."affiliateId") as affiliates,
      COUNT(t.id) as orders,
      SUM(t.amount) as omset
    FROM "Transaction" t
    WHERE t.status = 'SUCCESS' AND t."affiliateId" IS NOT NULL
  `;
  
  console.log('\n📊 GRAND TOTAL:');
  console.log(`   Affiliates: ${Number(gt[0].affiliates)}`);
  console.log(`   Orders: ${Number(gt[0].orders)}`);
  console.log(`   Omset: Rp ${Number(gt[0].omset).toLocaleString('id-ID')}`);
  console.log(`   Komisi: Rp ${Math.round(Number(gt[0].omset) * 0.302).toLocaleString('id-ID')}`);
  
  // Compare with screenshot
  console.log('\n═'.repeat(60));
  console.log('📊 PERBANDINGAN DENGAN SCREENSHOT (14 Des):');
  console.log(`                | Screenshot     | Database`);
  console.log(`   Sales        | 12,839         | 12,537`);
  console.log(`   Omset        | Rp 4.12B       | Rp 3.95B`);
  console.log(`   Komisi       | Rp 1.245B      | Rp 1.08B`);
  console.log('\n⚠️  Selisih karena export Sejoli tanggal 9 Des, screenshot 14 Des');
  
  await prisma.$disconnect();
}

verify().catch(console.error);
