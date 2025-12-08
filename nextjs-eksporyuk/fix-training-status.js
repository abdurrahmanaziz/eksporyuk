const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function manualTrainingComplete() {
  console.log('🔧 Manually marking training as complete...\n');
  
  // Find affiliate profile
  const affiliate = await prisma.affiliateProfile.findFirst({
    where: { user: { email: 'affiliate@eksporyuk.com' } },
    include: { user: { select: { name: true, email: true } } }
  });
  
  if (!affiliate) {
    console.log('❌ Affiliate not found');
    return;
  }
  
  console.log(`👤 Found affiliate: ${affiliate.user.name}`);
  console.log(`   Current trainingCompleted: ${affiliate.trainingCompleted}`);
  
  // Update training completion
  const updated = await prisma.affiliateProfile.update({
    where: { id: affiliate.id },
    data: {
      trainingCompleted: true,
      trainingCompletedAt: new Date()
    }
  });
  
  console.log(`✅ Updated trainingCompleted to: ${updated.trainingCompleted}`);
  console.log(`   trainingCompletedAt: ${updated.trainingCompletedAt}`);
  
  await prisma.$disconnect();
}

manualTrainingComplete().catch(console.error);