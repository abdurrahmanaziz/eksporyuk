const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIX: Bundling Buyers → Lifetime Access ===\n');
  
  // 1. Find Bundling product
  const bundlingProduct = await prisma.product.findFirst({
    where: { name: { contains: 'Bundling Kelas Ekspor' } }
  });
  
  if (!bundlingProduct) {
    console.log('❌ Bundling product not found!');
    return;
  }
  console.log('✅ Found product:', bundlingProduct.name);
  console.log('   ID:', bundlingProduct.id);
  
  // 2. Find Lifetime membership
  const lifetimeMembership = await prisma.membership.findFirst({
    where: { 
      OR: [
        { slug: 'paket-lifetime' },
        { slug: 'paket-ekspor-yuk-lifetime' },
        { name: { contains: 'Lifetime' } }
      ]
    }
  });
  
  if (!lifetimeMembership) {
    console.log('❌ Lifetime membership not found!');
    return;
  }
  console.log('✅ Found membership:', lifetimeMembership.name);
  console.log('   ID:', lifetimeMembership.id);
  
  // 3. Get all users who bought Bundling
  const bundlingTxs = await prisma.transaction.findMany({
    where: {
      productId: bundlingProduct.id,
      status: 'SUCCESS'
    },
    select: { userId: true },
    distinct: ['userId']
  });
  
  const bundlingBuyerIds = bundlingTxs.map(t => t.userId);
  console.log('\n📦 Total Bundling buyers:', bundlingBuyerIds.length);
  
  // 4. Check who already has membership
  const existingMemberships = await prisma.userMembership.findMany({
    where: { userId: { in: bundlingBuyerIds } },
    select: { userId: true }
  });
  const hasMembers = new Set(existingMemberships.map(m => m.userId));
  
  const needMembership = bundlingBuyerIds.filter(id => !hasMembers.has(id));
  console.log('   Already have membership:', hasMembers.size);
  console.log('   Need membership:', needMembership.length);
  
  // 5. Create UserMemberships for those who need it
  if (needMembership.length > 0) {
    console.log('\n🔧 Creating UserMemberships...');
    
    let created = 0;
    for (const userId of needMembership) {
      try {
        await prisma.userMembership.create({
          data: {
            userId: userId,
            membershipId: lifetimeMembership.id,
            status: 'ACTIVE',
            startDate: new Date()
          }
        });
        created++;
      } catch (e) {
        // Skip if already exists
      }
    }
    console.log('   ✅ Created:', created, 'UserMemberships');
  }
  
  // 6. Upgrade roles to MEMBER_PREMIUM
  console.log('\n🔧 Upgrading roles to MEMBER_PREMIUM...');
  const upgraded = await prisma.user.updateMany({
    where: {
      id: { in: bundlingBuyerIds },
      role: 'MEMBER_FREE'
    },
    data: { role: 'MEMBER_PREMIUM' }
  });
  console.log('   ✅ Upgraded:', upgraded.count, 'users');
  
  // 7. Create ProductMembership mapping if not exists
  const existingMapping = await prisma.productMembership.findFirst({
    where: {
      productId: bundlingProduct.id,
      membershipId: lifetimeMembership.id
    }
  });
  
  if (!existingMapping) {
    await prisma.productMembership.create({
      data: {
        productId: bundlingProduct.id,
        membershipId: lifetimeMembership.id
      }
    });
    console.log('\n✅ Created ProductMembership mapping');
  }
  
  // 8. Final stats
  console.log('\n\n=== FINAL STATS ===');
  const finalByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });
  console.log('Users by Role:');
  for (const r of finalByRole) {
    console.log('  ' + r.role + ': ' + r._count);
  }
  
  const totalUM = await prisma.userMembership.count();
  console.log('\nTotal UserMemberships:', totalUM);
  
  await prisma.$disconnect();
}

main().catch(console.error);
