const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAndTestTraining() {
  console.log('🔄 Resetting training status for testing...\n');
  
  // Reset affiliate training status
  const affiliate = await prisma.affiliateProfile.findFirst({
    where: { user: { email: 'affiliate@eksporyuk.com' } }
  });
  
  if (affiliate) {
    await prisma.affiliateProfile.update({
      where: { id: affiliate.id },
      data: {
        trainingCompleted: false,
        trainingCompletedAt: null
      }
    });
    console.log('✅ Reset training status to false');
  }
  
  // Get course info for testing
  const course = await prisma.course.findFirst({
    where: { slug: 'traning-affiliate' },
    select: {
      id: true,
      title: true,
      slug: true,
      isAffiliateTraining: true,
      affiliateOnly: true
    }
  });
  
  console.log('\n📚 Course info for testing:');
  console.log(`   Title: ${course.title}`);
  console.log(`   Slug: ${course.slug}`);
  console.log(`   isAffiliateTraining: ${course.isAffiliateTraining}`);
  console.log(`   affiliateOnly: ${course.affiliateOnly}`);
  
  await prisma.$disconnect();
}

resetAndTestTraining().catch(console.error);