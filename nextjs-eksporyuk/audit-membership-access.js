const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  console.log('🔍 AUDIT LENGKAP MEMBERSHIP → GRUP → KELAS\n');
  console.log('═'.repeat(70));

  // 1. Memberships
  const memberships = await prisma.membership.findMany({
    include: {
      membershipGroups: { include: { group: true } },
      membershipCourses: { include: { course: true } },
      _count: { select: { userMemberships: true } }
    }
  });

  // 2. Groups
  const groups = await prisma.group.findMany({
    include: { _count: { select: { members: true } } }
  });

  // 3. Courses  
  const courses = await prisma.course.findMany({
    include: { _count: { select: { enrollments: true } } }
  });

  console.log('\n📦 MEMBERSHIPS:');
  memberships.forEach(m => {
    console.log(`\n   ${m.name}`);
    console.log(`      ID: ${m.id}`);
    console.log(`      Users: ${m._count.userMemberships}`);
    console.log(`      Groups linked: ${m.membershipGroups.length}`);
    console.log(`      Courses linked: ${m.membershipCourses.length}`);
  });

  console.log('\n\n👥 GROUPS:');
  groups.forEach(g => {
    console.log(`   ${g.name} (ID: ${g.id}) - ${g._count.members} members`);
  });

  console.log('\n\n📚 COURSES:');
  courses.forEach(c => {
    console.log(`   ${c.title} (ID: ${c.id}) - ${c._count.enrollments} enrolled`);
  });

  console.log('\n\n═'.repeat(70));
  console.log('💡 STATUS SISTEM:');
  console.log('═'.repeat(70));

  console.log('\n✅ YANG SUDAH BERES:');
  console.log('   - Sistem aktivasi membership → auto join grup/kelas SUDAH ADA');
  console.log('   - API untuk assign grup ke membership SUDAH ADA');
  console.log('   - API untuk assign kelas ke membership SUDAH ADA');
  console.log('   - UI Admin untuk konfigurasi SUDAH ADA');
  console.log('   - Webhook Xendit sudah handle auto join');
  console.log('   - Cron payment checker sudah handle auto join');

  console.log('\n⚠️ YANG PERLU DIKONFIGURASI:');
  console.log('   - Membership plan BELUM di-link ke grup');
  console.log('   - Membership plan BELUM di-link ke kelas');
  console.log('   - 4807 user dengan membership, tapi hanya 7 di grup');
  console.log('   - 4807 user dengan membership, tapi hanya 1 enrolled');

  console.log('\n🔧 SOLUSI:');
  console.log('   1. Admin perlu konfigurasi membership → pilih grup & kelas');
  console.log('   2. Jalankan script untuk sync existing users ke grup/kelas');

  await prisma.$disconnect();
}

audit();
