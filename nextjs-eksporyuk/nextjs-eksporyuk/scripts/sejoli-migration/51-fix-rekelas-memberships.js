const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixReKelas() {
  console.log('=== FIX RE KELAS MEMBERSHIPS ===\n');
  
  // Get memberships
  const lifetime = await prisma.membership.findFirst({ where: { name: { contains: 'Lifetime' } } });
  const sixMonth = await prisma.membership.findFirst({ where: { name: { contains: '6 Bulan' } } });
  const twelveMonth = await prisma.membership.findFirst({ where: { name: { contains: '12 Bulan' } } });
  
  console.log('Memberships:');
  console.log('  Lifetime:', lifetime.id);
  console.log('  6 Bulan:', sixMonth.id);
  console.log('  12 Bulan:', twelveMonth.id);
  
  // Mapping product -> membership
  const productMembershipMap = {
    'Re Kelas Ekspor Lifetime': { membership: lifetime, endDate: new Date('2099-12-31') },
    'Re Kelas 6 Bulan Ekspor Yuk': { 
      membership: sixMonth, 
      endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months from now
    },
    'Re Kelas 12 Bulan Ekspor Yuk': { 
      membership: twelveMonth,
      endDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000) // 12 months from now
    }
  };
  
  const reProducts = await prisma.product.findMany({
    where: { name: { contains: 'Re' } }
  });
  
  let totalCreated = 0;
  let totalUpgraded = 0;
  
  for (const product of reProducts) {
    const config = productMembershipMap[product.name];
    if (!config) {
      console.log('\nSkipping:', product.name, '(no mapping)');
      continue;
    }
    
    console.log('\n--- Processing:', product.name, '---');
    
    // Get buyers
    const buyers = await prisma.transaction.findMany({
      where: { productId: product.id, status: 'SUCCESS' },
      select: { userId: true },
      distinct: ['userId']
    });
    const buyerIds = buyers.map(b => b.userId);
    
    // Check who has membership
    const withUM = await prisma.userMembership.findMany({
      where: { userId: { in: buyerIds } },
      select: { userId: true }
    });
    const hasUM = new Set(withUM.map(m => m.userId));
    
    const needUM = buyerIds.filter(id => hasUM.has(id) === false);
    console.log('  Need membership:', needUM.length);
    
    // Create UserMemberships
    let created = 0;
    for (const userId of needUM) {
      try {
        await prisma.userMembership.create({
          data: {
            userId,
            membershipId: config.membership.id,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: config.endDate,
            isActive: true
          }
        });
        created++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log('  Created:', created, 'memberships');
    totalCreated += created;
    
    // Upgrade roles
    const upgraded = await prisma.user.updateMany({
      where: {
        id: { in: buyerIds },
        role: 'MEMBER_FREE'
      },
      data: { role: 'MEMBER_PREMIUM' }
    });
    console.log('  Upgraded:', upgraded.count, 'to PREMIUM');
    totalUpgraded += upgraded.count;
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('Total memberships created:', totalCreated);
  console.log('Total users upgraded:', totalUpgraded);
  
  // Final stats
  const totalUM = await prisma.userMembership.count();
  const premiumCount = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } });
  console.log('\nFinal UserMemberships:', totalUM);
  console.log('Final MEMBER_PREMIUM:', premiumCount);
  
  await prisma.$disconnect();
}

fixReKelas().catch(console.error);
