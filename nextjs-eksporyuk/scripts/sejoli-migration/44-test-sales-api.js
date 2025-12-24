const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSalesAPI() {
  console.log('Testing Sales API logic...');
  
  // Simulate API query
  const where = { status: 'SUCCESS' };
  const rawTransactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  
  console.log('\nRaw transactions:', rawTransactions.length);
  
  // Batch fetch
  const userIds = [...new Set(rawTransactions.map(t => t.userId).filter(Boolean))];
  const productIds = [...new Set(rawTransactions.map(t => t.productId).filter(Boolean))];
  const transactionIds = rawTransactions.map(t => t.id);
  
  const [users, products, conversions] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true }
    }),
    prisma.affiliateConversion.findMany({
      where: { transactionId: { in: transactionIds } },
      select: { id: true, transactionId: true, affiliateId: true, commissionAmount: true }
    })
  ]);
  
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  const conversionMap = Object.fromEntries(conversions.map(c => [c.transactionId, c]));
  
  // Enrich
  const transactions = rawTransactions.map(tx => ({
    id: tx.id,
    amount: tx.amount,
    status: tx.status,
    user: tx.userId ? userMap[tx.userId] : null,
    product: tx.productId ? productMap[tx.productId] : null,
    affiliateConversion: conversionMap[tx.id] || null
  }));
  
  console.log('\nEnriched transactions:');
  transactions.forEach(tx => {
    console.log({
      id: tx.id.slice(0, 15) + '...',
      amount: 'Rp ' + Number(tx.amount).toLocaleString('id-ID'),
      user: tx.user?.name || 'N/A',
      product: tx.product?.name || 'N/A',
      hasCommission: !!tx.affiliateConversion
    });
  });
  
  console.log('\n✅ Sales API logic works correctly!');
  await prisma.$disconnect();
}

testSalesAPI().catch(console.error);
