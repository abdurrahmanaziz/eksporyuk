const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== QUICK DATA CHECK ===\n');
  
  // 1. User by role
  console.log('=== USER COUNT BY ROLE ===');
  const roles = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });
  roles.forEach(r => console.log(`${r.role}: ${r._count.id}`));
  
  // 2. UserMembership stats
  console.log('\n=== USER MEMBERSHIP STATS ===');
  const umActive = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });
  console.log(`Active UserMemberships: ${umActive}`);
  
  // 3. UserMembership by Membership
  console.log('\n=== ACTIVE MEMBERSHIPS BY PLAN ===');
  const umByPlan = await prisma.userMembership.groupBy({
    by: ['membershipId'],
    where: { status: 'ACTIVE' },
    _count: { id: true }
  });
  
  for (const um of umByPlan) {
    const plan = await prisma.membership.findUnique({ where: { id: um.membershipId } });
    console.log(`${plan?.name || um.membershipId}: ${um._count.id} active`);
  }
  
  // 4. Get all active UserMembership user IDs
  console.log('\n=== CROSS-CHECK ROLES ===');
  const activeUMs = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true }
  });
  const activeUserIds = new Set(activeUMs.map(um => um.userId));
  
  // Free users
  const freeUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_FREE' },
    select: { id: true }
  });
  
  let freeWithActive = 0;
  for (const u of freeUsers) {
    if (activeUserIds.has(u.id)) freeWithActive++;
  }
  console.log(`FREE members with ACTIVE membership (need upgrade): ${freeWithActive}`);
  
  // Premium users without membership
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true }
  });
  
  let premiumWithoutActive = 0;
  for (const u of premiumUsers) {
    if (!activeUserIds.has(u.id)) premiumWithoutActive++;
  }
  console.log(`PREMIUM members without ACTIVE membership: ${premiumWithoutActive}`);
  
  // 5. Check duplicates in UserMembership
  console.log('\n=== DUPLICATES CHECK ===');
  const allUM = await prisma.userMembership.findMany({
    select: { userId: true, membershipId: true }
  });
  const seen = new Set();
  let duplicates = 0;
  allUM.forEach(um => {
    const key = um.userId + '-' + um.membershipId;
    if (seen.has(key)) duplicates++;
    seen.add(key);
  });
  console.log(`Duplicate UserMembership entries: ${duplicates}`);
  
  // 6. Course enrollments
  console.log('\n=== COURSE ENROLLMENTS ===');
  const courses = await prisma.course.findMany({
    select: { 
      id: true, 
      title: true,
      _count: { select: { enrollments: true } }
    }
  });
  courses.forEach(c => console.log(`${c.title}: ${c._count.enrollments} enrollments`));
  
  console.log('\n=== DONE ===');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
