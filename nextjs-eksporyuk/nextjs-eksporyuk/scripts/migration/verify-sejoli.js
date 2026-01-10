const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('📊 VERIFIKASI MIGRASI SEJOLI');
  console.log('='.repeat(50));
  
  // Count transactions from Sejoli
  const sejoliTx = await prisma.transaction.count({
    where: { paymentProvider: 'SEJOLI' }
  });
  console.log('💳 Transactions dari Sejoli:', sejoliTx);
  
  // Get sample transactions
  const sampleTx = await prisma.transaction.findMany({
    where: { paymentProvider: 'SEJOLI' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      reference: true,
      status: true,
      amount: true,
      customerEmail: true,
      createdAt: true
    }
  });
  console.log('\n📋 Sample Transactions:');
  sampleTx.forEach(tx => {
    console.log('  -', tx.reference, '|', tx.status, '| Rp', Number(tx.amount).toLocaleString(), '|', tx.customerEmail);
  });
  
  // Count memberships
  const membershipCount = await prisma.userMembership.count({
    where: { status: 'ACTIVE' }
  });
  console.log('\n🎫 Active Memberships:', membershipCount);
  
  // Get status breakdown
  const statusBreakdown = await prisma.transaction.groupBy({
    by: ['status'],
    where: { paymentProvider: 'SEJOLI' },
    _count: true
  });
  console.log('\n📈 Transaction Status Breakdown:');
  statusBreakdown.forEach(s => {
    console.log('  ', s.status, ':', s._count);
  });
  
  // Total revenue from Sejoli
  const paidTx = await prisma.transaction.aggregate({
    where: { 
      paymentProvider: 'SEJOLI',
      status: 'PAID'
    },
    _sum: { amount: true },
    _count: true
  });
  console.log('\n💰 Total PAID Transactions:');
  console.log('   Count:', paidTx._count);
  console.log('   Total: Rp', Number(paidTx._sum.amount || 0).toLocaleString());
  
  await prisma.$disconnect();
}
verify();
