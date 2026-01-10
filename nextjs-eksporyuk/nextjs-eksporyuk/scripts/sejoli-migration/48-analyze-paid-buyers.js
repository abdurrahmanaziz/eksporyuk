const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  console.log('=== ANALYSIS: PAID vs FREE BUYERS ===\n');
  
  // Users who bought PAID products (amount > 0)
  const paidBuyers = await prisma.transaction.findMany({
    where: { 
      status: 'SUCCESS',
      amount: { gt: 0 }
    },
    select: { userId: true },
    distinct: ['userId']
  });
  console.log('Users who bought PAID products (amount > 0):', paidBuyers.length);
  
  // Users who only got FREE products
  const freeBuyers = await prisma.transaction.findMany({
    where: { 
      status: 'SUCCESS',
      amount: { equals: 0 }
    },
    select: { userId: true },
    distinct: ['userId']
  });
  console.log('Users who got FREE products (amount = 0):', freeBuyers.length);
  
  // Check how many paid buyers have membership
  const paidBuyerIds = paidBuyers.map(b => b.userId);
  const memberships = await prisma.userMembership.findMany({
    where: { userId: { in: paidBuyerIds } },
    select: { userId: true },
    distinct: ['userId']
  });
  
  const membershipCount = memberships.length;
  console.log('\nPaid buyers WITH membership:', membershipCount);
  
  const membershipUserIds = new Set(memberships.map(m => m.userId));
  const paidWithoutMembership = paidBuyerIds.filter(id => {
    return !membershipUserIds.has(id);
  });
  console.log('Paid buyers WITHOUT membership:', paidWithoutMembership.length);
  
  // Sample paid buyers without membership
  if (paidWithoutMembership.length > 0) {
    console.log('\n--- Sample PAID buyers without membership ---');
    for (const userId of paidWithoutMembership.slice(0, 10)) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const txs = await prisma.transaction.findMany({
        where: { userId, status: 'SUCCESS', amount: { gt: 0 } },
        orderBy: { amount: 'desc' },
        take: 3
      });
      console.log('\nUser:', user?.name, '| Role:', user?.role);
      for (const tx of txs) {
        const product = tx.productId ? await prisma.product.findUnique({ where: { id: tx.productId } }) : null;
        console.log('  - Product:', product?.name || 'NULL', '| Amount: Rp', Number(tx.amount).toLocaleString('id-ID'));
      }
    }
  }
  
  // Current membership check
  console.log('\n\n=== MEMBERSHIP CHECK ===');
  const membershipsAll = await prisma.membership.findMany();
  console.log('Available Memberships:', membershipsAll.length);
  for (const m of membershipsAll) {
    console.log('  -', m.name, '| Slug:', m.slug);
  }
  
  await prisma.$disconnect();
}

analyze().catch(console.error);
