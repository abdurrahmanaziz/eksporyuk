const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CURRENT STATE ===\n');
  
  // Roles
  const roles = await prisma.user.groupBy({ by: ['role'], _count: true });
  console.log('USERS BY ROLE:');
  roles.forEach(r => console.log(`  ${r.role}: ${r._count}`));
  
  // Memberships
  const memberships = await prisma.membership.findMany();
  console.log('\nMEMBERSHIPS:');
  memberships.forEach(m => console.log(`  ${m.id}: ${m.name}`));
  
  // MembershipCourse relations
  const membershipCourses = await prisma.membershipCourse.findMany({
    include: { course: true }
  });
  console.log('\nMEMBERSHIP-COURSE RELATIONS:');
  for (const mc of membershipCourses) {
    const m = memberships.find(x => x.id === mc.membershipId);
    console.log(`  ${m?.name || mc.membershipId} -> ${mc.course.title}`);
  }
  
  // MembershipGroup relations
  const membershipGroups = await prisma.membershipGroup.findMany({
    include: { group: true }
  });
  console.log('\nMEMBERSHIP-GROUP RELATIONS:');
  for (const mg of membershipGroups) {
    const m = memberships.find(x => x.id === mg.membershipId);
    console.log(`  ${m?.name || mg.membershipId} -> ${mg.group.name}`);
  }
  
  // User memberships by type
  console.log('\n\nACTIVE USER MEMBERSHIPS BY TYPE:');
  const userMemberships = await prisma.userMembership.groupBy({
    by: ['membershipId'],
    where: { status: 'ACTIVE' },
    _count: true
  });
  
  for (const um of userMemberships) {
    const membership = memberships.find(m => m.id === um.membershipId);
    console.log(`  ${membership?.name || um.membershipId}: ${um._count} users`);
  }
  
  // Enrollments & Groups
  const enrollments = await prisma.courseEnrollment.count();
  const groupMembers = await prisma.groupMember.count();
  console.log('\nEnrollments:', enrollments);
  console.log('Group Members:', groupMembers);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
