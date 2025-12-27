const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const email = 'naufalfadli45@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true }
  });
  
  console.log(`👤 ${user.email} - Role: ${user.role}\n`);
  
  // Check membership
  const membership = await prisma.userMembership.findFirst({
    where: { userId: user.id, status: 'ACTIVE' }
  });
  
  if (membership) {
    const membershipData = await prisma.membership.findUnique({
      where: { id: membership.membershipId }
    });
    console.log(`📦 Membership: ${membershipData.name} (${membershipData.duration})`);
    console.log(`📅 Valid until: ${membership.endDate.toISOString().split('T')[0]}\n`);
  }
  
  // Check groups
  const groupCount = await prisma.groupMember.count({
    where: { userId: user.id }
  });
  console.log(`🏘️  Groups: ${groupCount}`);
  
  // Check courses
  const courseCount = await prisma.courseEnrollment.count({
    where: { userId: user.id }
  });
  console.log(`📚 Courses: ${courseCount}\n`);
  
  if (groupCount > 0 && courseCount > 0) {
    console.log(`✅ SUCCESS! User has proper access`);
  } else {
    console.log(`❌ Missing access: Groups=${groupCount}, Courses=${courseCount}`);
  }
  
  await prisma.$disconnect();
}

checkUser().catch(console.error);
