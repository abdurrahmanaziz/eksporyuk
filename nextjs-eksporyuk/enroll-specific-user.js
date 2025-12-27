const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enrollSpecificUser() {
  const email = 'naufalfadli45@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true }
  });
  
  const membership = await prisma.userMembership.findFirst({
    where: { userId: user.id, status: 'ACTIVE' }
  });
  
  if (!membership) {
    console.log('No active membership');
    return;
  }
  
  const membershipCourses = await prisma.membershipCourse.findMany({
    where: { membershipId: membership.membershipId }
  });
  
  console.log(`Found ${membershipCourses.length} courses for membership`);
  
  for (const mc of membershipCourses) {
    const exists = await prisma.courseEnrollment.findFirst({
      where: {
        userId: user.id,
        courseId: mc.courseId
      }
    });
    
    if (!exists) {
      await prisma.courseEnrollment.create({
        data: {
          id: `enroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          courseId: mc.courseId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Enrolled ${email} to course ${mc.courseId}`);
    } else {
      console.log(`ℹ️  Already enrolled in course ${mc.courseId}`);
    }
  }
  
  await prisma.$disconnect();
}

enrollSpecificUser().catch(console.error);
