const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCourseEnrollmentAndProgress() {
  console.log('📈 Checking course enrollments and progress...\n');
  
  // Find training course
  const trainingCourse = await prisma.course.findFirst({
    where: { slug: 'traning-affiliate' },
    select: { id: true, title: true, slug: true }
  });
  
  if (!trainingCourse) {
    console.log('❌ Training course not found');
    return;
  }
  
  console.log(`🎯 Training Course: ${trainingCourse.title} (ID: ${trainingCourse.id})`);
  
  // Check enrollments for this course
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId: trainingCourse.id },
    include: {
      user: {
        select: { name: true, email: true, role: true }
      }
    }
  });
  
  console.log(`\n📝 Enrollments (${enrollments.length}):`);
  enrollments.forEach(enrollment => {
    console.log(`  • ${enrollment.user.name} (${enrollment.user.email}) - ${enrollment.user.role}`);
    console.log(`    Progress: ${enrollment.progress}%`);
    console.log(`    Completed: ${enrollment.completed}`);
    console.log(`    Completed At: ${enrollment.completedAt}`);
  });
  
  await prisma.$disconnect();
}

checkCourseEnrollmentAndProgress().catch(console.error);