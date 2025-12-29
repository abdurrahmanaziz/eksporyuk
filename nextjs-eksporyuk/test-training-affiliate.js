const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTrainingAffiliate() {
  try {
    console.log('🔍 Checking training affiliate courses...\n');

    // Check for courses with affiliate flags
    const allCourses = await prisma.course.findMany({
      where: {
        status: { in: ['PUBLISHED', 'APPROVED'] }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        isAffiliateTraining: true,
        isAffiliateMaterial: true,
        affiliateOnly: true,
        status: true
      }
    });

    console.log(`Total published/approved courses: ${allCourses.length}\n`);
    
    if (allCourses.length > 0) {
      console.log('Courses found:');
      allCourses.forEach(course => {
        console.log(`
  📚 ${course.title}
    - Slug: ${course.slug}
    - Affiliate Training: ${course.isAffiliateTraining}
    - Affiliate Material: ${course.isAffiliateMaterial}
    - Affiliate Only: ${course.affiliateOnly}
    - Status: ${course.status}
        `);
      });
    } else {
      console.log('⚠️  No published/approved courses found!');
      console.log('You need to create and publish at least one course with isAffiliateTraining or isAffiliateMaterial = true');
    }

    // Check for courses with isAffiliateTraining flag
    const trainingCourses = await prisma.course.findMany({
      where: {
        isAffiliateTraining: true,
        status: { in: ['PUBLISHED', 'APPROVED'] }
      },
      select: {
        id: true,
        title: true,
        slug: true
      }
    });

    console.log(`\n✅ Training courses (isAffiliateTraining=true): ${trainingCourses.length}`);
    if (trainingCourses.length === 0) {
      console.log('⚠️  No training courses found. The /learn/training-affiliate page needs at least one course with isAffiliateTraining=true');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTrainingAffiliate();
