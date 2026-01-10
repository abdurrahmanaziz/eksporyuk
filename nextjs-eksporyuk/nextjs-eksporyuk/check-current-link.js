const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentLink() {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        role: 'AFFILIATE',
        affiliateProfile: { isNot: null }
      },
      include: { affiliateProfile: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (!user) {
      console.log('No affiliate found');
      return;
    }

    console.log('📊 CURRENT DATA:');
    console.log('User:', user.name);
    console.log('Email:', user.email);
    console.log('Username:', user.username || 'NULL');
    console.log('Affiliate Code:', user.affiliateProfile.affiliateCode);
    console.log('Short Link (DB):', user.affiliateProfile.shortLink);
    
    const displayUsername = user.username || user.affiliateProfile.shortLinkUsername || user.affiliateProfile.affiliateCode;
    console.log('\n�� EXPECTED LINK:', `https://eksporyuk.app/${displayUsername}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentLink();
