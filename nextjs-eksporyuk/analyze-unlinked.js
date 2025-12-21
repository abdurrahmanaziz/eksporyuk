const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeUnlinkedTransactions() {
  console.log('=== Analyzing Unlinked MEMBERSHIP Transactions ===\n');
  
  // Get sample of unlinked transactions
  const samples = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      type: 'MEMBERSHIP',
      membership: null
    },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  
  console.log('Sample unlinked transactions:');
  samples.forEach(tx => {
    console.log(`${tx.invoiceNumber} | Rp ${tx.amount.toLocaleString()} | Metadata: ${JSON.stringify(tx.metadata)}`);
  });
  
  // Get available memberships and their prices
  console.log('\n=== Available Memberships ===');
  const memberships = await prisma.membership.findMany();
  memberships.forEach(m => {
    console.log(`- ${m.name}: Rp ${m.price.toLocaleString()} (ID: ${m.id})`);
  });
  
  // Group unlinked by amount
  console.log('\n=== Unlinked Transactions by Amount ===');
  const byAmount = await prisma.transaction.groupBy({
    by: ['amount'],
    where: {
      status: 'SUCCESS',
      type: 'MEMBERSHIP',
      membership: null
    },
    _count: true,
    orderBy: { _count: { amount: 'desc' } }
  });
  
  byAmount.slice(0, 15).forEach(g => {
    console.log(`Rp ${g.amount.toLocaleString()}: ${g._count} transactions`);
  });
  
  // Check if there are UserMembership records without transactionId
  console.log('\n=== UserMembership Stats ===');
  const umTotal = await prisma.userMembership.count();
  const umWithTx = await prisma.userMembership.count({
    where: { transactionId: { not: null } }
  });
  console.log(`Total UserMembership: ${umTotal}`);
  console.log(`With transactionId: ${umWithTx}`);
  console.log(`Without transactionId: ${umTotal - umWithTx}`);
  
  await prisma.$disconnect();
}

analyzeUnlinkedTransactions().catch(console.error);
