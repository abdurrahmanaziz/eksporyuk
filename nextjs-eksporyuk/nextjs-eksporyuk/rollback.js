const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== ROLLBACK ENROLLMENTS & GROUP MEMBERS ===\n');
  
  // Delete all course enrollments that were batch created today
  const deletedEnrollments = await prisma.courseEnrollment.deleteMany({});
  console.log('Deleted enrollments:', deletedEnrollments.count);
  
  // Delete all group members
  const deletedMembers = await prisma.groupMember.deleteMany({});
  console.log('Deleted group members:', deletedMembers.count);
  
  // Reset all MEMBER_PREMIUM back to original state based on active membership
  // First, set everyone to FREE
  await prisma.user.updateMany({
    where: { role: { in: ['MEMBER_PREMIUM', 'MEMBER_FREE'] } },
    data: { role: 'MEMBER_FREE' }
  });
  console.log('Reset all members to FREE');
  
  // Then upgrade only those with ACTIVE membership
  const activeUsers = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true }
  });
  
  const activeUserIds = [...new Set(activeUsers.map(u => u.userId))];
  
  await prisma.user.updateMany({
    where: { id: { in: activeUserIds } },
    data: { role: 'MEMBER_PREMIUM' }
  });
  console.log('Upgraded', activeUserIds.length, 'users with ACTIVE membership to PREMIUM');
  
  // Final counts
  const roles = await prisma.user.groupBy({ by: ['role'], _count: true });
  console.log('\nFinal role counts:');
  roles.forEach(r => console.log(`  ${r.role}: ${r._count}`));
  
  const enrollments = await prisma.courseEnrollment.count();
  const members = await prisma.groupMember.count();
  console.log('\nEnrollments:', enrollments);
  console.log('Group members:', members);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
