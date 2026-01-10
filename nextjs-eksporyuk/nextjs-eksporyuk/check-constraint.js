const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Check a specific transaction
  const tx = await prisma.transaction.findUnique({
    where: { id: 'cmjd00vgv00025toxuo1ufdw3' }
  });
  console.log('Transaction exists:', !!tx);
  
  // Check if conversion exists
  const conv = await prisma.affiliateConversion.findUnique({
    where: { transactionId: 'cmjd00vgv00025toxuo1ufdw3' }
  });
  console.log('Conversion exists:', !!conv);
  if (conv) {
    console.log('Conversion:', conv);
  }
  
  // Check unique constraint on affiliateId
  const profiles = await prisma.affiliateProfile.findMany({
    where: { affiliateCode: { startsWith: 'SEJ' } }
  });
  console.log('\nSEJ profiles:', profiles.length);
  
  // Check email imamm0213@gmail.com
  const user = await prisma.user.findFirst({
    where: { email: 'imamm0213@gmail.com' }
  });
  console.log('\nUser for imamm0213@gmail.com:', user?.id);
  
  if (user) {
    const profile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    });
    console.log('Has profile:', !!profile);
    if (profile) {
      console.log('Profile:', profile.id, profile.affiliateCode);
    }
  }
  
  await prisma.$disconnect();
}
check();
