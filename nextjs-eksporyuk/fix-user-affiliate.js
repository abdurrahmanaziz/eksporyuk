const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const prisma = new PrismaClient();

const createId = () => randomBytes(16).toString('hex');

async function fixUserAffiliate() {
  const userEmail = 'dherifkyalazhary29@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, name: true, whatsapp: true, role: true, affiliateMenuEnabled: true }
  });
  
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  
  console.log('User found:', user);
  
  // Check if affiliate profile exists
  const existingProfile = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id }
  });
  
  if (existingProfile) {
    console.log('Affiliate profile already exists:', existingProfile);
    await prisma.$disconnect();
    return;
  }
  
  console.log('Creating affiliate profile for:', user.name);
  
  // Generate affiliate code
  const baseCode = (user.name || 'AFF').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const affiliateCode = baseCode + randomSuffix;
  const shortLink = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  console.log('Affiliate Code:', affiliateCode);
  console.log('Short Link:', shortLink);
  
  const profile = await prisma.affiliateProfile.create({
    data: {
      id: createId(),
      userId: user.id,
      affiliateCode,
      shortLink,
      whatsapp: user.whatsapp || '',
      bankName: '',
      bankAccountName: '',
      bankAccountNumber: '',
      motivation: 'Diaktifkan oleh Admin',
      applicationStatus: 'APPROVED',
      isActive: true,
      approvedAt: new Date(),
      tier: 1,
      commissionRate: 10,
      totalClicks: 0,
      totalConversions: 0,
      totalEarnings: 0,
      updatedAt: new Date()
    }
  });
  
  console.log('✅ Affiliate Profile created:', profile.id);
  
  // Ensure wallet exists
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      id: createId(),
      userId: user.id,
      balance: 0,
      balancePending: 0,
      totalEarnings: 0,
      totalPayout: 0,
      updatedAt: new Date()
    }
  });
  
  console.log('✅ Wallet ensured');
  
  // Verify
  const verify = await prisma.affiliateProfile.findUnique({ where: { userId: user.id } });
  console.log('Verified profile:', verify);
  
  await prisma.$disconnect();
}

fixUserAffiliate().catch(console.error);
