/**
 * Verifikasi Import Sejoli ke Database NextJS
 * 17 Desember 2025
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('📊 VERIFIKASI IMPORT DATA SEJOLI');
  console.log('='.repeat(60));
  
  // Count total transactions
  const totalTx = await prisma.transaction.count({
    where: { paymentProvider: 'SEJOLI' }
  });
  
  // Count by status
  const byStatus = await prisma.transaction.groupBy({
    by: ['status'],
    where: { paymentProvider: 'SEJOLI' },
    _count: true
  });
  
  // Count by type
  const byType = await prisma.transaction.groupBy({
    by: ['type'],
    where: { paymentProvider: 'SEJOLI' },
    _count: true
  });
  
  // Sum amounts
  const totals = await prisma.transaction.aggregate({
    where: { paymentProvider: 'SEJOLI', status: 'SUCCESS' },
    _sum: {
      amount: true,
      affiliateShare: true,
      founderShare: true,
      coFounderShare: true,
      companyFee: true
    }
  });
  
  // Date range
  const earliest = await prisma.transaction.findFirst({
    where: { paymentProvider: 'SEJOLI' },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true, externalId: true }
  });
  
  const latest = await prisma.transaction.findFirst({
    where: { paymentProvider: 'SEJOLI' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, externalId: true }
  });
  
  console.log(`\n📈 TOTAL TRANSAKSI SEJOLI: ${totalTx.toLocaleString()}`);
  
  console.log('\n📊 BY STATUS:');
  byStatus.forEach(s => {
    console.log(`  ${s.status}: ${s._count.toLocaleString()}`);
  });
  
  console.log('\n📊 BY TYPE:');
  byType.forEach(t => {
    console.log(`  ${t.type}: ${t._count.toLocaleString()}`);
  });
  
  const amount = parseFloat(totals._sum.amount) || 0;
  const affiliateShare = parseFloat(totals._sum.affiliateShare) || 0;
  const founderShare = parseFloat(totals._sum.founderShare) || 0;
  const coFounderShare = parseFloat(totals._sum.coFounderShare) || 0;
  const companyFee = parseFloat(totals._sum.companyFee) || 0;
  
  console.log('\n💰 REVENUE SUMMARY:');
  console.log(`  Total Omset: Rp ${amount.toLocaleString()}`);
  console.log(`  Affiliate Commission: Rp ${affiliateShare.toLocaleString()}`);
  console.log(`  Founder Share: Rp ${founderShare.toLocaleString()}`);
  console.log(`  Co-Founder Share: Rp ${coFounderShare.toLocaleString()}`);
  console.log(`  Admin Fee: Rp ${companyFee.toLocaleString()}`);
  
  console.log('\n📅 DATE RANGE:');
  console.log(`  Earliest: ${earliest?.createdAt?.toISOString()} (${earliest?.externalId})`);
  console.log(`  Latest: ${latest?.createdAt?.toISOString()} (${latest?.externalId})`);
  
  // Compare with dashboard
  console.log('\n📊 PERBANDINGAN DENGAN DASHBOARD SEJOLI:');
  console.log('  Dashboard:');
  console.log('    Total Sales: 12,851');
  console.log('    Total Omset: Rp 4,133,322,962');
  console.log('    Total Komisi: Rp 1,248,871,000');
  console.log('  Database NextJS:');
  console.log(`    Total Sales: ${totalTx.toLocaleString()}`);
  console.log(`    Total Omset: Rp ${amount.toLocaleString()}`);
  console.log(`    Total Komisi: Rp ${affiliateShare.toLocaleString()}`);
  console.log('  Selisih:');
  console.log(`    Sales: ${12851 - totalTx}`);
  console.log(`    Omset: Rp ${(4133322962 - amount).toLocaleString()}`);
  
  // Sample recent transactions
  console.log('\n📋 SAMPLE TRANSAKSI TERBARU:');
  const recent = await prisma.transaction.findMany({
    where: { paymentProvider: 'SEJOLI' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      externalId: true,
      customerName: true,
      amount: true,
      type: true,
      status: true,
      createdAt: true
    }
  });
  
  recent.forEach(tx => {
    console.log(`  ${tx.externalId} | ${tx.customerName?.substring(0,20).padEnd(20)} | Rp ${parseFloat(tx.amount).toLocaleString().padStart(12)} | ${tx.type} | ${tx.createdAt.toISOString().split('T')[0]}`);
  });
  
  console.log('\n✅ Verifikasi selesai!');
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
