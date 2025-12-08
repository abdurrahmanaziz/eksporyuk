const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sample small base64 image (1x1 red pixel PNG)
const SAMPLE_AVATAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const SAMPLE_COVER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

(async () => {
  try {
    // Find the bio page
    const bioPage = await prisma.affiliateBioPage.findFirst({
      where: {
        affiliate: {
          shortLinkUsername: 'rinaaff'
        }
      }
    });
    
    if (!bioPage) {
      console.error('Bio page not found for rinaaff');
      process.exit(1);
    }
    
    console.log('\n=== UPDATING BIO PAGE ===');
    console.log('Bio Page ID:', bioPage.id);
    console.log('Current Avatar:', bioPage.avatarUrl ? 'Set' : 'Not set');
    console.log('Current Cover:', bioPage.coverImage ? 'Set' : 'Not set');
    
    // Update with sample images
    const updated = await prisma.affiliateBioPage.update({
      where: { id: bioPage.id },
      data: {
        avatarUrl: SAMPLE_AVATAR,
        coverImage: SAMPLE_COVER,
        displayName: 'Test Ekspor Pintar'
      }
    });
    
    console.log('\n=== UPDATED SUCCESSFULLY ===');
    console.log('Avatar length:', updated.avatarUrl?.length || 0);
    console.log('Cover length:', updated.coverImage?.length || 0);
    console.log('Display Name:', updated.displayName);
    
    // Verify the update
    const verified = await prisma.affiliateBioPage.findUnique({
      where: { id: bioPage.id },
      select: {
        avatarUrl: true,
        coverImage: true,
        displayName: true
      }
    });
    
    console.log('\n=== VERIFICATION ===');
    console.log('Avatar is set:', !!verified?.avatarUrl);
    console.log('Cover is set:', !!verified?.coverImage);
    console.log('Display Name:', verified?.displayName);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
