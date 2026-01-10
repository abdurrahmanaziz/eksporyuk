const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMemberships() {
  console.log('=== Creating UserMemberships for Bundling buyers ===\n');
  
  const bundlingProduct = await prisma.product.findFirst({
    where: { name: { contains: 'Bundling Kelas Ekspor' } }
  });
  
  const lifetimeMembership = await prisma.membership.findFirst({
    where: { name: { contains: 'Lifetime' } }
  });
  
  console.log('Product:', bundlingProduct.name);
  console.log('Membership:', lifetimeMembership.name);
  
  const bundlingTxs = await prisma.transaction.findMany({
    where: { productId: bundlingProduct.id, status: 'SUCCESS' },
    select: { userId: true },
    distinct: ['userId']
  });
  
  const existingUM = await prisma.userMembership.findMany({
    where: { userId: { in: bundlingTxs.map(t => t.userId) } },
    select: { userId: true }
  });
  const hasUMSet = new Set(existingUM.map(m => m.userId));
  
  const needUM = bundlingTxs.map(t => t.userId).filter(id => {
    return hasUMSet.has(id) === false;
  });
  console.log('Need UserMembership:', needUM.length);
  
  // Create one by one (lifetime = far future endDate)
  let created = 0;
  const farFuture = new Date('2099-12-31');
  
  for (let i = 0; i < needUM.length; i++) {
    const userId = needUM[i];
    try {
      await prisma.userMembership.create({
        data: {
          userId,
          membershipId: lifetimeMembership.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: farFuture,
          isActive: true
        }
      });
      created++;
    } catch (e) {
      // Skip duplicates
    }
    
    if ((i + 1) % 100 === 0) {
      console.log('Progress:', (i + 1) + '/' + needUM.length);
    }
  }
  
  console.log('\n✅ Created:', created, 'UserMemberships');
  
  const totalUM = await prisma.userMembership.count();
  console.log('Total UserMemberships now:', totalUM);
  
  await prisma.$disconnect();
}

createMemberships().catch(console.error);
