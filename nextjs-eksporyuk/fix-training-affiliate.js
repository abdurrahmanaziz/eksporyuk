const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTrainingAffiliate() {
  try {
    console.log('🔧 Fixing Training Affiliate course...\n');

    // Find the training affiliate course by searching for it first
    const course = await prisma.course.findFirst({
      where: { slug: 'training-affiliate' }
    });

    if (!course) {
      console.log('❌ Course "training-affiliate" not found');
      return;
    }

    console.log(`Found course: ${course.title} (ID: ${course.id})`);
    console.log(`Current isAffiliateTraining: ${course.isAffiliateTraining}`);

    // Update the course to set isAffiliateTraining to true
    const updated = await prisma.course.update({
      where: { id: course.id },
      data: {
        isAffiliateTraining: true,
        affiliateOnly: true
      }
    });

    console.log(`\n✅ Updated course successfully!`);
    console.log(`New isAffiliateTraining: ${updated.isAffiliateTraining}`);
    console.log(`New affiliateOnly: ${updated.affiliateOnly}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTrainingAffiliate();
