const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FINAL DATA VERIFICATION ===\n');
  
  // Users by role
  const roles = await prisma.user.groupBy({ by: ['role'], _count: true });
  console.log('USERS BY ROLE:');
  roles.forEach(r => console.log(`  ${r.role}: ${r._count}`));
  
  const premiumCount = roles.find(r => r.role === 'MEMBER_PREMIUM')?._count || 0;
  
  // Active memberships
  const activeMemberships = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });
  console.log('\nACTIVE MEMBERSHIPS:', activeMemberships);
  
  // Courses and enrollments
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  console.log('\nCOURSES:');
  for (const c of courses) {
    const enrolled = await prisma.courseEnrollment.count({ where: { courseId: c.id } });
    console.log(`  ${c.title}: ${enrolled} enrollments`);
  }
  
  // Groups and members
  const groups = await prisma.group.findMany({ select: { id: true, name: true } });
  console.log('\nGROUPS:');
  for (const g of groups) {
    const members = await prisma.groupMember.count({ where: { groupId: g.id } });
    console.log(`  ${g.name}: ${members} members`);
  }
  
  // Premium users without enrollments
  const premiumNoEnroll = await prisma.user.count({
    where: {
      role: 'MEMBER_PREMIUM',
      enrollments: { none: {} }
    }
  });
  
  // Premium users without group membership
  const premiumNoGroup = await prisma.user.count({
    where: {
      role: 'MEMBER_PREMIUM',
      groupMemberships: { none: {} }
    }
  });
  
  console.log('\n=== SYNC STATUS ===');
  console.log('Premium users:', premiumCount);
  console.log('Premium without enrollments:', premiumNoEnroll);
  console.log('Premium without groups:', premiumNoGroup);
  
  if (premiumNoEnroll === 0 && premiumNoGroup === 0) {
    console.log('\n✅ ALL PREMIUM USERS ARE SYNCED!');
  } else {
    console.log('\n⚠️ SOME USERS NEED SYNC');
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
