const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIX USER ROLES ===\n');
  
  // Get all active UserMembership user IDs
  const activeUMs = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true }
  });
  const activeUserIds = new Set(activeUMs.map(um => um.userId));
  console.log(`Total active memberships: ${activeUserIds.size}`);
  
  // 1. Find FREE users with ACTIVE membership -> upgrade to PREMIUM
  console.log('\n=== FIXING: FREE members with ACTIVE membership ===');
  const freeUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_FREE' },
    select: { id: true, email: true, name: true }
  });
  
  let upgradedCount = 0;
  for (const u of freeUsers) {
    if (activeUserIds.has(u.id)) {
      console.log(`Upgrading: ${u.email} | ${u.name}`);
      await prisma.user.update({
        where: { id: u.id },
        data: { role: 'MEMBER_PREMIUM' }
      });
      upgradedCount++;
    }
  }
  console.log(`Upgraded ${upgradedCount} users to MEMBER_PREMIUM`);
  
  // 2. Find PREMIUM users WITHOUT active membership -> downgrade to FREE
  console.log('\n=== FIXING: PREMIUM members without ACTIVE membership ===');
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true, email: true, name: true }
  });
  
  let downgradedCount = 0;
  const downgradedSample = [];
  for (const u of premiumUsers) {
    if (!activeUserIds.has(u.id)) {
      await prisma.user.update({
        where: { id: u.id },
        data: { role: 'MEMBER_FREE' }
      });
      downgradedCount++;
      if (downgradedSample.length < 5) {
        downgradedSample.push(u.email);
      }
    }
  }
  console.log(`Downgraded ${downgradedCount} users to MEMBER_FREE`);
  console.log(`Sample: ${downgradedSample.join(', ')}`);
  
  // Final count
  console.log('\n=== FINAL COUNT ===');
  const finalRoles = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });
  finalRoles.forEach(r => console.log(`${r.role}: ${r._count.id}`));
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
