const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTrainingCompletionStatus() {
  console.log('🔧 Fixing training completion status...\n');
  
  // Find training course
  const trainingCourse = await prisma.course.findFirst({
    where: { slug: 'traning-affiliate' },
    select: { id: true, title: true }
  });
  
  if (!trainingCourse) {
    console.log('❌ Training course not found');
    return;
  }
  
  console.log(`🎯 Training Course: ${trainingCourse.title}`);
  
  // Find affiliates who have:
  // 1. Completed the course enrollment (100% progress)
  // 2. Have submitted a review for the course
  // 3. But trainingCompleted is still false
  
  const affiliatesNeedingUpdate = await prisma.affiliateProfile.findMany({
    where: {
      trainingCompleted: false,
      user: {
        role: 'AFFILIATE',
        courseEnrollments: {
          some: {
            courseId: trainingCourse.id,
            completed: true,
            progress: 100
          }
        },
        courseReviews: {
          some: {
            courseId: trainingCourse.id
          }
        }
      }
    },
    include: {
      user: {
        select: { 
          name: true, 
          email: true,
          courseEnrollments: {
            where: { courseId: trainingCourse.id },
            select: { completed: true, progress: true, completedAt: true }
          },
          courseReviews: {
            where: { courseId: trainingCourse.id },
            select: { rating: true, createdAt: true }
          }
        }
      }
    }
  });
  
  console.log(`\n📋 Found ${affiliatesNeedingUpdate.length} affiliates needing training completion update:`);
  
  for (const affiliate of affiliatesNeedingUpdate) {
    const enrollment = affiliate.user.courseEnrollments[0];
    const review = affiliate.user.courseReviews[0];
    
    console.log(`\n👤 ${affiliate.user.name} (${affiliate.user.email})`);
    console.log(`   Course completed: ${enrollment?.completed} (${enrollment?.progress}%)`);
    console.log(`   Review submitted: ${review ? `${review.rating}/5 stars` : 'No'}`);
    console.log(`   Current training status: ${affiliate.trainingCompleted}`);
    
    if (enrollment?.completed && review) {
      // Update training completion
      await prisma.affiliateProfile.update({
        where: { id: affiliate.id },
        data: {
          trainingCompleted: true,
          trainingCompletedAt: review.createdAt // Use review submission date
        }
      });
      
      console.log(`   ✅ Updated training completion status`);
    }
  }
  
  console.log(`\n🎉 Training completion status fixed for ${affiliatesNeedingUpdate.length} affiliates!`);
  
  await prisma.$disconnect();
}

fixTrainingCompletionStatus().catch(console.error);