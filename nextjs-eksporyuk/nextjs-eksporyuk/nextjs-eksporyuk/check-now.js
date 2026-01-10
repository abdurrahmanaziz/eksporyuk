const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CURRENT STATE ===\n');
  
  // Roles
  const roles = await prisma.user.groupBy({ by: ['role'], _count: true });
  console.log('USERS BY ROLE:');
  roles.forEach(r => console.log(`  ${r.role}: ${r._count}`));
  
  // Memberships config
  const memberships = await prisma.membership.findMany({
    include: {
      courses: { include: { course: { select: { id: true, title: true } } } },
      groups: { include: { group: { select: { id: true, name: true } } } }
    }
  });
  
  console.log('\nMEMBERSHIP CONFIGURATIONS:');
  for (const m of memberships) {
    console.log(`\n${m.name}:`);
    console.log('  Courses:', m.courses.map(c => c.course.title).join(', ') || 'NONE');
    console.log('  Groups:', m.groups.map(g => g.group.name).join(', ') || 'NONE');
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
  
  // Courses and Groups
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  const groups = await prisma.group.findMany({ select: { id: true, name: true } });
  console.log('\nCOURSES:', courses.map(c => c.title).join(', '));
  console.log('GROUPS:', groups.map(g => g.name).join(', '));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
