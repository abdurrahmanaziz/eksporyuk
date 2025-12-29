const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIX MEMBERSHIP CONFIGURATION ===\n');
  
  // Get IDs
  const courses = await prisma.course.findMany();
  const groups = await prisma.group.findMany();
  const memberships = await prisma.membership.findMany();
  
  const kelasEkspor = courses.find(c => c.title === 'KELAS BIMBINGAN EKSPOR YUK');
  const kelasWebsite = courses.find(c => c.title === 'KELAS WEBSITE EKSPOR');
  const grupSupport = groups.find(g => g.name === 'Support Ekspor Yuk');
  const grupWebsite = groups.find(g => g.name === 'Website Ekspor');
  
  const paket6 = memberships.find(m => m.name === 'Paket 6 Bulan');
  const paket12 = memberships.find(m => m.name === 'Paket 12 Bulan');
  const paketLifetime = memberships.find(m => m.name === 'Paket Lifetime');
  const paketPromo = memberships.find(m => m.name === 'Promo Akhir Tahun 2025');
  
  console.log('Courses:', kelasEkspor?.title, '|', kelasWebsite?.title);
  console.log('Groups:', grupSupport?.name, '|', grupWebsite?.name);
  console.log('Memberships:', paket6?.name, '|', paket12?.name, '|', paketLifetime?.name, '|', paketPromo?.name);
  
  // DELETE ALL existing relations
  await prisma.membershipCourse.deleteMany({});
  await prisma.membershipGroup.deleteMany({});
  console.log('\nDeleted all existing membership relations');
  
  // CREATE NEW relations based on rules
  const newRelations = [];
  
  // Paket 6 Bulan: Kelas Ekspor + Grup Support
  if (paket6) {
    newRelations.push(
      { membershipId: paket6.id, courseId: kelasEkspor.id },
      { membershipId: paket6.id, groupId: grupSupport.id }
    );
  }
  
  // Paket 12 Bulan: Kelas Ekspor + Grup Support
  if (paket12) {
    newRelations.push(
      { membershipId: paket12.id, courseId: kelasEkspor.id },
      { membershipId: paket12.id, groupId: grupSupport.id }
    );
  }
  
  // Paket Lifetime: SEMUA (Kelas Ekspor + Kelas Website + Grup Support + Grup Website)
  if (paketLifetime) {
    newRelations.push(
      { membershipId: paketLifetime.id, courseId: kelasEkspor.id },
      { membershipId: paketLifetime.id, courseId: kelasWebsite.id },
      { membershipId: paketLifetime.id, groupId: grupSupport.id },
      { membershipId: paketLifetime.id, groupId: grupWebsite.id }
    );
  }
  
  // Promo Akhir Tahun: Kelas Ekspor + Grup Support
  if (paketPromo) {
    newRelations.push(
      { membershipId: paketPromo.id, courseId: kelasEkspor.id },
      { membershipId: paketPromo.id, groupId: grupSupport.id }
    );
  }
  
  // Insert courses
  const courseRelations = newRelations.filter(r => r.courseId);
  for (const rel of courseRelations) {
    await prisma.membershipCourse.create({ data: rel });
  }
  console.log('Created', courseRelations.length, 'course relations');
  
  // Insert groups
  const groupRelations = newRelations.filter(r => r.groupId);
  for (const rel of groupRelations) {
    await prisma.membershipGroup.create({ data: rel });
  }
  console.log('Created', groupRelations.length, 'group relations');
  
  // Verify
  console.log('\n=== VERIFICATION ===');
  const mc = await prisma.membershipCourse.findMany();
  const mg = await prisma.membershipGroup.findMany();
  
  for (const m of [paket6, paket12, paketLifetime, paketPromo].filter(Boolean)) {
    const mCourses = mc.filter(x => x.membershipId === m.id);
    const mGroups = mg.filter(x => x.membershipId === m.id);
    console.log(`\n${m.name}:`);
    console.log('  Courses:', mCourses.map(c => courses.find(x => x.id === c.courseId)?.title).join(', '));
    console.log('  Groups:', mGroups.map(g => groups.find(x => x.id === g.groupId)?.name).join(', '));
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
