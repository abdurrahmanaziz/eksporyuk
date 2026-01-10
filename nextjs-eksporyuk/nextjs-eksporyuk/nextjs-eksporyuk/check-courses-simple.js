const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCourses() {
  console.log('🔍 COURSE ENROLLMENT INVESTIGATION\n');
  
  // Check courses
  const courses = await prisma.course.count();
  console.log(`📚 Total courses: ${courses}`);
  
  if (courses === 0) {
    console.log('❌ No courses found! That is why no enrollments.');
  } else {
    console.log('✅ Courses exist. Checking enrollments...');
    
    // Check course enrollments
    const enrollments = await prisma.courseEnrollment.count();
    console.log(`👥 Course enrollments: ${enrollments}`);
    
    // Check membership-course assignments
    const assignments = await prisma.membershipCourse.count();
    console.log(`🔗 Membership-Course assignments: ${assignments}`);
    
    if (assignments === 0) {
      console.log('❌ No membership-course assignments! Users cannot auto-enroll to courses.');
    }
  }
  
  await prisma.$disconnect();
}

checkCourses().catch(console.error);
