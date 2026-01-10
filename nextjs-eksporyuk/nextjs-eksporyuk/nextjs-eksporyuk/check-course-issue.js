const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCourseIssue() {
  console.log('🔍 WHY NO COURSE ENROLLMENTS?\n');
  
  // Check if courses exist
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, isActive: true }
  });
  
  console.log(`📚 Total courses: ${courses.length}`);
  courses.forEach(c => {
    console.log(`   - ${c.title} (${c.isActive ? 'Active' : 'Inactive'})`);
  });
  
  // Check MembershipCourse assignments
  console.log('\n📋 Membership-Course assignments:');
  const membershipCourses = await prisma.membershipCourse.findMany({
    include: {
      membership: { select: { name: true } },
      course: { select: { title: true } }
    }
  });
  
  membershipCourses.forEach(mc => {
    console.log(`   ${mc.membership?.name} → ${mc.course?.title}`);
  });
  
  // Check existing course enrollments
  const totalEnrollments = await prisma.courseEnrollment.count();
  console.log(`\n👥 Existing course enrollments: ${totalEnrollments}`);
  
  // Test enrollment for one user
  const sampleUser = await prisma.userMembership.findFirst({
    where: { status: 'ACTIVE' },
    include: { membership: true }
  });
  
  if (sampleUser) {
    console.log(`\n🧪 Test user: ${sampleUser.membership.name}`);
    
    const assignedCourses = await prisma.membershipCourse.findMany({
      where: { membershipId: sampleUser.membershipId }
    });
    
    console.log(`   Should have ${assignedCourses.length} courses`);
    
    // Check if already enrolled
    for (const mc of assignedCourses) {
      const existing = await prisma.courseEnrollment.findFirst({
        where: {
          userId: sampleUser.userId,
          courseId: mc.courseId
        }
      });
      
      console.log(`   Course ${mc.courseId}: ${existing ? 'Already enrolled' : 'Not enrolled'}`);
    }
  }
  
  await prisma.$disconnect();
}

checkCourseIssue().catch(console.error);
