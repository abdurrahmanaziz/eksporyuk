/**
 * Create Default Groups
 * Creates initial support and community groups
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createGroups() {
  console.log('👥 CREATING DEFAULT GROUPS');
  console.log('==========================\n');

  try {
    // Get admin user as owner
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      throw new Error('Admin user not found! Create admin first.');
    }

    console.log(`Using admin as owner: ${adminUser.email}\n`);

    // 1. Group Support Ekspor Yuk
    const supportGroup = await prisma.group.create({
      data: {
        name: 'Support Ekspor Yuk',
        slug: 'support-ekspor-yuk',
        description: 'Grup support untuk semua member Ekspor Yuk. Tanya jawab, diskusi, dan bantuan seputar ekspor.',
        type: 'PUBLIC',
        ownerId: adminUser.id,
        isActive: true,
        requireApproval: false,
        allowRichText: true,
        allowMedia: true,
        allowPolls: true,
      }
    });

    console.log('✅ Created: Support Ekspor Yuk');
    console.log(`   ID: ${supportGroup.id}`);
    console.log(`   Slug: ${supportGroup.slug}\n`);

    // 2. Group Website Ekspor
    const websiteGroup = await prisma.group.create({
      data: {
        name: 'Website Ekspor',
        slug: 'website-ekspor',
        description: 'Komunitas khusus untuk pembahasan website ekspor, digital marketing, dan online presence untuk eksportir.',
        type: 'PRIVATE',
        ownerId: adminUser.id,
        isActive: true,
        requireApproval: true,
        allowRichText: true,
        allowMedia: true,
        allowPolls: true,
      }
    });

    console.log('✅ Created: Website Ekspor');
    console.log(`   ID: ${websiteGroup.id}`);
    console.log(`   Slug: ${websiteGroup.slug}\n`);

    // Summary
    const totalGroups = await prisma.group.count();
    console.log('📊 Summary:');
    console.log(`   Total Groups: ${totalGroups}\n`);

    console.log('✅ Groups created successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createGroups().catch(console.error);
