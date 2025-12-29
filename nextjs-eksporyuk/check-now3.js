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
  
  // Courses
  const courses = await prisma.course.findMany();
  console.log('\nCOURSES:');
  courses.forEach(c => console.log(`  ${c.id}: ${c.title}`));
  
  // Groups
  const groups = await prisma.group.findMany();
  console.log('\nGROUPS:');
  groups.forEach(g => console.log(`  ${g.id}: ${g.name}`));
  
  // MembershipCourse relations
  const membershipCourses = await prisma.membershipCourse.findMany();
  console.log('\nMEMBERSHIP-COURSE RELATIONS:');
  for (const mc of membershipCourses) {
    const m = memberships.find(x => x.id === mc.membershipId);
    const c = courses.find(x => x.id === mc.courseId);
    console.log(`  ${m?.name} -> ${c?.title}`);
  }
  
  // MembershipGroup relations
  const membershipGroups = await prisma.membershipGroup.findMany();
  console.log('\nMEMBERSHIP-GROUP RELATIONS:');
  for (const mg of membershipGroups) {
    const m = memberships.find(x => x.id === mg.membershipId);
    const g = groups.find(x => x.id === mg.groupId);
    console.log(`  ${m?.name} -> ${g?.name}`);
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
