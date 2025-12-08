import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function demoLayouts() {
  console.log('🎨 Demonstrating Different Button Layouts...\n');

  const bioPage = await prisma.affiliateBioPage.findFirst({
    select: {
      id: true,
      displayName: true,
      affiliate: {
        select: {
          user: {
            select: { username: true }
          }
        }
      }
    }
  });

  if (!bioPage) {
    console.log('❌ No bio page found!');
    return;
  }

  const username = bioPage.affiliate.user.username;
  const publicUrl = `http://localhost:3000/bio/${username}`;

  console.log(`📄 Bio Page: ${bioPage.displayName}`);
  console.log(`👤 Username: ${username}`);
  console.log(`🔗 Public URL: ${publicUrl}\n`);

  const layouts = [
    { value: 'stack', name: 'Stack (Vertikal)', description: 'Button penuh 1 per baris' },
    { value: 'grid-2', name: 'Grid 2 Kolom', description: '2 button per baris' },
    { value: 'grid-3', name: 'Grid 3 Kolom', description: '3 button per baris (desktop)' },
    { value: 'compact', name: 'Compact', description: 'Button kecil 2 per baris' },
    { value: 'masonry', name: 'Masonry', description: 'Dynamic grid' }
  ];

  console.log('🎯 Available Layouts:\n');

  for (let i = 0; i < layouts.length; i++) {
    const layout = layouts[i];
    
    // Update layout
    await prisma.affiliateBioPage.update({
      where: { id: bioPage.id },
      data: { buttonLayout: layout.value }
    });

    console.log(`${i + 1}. ${layout.name} (${layout.value})`);
    console.log(`   ${layout.description}`);
    console.log(`   ✅ Applied! View at: ${publicUrl}\n`);

    // Wait 2 seconds before next
    if (i < layouts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('🎉 Demo complete!\n');
  console.log('💡 To test manually:');
  console.log('   1. Open admin page: http://localhost:3000/affiliate/bio');
  console.log('   2. Find "Layout CTA Buttons" dropdown');
  console.log('   3. Select different layouts');
  console.log('   4. Click "Simpan Perubahan"');
  console.log(`   5. View changes at: ${publicUrl}\n`);

  // Final: Set to grid-2 as default demo
  await prisma.affiliateBioPage.update({
    where: { id: bioPage.id },
    data: { buttonLayout: 'grid-2' }
  });
  console.log('✅ Layout set to "grid-2" for demo');
}

demoLayouts()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
