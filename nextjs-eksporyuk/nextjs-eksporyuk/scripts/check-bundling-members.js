/**
 * Check if Premium Bundling members have been imported from Sejoli
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBundlingMembers() {
  console.log('🔍 Checking Premium Bundling Members...\n');
  
  // Get bundling membership
  const bundling = await prisma.membership.findFirst({
    where: {
      OR: [
        { name: { contains: 'Bundling', mode: 'insensitive' } },
        { name: { contains: 'EYA', mode: 'insensitive' } },
        { name: { contains: 'Ekspor Yuk + Aplikasi', mode: 'insensitive' } }
      ]
    }
  });
  
  if (!bundling) {
    console.log('❌ Membership Bundling tidak ditemukan!');
    console.log('\nMembership yang ada:');
    const allMemberships = await prisma.membership.findMany({
      select: { id: true, name: true, slug: true }
    });
    allMemberships.forEach(m => console.log(`  - ${m.name} (slug: ${m.slug})`));
    await prisma.$disconnect();
    return;
  }
  
  console.log(`✅ Found: ${bundling.name}`);
  console.log(`   ID: ${bundling.id}`);
  console.log(`   Slug: ${bundling.slug}\n`);
  
  // Count members
  const memberCount = await prisma.userMembership.count({
    where: { membershipId: bundling.id }
  });
  
  console.log(`👥 Total members: ${memberCount}\n`);
  
  if (memberCount === 0) {
    console.log('⚠️  Belum ada member di bundling membership!');
    console.log('   Import belum dilakukan atau gagal.');
  } else {
    // Show sample members
    const members = await prisma.userMembership.findMany({
      where: { membershipId: bundling.id },
      include: {
        user: {
          select: { 
            email: true, 
            name: true,
            whatsapp: true 
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📋 Sample members (latest 10):');
    members.forEach((um, i) => {
      console.log(`${i+1}. ${um.user.email}`);
      console.log(`   Name: ${um.user.name || 'N/A'}`);
      console.log(`   WhatsApp: ${um.user.whatsapp || 'N/A'}`);
      console.log(`   Joined: ${um.createdAt.toISOString().split('T')[0]}\n`);
    });
    
    // Check course enrollments
    console.log(`📚 Checking course enrollments for bundling members...`);
    const totalEnrollments = await prisma.courseEnrollment.count({
      where: {
        user: {
          memberships: {
            some: { membershipId: bundling.id }
          }
        }
      }
    });
    console.log(`   Total enrollments: ${totalEnrollments}\n`);
    
    // Check group memberships
    console.log(`👥 Checking group memberships for bundling members...`);
    const totalGroupMembers = await prisma.groupMember.count({
      where: {
        user: {
          memberships: {
            some: { membershipId: bundling.id }
          }
        }
      }
    });
    console.log(`   Total group memberships: ${totalGroupMembers}\n`);
    
    // Summary
    console.log('📊 Summary:');
    console.log(`   - ${memberCount} bundling members`);
    console.log(`   - ${totalEnrollments} course enrollments`);
    console.log(`   - ${totalGroupMembers} group memberships`);
    
    if (totalEnrollments === 0 || totalGroupMembers === 0) {
      console.log('\n⚠️  Auto-enroll/auto-join belum jalan untuk bundling members!');
    } else {
      console.log('\n✅ Auto-enroll dan auto-join sudah berjalan!');
    }
  }
  
  await prisma.$disconnect();
}

checkBundlingMembers().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
