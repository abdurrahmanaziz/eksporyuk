const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying Sultan Aziz enrollment...\n');
  
  // Find user by email
  const user = await prisma.user.findFirst({
    where: { email: 'abdurrahmanazizsultan@gmail.com' }
  });
  
  if (!user) {
    console.log('❌ User tidak ditemukan');
    await prisma.$disconnect();
    return;
  }
  
  // Get memberships with groups and courses via junction tables
  const userMemberships = await prisma.userMembership.findMany({
    where: { userId: user.id },
    include: {
      membership: {
        include: {
          membershipGroups: { include: { group: true } },
          membershipCourses: { include: { course: true } }
        }
      }
    }
  });
  
  // Get groups
  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId: user.id }
  });
  
  // Get group details
  const groupIds = groupMemberships.map(g => g.groupId);
  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } }
  });
  
  // Get courses
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: user.id }
  });
  
  // Get course details
  const courseIds = enrollments.map(e => e.courseId);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } }
  });
  
  console.log('✅ User:', user.name);
  console.log('📧 Email:', user.email);
  console.log('🆔 ID:', user.id);
  console.log('');
  
  console.log('📦 Memberships:', userMemberships.length);
  userMemberships.forEach(m => {
    const groups = m.membership.membershipGroups || [];
    const courses = m.membership.membershipCourses || [];
    console.log(`  - ${m.membership.name}`);
    console.log(`    Status: ${m.status} | Active: ${m.isActive}`);
    console.log(`    Groups: ${groups.length} | Courses: ${courses.length}`);
  });
  console.log('');
  
  console.log('👥 Groups Joined:', groupMemberships.length);
  groups.forEach(g => {
    console.log(`  ✅ ${g.name}`);
  });
  console.log('');
  
  console.log('📚 Courses Enrolled:', enrollments.length);
  courses.forEach(c => {
    console.log(`  ✅ ${c.title}`);
  });
  console.log('');
  
  // Check recent transaction
  const recentTx = await prisma.transaction.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });
  
  if (recentTx) {
    console.log('💰 Latest Transaction:');
    console.log(`  Invoice: ${recentTx.invoiceNumber}`);
    console.log(`  Amount: Rp ${Number(recentTx.amount).toLocaleString('id-ID')}`);
    console.log(`  Status: ${recentTx.status}`);
    console.log(`  Created: ${recentTx.createdAt}`);
  }
  
  await prisma.$disconnect();
  console.log('\n✅ Verification complete!');
}

verify().catch(console.error);
