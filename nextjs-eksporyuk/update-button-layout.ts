import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingBioPages() {
  console.log('🔄 Checking bio pages...\n');

  // Get all bio pages
  const bioPages = await prisma.affiliateBioPage.findMany({
    select: {
      id: true,
      affiliateId: true,
      template: true,
      displayName: true
    }
  });

  console.log(`Found ${bioPages.length} bio pages total\n`);

  if (bioPages.length === 0) {
    console.log('⚠️  No bio pages found in database\n');
    return;
  }

  console.log('📊 Current Bio Pages:');
  bioPages.forEach((page, i) => {
    console.log(`   ${i + 1}. ${page.displayName || 'No Name'} (${page.template})`);
  });
  
  console.log('\n✅ All bio pages listed!\n');
  console.log('💡 Note: buttonLayout field has been added to schema');
  console.log('   Default value "stack" will be used for all pages');
}

updateExistingBioPages()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
