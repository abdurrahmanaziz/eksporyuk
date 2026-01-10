const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== MEMBERSHIP RULES CHECK ===\n');
  
  // Get all memberships with their courses and groups
  const memberships = await prisma.membership.findMany({
    include: {
      courses: { include: { course: { select: { id: true, title: true } } } },
      groups: { include: { group: { select: { id: true, name: true } } } }
    }
  });
  
  console.log('MEMBERSHIP CONFIGURATIONS:');
  for (const m of memberships) {
    console.log(`\n${m.name} (${m.slug || 'no-slug'}):`);
    console.log('  Courses:', m.courses.map(c => c.course.title).join(', ') || 'NONE');
    console.log('  Groups:', m.groups.map(g => g.group.name).join(', ') || 'NONE');
  }
  
  // Get user memberships breakdown
  console.log('\n\n=== USER MEMBERSHIPS BY TYPE ===\n');
  const userMemberships = await prisma.userMembership.groupBy({
    by: ['membershipId'],
    where: { status: 'ACTIVE' },
    _count: true
  });
  
  for (const um of userMemberships) {
    const membership = memberships.find(m => m.id === um.membershipId);
    console.log(`${membership?.name || um.membershipId}: ${um._count} active users`);
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
