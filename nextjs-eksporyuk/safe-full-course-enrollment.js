const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function safeFullCourseEnrollment() {
  console.log('🚀 SAFE FULL COURSE ENROLLMENT - Starting...');
  console.log('⚠️  SAFETY MODE: Only adding enrollments, never deleting anything');
  
  try {
    // Get all users with active memberships
    const activeMembers = await prisma.userMembership.findMany({
      where: { status: 'ACTIVE' }
    });

    console.log(`📊 Found ${activeMembers.length} active memberships`);

    let totalEnrolled = 0;
    let alreadyEnrolled = 0;
    let processed = 0;

    for (const member of activeMembers) {
      processed++;
      
      // Progress indicator
      if (processed % 500 === 0) {
        console.log(`📈 Progress: ${processed}/${activeMembers.length} processed (${totalEnrolled} enrolled, ${alreadyEnrolled} already enrolled)`);
      }

      // Get courses for this membership
      const membershipCourses = await prisma.membershipCourse.findMany({
        where: { membershipId: member.membershipId },
        select: { courseId: true }
      });

      for (const mc of membershipCourses) {
        // Check if user is already enrolled in this course
        const existingEnrollment = await prisma.courseEnrollment.findFirst({
          where: {
            userId: member.userId,
            courseId: mc.courseId
          }
        });

        if (!existingEnrollment) {
          // Safe enrollment - only add, never delete
          try {
            await prisma.courseEnrollment.create({
              data: {
                id: `enroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: member.userId,
                courseId: mc.courseId,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            totalEnrolled++;
            
            if (totalEnrolled <= 10) {
              console.log(`✅ Enrolled user ${member.userId} to course ${mc.courseId}`);
            }
          } catch (error) {
            console.log(`⚠️  Error enrolling user ${member.userId}: ${error.message}`);
          }
        } else {
          alreadyEnrolled++;
        }
      }
    }

    console.log('\n🎉 SAFE ENROLLMENT COMPLETE!');
    console.log(`📊 Final Stats:`);
    console.log(`   • Users processed: ${processed}`);
    console.log(`   • New enrollments: ${totalEnrolled}`);
    console.log(`   • Already enrolled: ${alreadyEnrolled}`);
    console.log(`   • Total operations: ${totalEnrolled + alreadyEnrolled}`);

  } catch (error) {
    console.error('❌ Error during enrollment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

safeFullCourseEnrollment().catch(console.error);