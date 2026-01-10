const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const bioPage = await prisma.affiliateBioPage.findFirst({
      where: {
        affiliate: {
          shortLinkUsername: 'rinaaff'
        }
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        coverImage: true,
        isActive: true,
        updatedAt: true
      }
    });
    
    console.log('\n=== BIO PAGE DATA ===');
    if (bioPage) {
      console.log('ID:', bioPage.id);
      console.log('Display Name:', bioPage.displayName);
      console.log('Is Active:', bioPage.isActive);
      console.log('Updated At:', bioPage.updatedAt);
      console.log('Avatar URL:', bioPage.avatarUrl ? `Set (length: ${bioPage.avatarUrl.length} chars)` : 'Not set');
      console.log('Cover Image:', bioPage.coverImage ? `Set (length: ${bioPage.coverImage.length} chars)` : 'Not set');
      
      if (bioPage.avatarUrl) {
        const isBase64 = bioPage.avatarUrl.startsWith('data:image/');
        console.log('Avatar is base64:', isBase64);
        if (isBase64) {
          console.log('Avatar format:', bioPage.avatarUrl.substring(0, 50) + '...');
        }
      }
      
      if (bioPage.coverImage) {
        const isBase64 = bioPage.coverImage.startsWith('data:image/');
        console.log('Cover is base64:', isBase64);
        if (isBase64) {
          console.log('Cover format:', bioPage.coverImage.substring(0, 50) + '...');
        }
      }
    } else {
      console.log('No bio page found for rinaaff');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
