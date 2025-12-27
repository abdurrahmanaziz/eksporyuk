const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCourseEnrollment() {
  console.log('🔍 Checking Course Enrollment\n');
  
  // Check if courses exist
  const courses = await prisma.course.findMany();
  console.log(`Total courses: ${courses.length}\n`);
  
  if (courses.length > 0) {
    console.log('Sample courses:');
    courses.slice(0, 5).forEach(c => console.log(`  - ${c.title || c.id}`));
  }
  
  // Check membershipCourse assignments
  const membershipCourses = await prisma.membershipCourse.findMany();
  console.log(`\nMembershipCourse assignments: ${membershipCourses.length}`);
  
  if (membershipCourses.length > 0) {
    const mc = membershipCourses[0];
    const membership = await prisma.membership.findUnique({ where: { id: mc.membershipId } });
    const course = await prisma.course.findUnique({ where: { id: mc.courseId } });
    console.log(`  Example: ${membership?.name} → ${course?.title}`);
  }
  
  // Check existing enrollments
  const enrollments = await prisma.courseEnrollment.count();
  console.log(`\nExisting course enrollments: ${enrollments}\n`);
  
  await prisma.$disconnect();
}

checkCourseEnrollment().catch(console.error);
