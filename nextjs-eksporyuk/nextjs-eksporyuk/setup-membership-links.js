const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up Membership-Course-Group Connections...\n');
  
  // Get memberships
  const memberships = await prisma.membership.findMany();
  const sixMonth = memberships.find(m => m.name.includes('6 Bulan'));
  const twelveMonth = memberships.find(m => m.name.includes('12 Bulan'));
  const lifetime = memberships.find(m => m.name.includes('Lifetime'));
  const free = memberships.find(m => m.name.includes('Free'));
  
  console.log('📦 Found Memberships:');
  console.log('   - 6 Bulan:', sixMonth?.id);
  console.log('   - 12 Bulan:', twelveMonth?.id);
  console.log('   - Lifetime:', lifetime?.id);
  console.log('   - Free:', free?.id);
  
  // Get courses
  const courses = await prisma.course.findMany();
  const kelasEkspor = courses.find(c => c.title.includes('BIMBINGAN EKSPOR'));
  const kelasWebsite = courses.find(c => c.title.includes('WEBSITE EKSPOR'));
  
  console.log('\n📚 Found Courses:');
  console.log('   - Kelas Ekspor:', kelasEkspor?.id);
  console.log('   - Kelas Website:', kelasWebsite?.id);
  
  // Find admin user to be owner
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  console.log('\n👤 Admin:', admin?.id, admin?.name);
  
  // STEP 1: Create Groups
  console.log('\n\n👥 STEP 1: Creating Support Groups...');
  
  let grupEkspor = await prisma.group.findFirst({ where: { slug: 'support-ekspor-yuk' } });
  if (!grupEkspor) {
    grupEkspor = await prisma.group.create({
      data: {
        name: 'Grup Support Ekspor Yuk',
        slug: 'support-ekspor-yuk',
        description: 'Grup support untuk semua member Ekspor Yuk. Diskusi, tanya jawab, dan networking sesama eksportir.',
        type: 'PRIVATE',
        isActive: true,
        ownerId: admin.id,
      }
    });
    console.log('   ✅ Created: Grup Support Ekspor Yuk (ID:', grupEkspor.id, ')');
  } else {
    console.log('   ℹ️ Grup Support Ekspor Yuk exists (ID:', grupEkspor.id, ')');
  }
  
  let grupWebsite = await prisma.group.findFirst({ where: { slug: 'support-website-ekspor' } });
  if (!grupWebsite) {
    grupWebsite = await prisma.group.create({
      data: {
        name: 'Grup Support Website Ekspor',
        slug: 'support-website-ekspor',
        description: 'Grup eksklusif untuk member Lifetime. Diskusi dan support khusus Kelas Website Ekspor.',
        type: 'PRIVATE',
        isActive: true,
        ownerId: admin.id,
      }
    });
    console.log('   ✅ Created: Grup Support Website Ekspor (ID:', grupWebsite.id, ')');
  } else {
    console.log('   ℹ️ Grup Support Website Ekspor exists (ID:', grupWebsite.id, ')');
  }
  
  // STEP 2: Link Courses to Memberships
  console.log('\n\n📚 STEP 2: Linking Courses to Memberships...');
  
  await prisma.membershipCourse.deleteMany({});
  console.log('   🗑️ Cleared existing course links');
  
  const paidMemberships = [sixMonth, twelveMonth, lifetime].filter(Boolean);
  for (const membership of paidMemberships) {
    await prisma.membershipCourse.create({
      data: {
        membershipId: membership.id,
        courseId: kelasEkspor.id,
      }
    });
    console.log('   ✅ Linked Kelas Ekspor →', membership.name);
  }
  
  await prisma.membershipCourse.create({
    data: {
      membershipId: lifetime.id,
      courseId: kelasWebsite.id,
    }
  });
  console.log('   ✅ Linked Kelas Website → Lifetime ONLY');
  
  // STEP 3: Link Groups to Memberships
  console.log('\n\n👥 STEP 3: Linking Groups to Memberships...');
  
  await prisma.membershipGroup.deleteMany({});
  console.log('   🗑️ Cleared existing group links');
  
  for (const membership of paidMemberships) {
    await prisma.membershipGroup.create({
      data: {
        membershipId: membership.id,
        groupId: grupEkspor.id,
      }
    });
    console.log('   ✅ Linked Grup Ekspor →', membership.name);
  }
  
  await prisma.membershipGroup.create({
    data: {
      membershipId: lifetime.id,
      groupId: grupWebsite.id,
    }
  });
  console.log('   ✅ Linked Grup Website → Lifetime ONLY');
  
  // SUMMARY
  console.log('\n\n============================================================');
  console.log('📊 SETUP SUMMARY');
  console.log('============================================================');
  
  console.log('\n🎓 KELAS BIMBINGAN EKSPOR YUK:');
  console.log('   → 6 Bulan ✅');
  console.log('   → 12 Bulan ✅');
  console.log('   → Lifetime ✅');
  
  console.log('\n🌐 KELAS WEBSITE EKSPOR:');
  console.log('   → Lifetime ONLY ✅');
  
  console.log('\n👥 GRUP SUPPORT EKSPOR YUK:');
  console.log('   → 6 Bulan ✅');
  console.log('   → 12 Bulan ✅');
  console.log('   → Lifetime ✅');
  
  console.log('\n👥 GRUP SUPPORT WEBSITE:');
  console.log('   → Lifetime ONLY ✅');
  
  console.log('\n============================================================');
  console.log('✅ Setup completed successfully!');
  console.log('============================================================');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
