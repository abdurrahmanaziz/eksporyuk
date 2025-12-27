const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSampleUser() {
  const email = 'naufalfadli45@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true }
  });
  
  console.log('👤 User:', user);
  
  // Check membership
  const membership = await prisma.userMembership.findFirst({
    where: { userId: user.id, status: 'ACTIVE' }
  });
  
  if (membership) {
    const membershipData = await prisma.membership.findUnique({
      where: { id: membership.membershipId }
    });
    console.log(`📦 Membership: ${membershipData.name} (${membershipData.duration})`);
    
    // Check group memberships
    const groupMemberships = await prisma.groupMember.count({
      where: { userId: user.id }
    });
    console.log(`🏘️  In ${groupMemberships} groups`);
    
    // Check course enrollments
    const courseEnrollments = await prisma.courseEnrollment.count({
      where: { userId: user.id }
    });
    console.log(`📚 Enrolled in ${courseEnrollments} courses`);
    
    // Check what they should have access to
    const shouldHaveGroups = await prisma.membershipGroup.count({
      where: { membershipId: membership.membershipId }
    });
    const shouldHaveCourses = await prisma.membershipCourse.count({
      where: { membershipId: membership.membershipId }
    });
    
    console.log(`\nShould have access to:`);
    console.log(`├─ Groups: ${shouldHaveGroups}`);
    console.log(`└─ Courses: ${shouldHaveCourses}`);
    
    console.log(`\nActually has access to:`);
    console.log(`├─ Groups: ${groupMemberships} ${groupMemberships === shouldHaveGroups ? '✅' : '❌'}`);
    console.log(`└─ Courses: ${courseEnrollments} ${courseEnrollments === shouldHaveCourses ? '✅' : '❌'}`);
  } else {
    console.log('❌ No active membership');
  }
  
  await prisma.$disconnect();
}

checkSampleUser().catch(console.error);
