/**
 * QUICK COURSE ENROLLMENT - Sample 100 users
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickCourseEnroll() {
  console.log('🚀 QUICK COURSE ENROLLMENT (Sample 100)\n');
  
  const activeMemberships = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    take: 100
  });
  
  let enrolled = 0;
  
  for (const um of activeMemberships) {
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId: um.membershipId }
    });
    
    for (const mc of membershipCourses) {
      const exists = await prisma.courseEnrollment.findFirst({
        where: {
          userId: um.userId,
          courseId: mc.courseId
        }
      });
      
      if (!exists) {
        await prisma.courseEnrollment.create({
          data: {
            id: `enroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: um.userId,
            courseId: mc.courseId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        enrolled++;
        if (enrolled <= 5) console.log(`✅ Enrolled user to course ${mc.courseId}`);
      }
    }
  }
  
  console.log(`\n✅ Quick enrolled: ${enrolled} course enrollments`);
  await prisma.$disconnect();
}

quickCourseEnroll().catch(console.error);