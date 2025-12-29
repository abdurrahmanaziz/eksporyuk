const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIX ENROLLMENTS & GROUPS (CORRECT) ===\n');
  
  // Delete all first
  await prisma.courseEnrollment.deleteMany({});
  await prisma.groupMember.deleteMany({});
  console.log('Deleted all enrollments and group members\n');
  
  // Get IDs
  const kelasEkspor = 'tutor_course_1678'; // KELAS BIMBINGAN EKSPOR YUK
  const kelasWebsite = 'tutor_course_8692'; // KELAS WEBSITE EKSPOR
  const grupSupport = 'group_support-ekspor-yuk';
  const grupWebsite = 'group_website-ekspor';
  
  // Get active memberships
  const userMemberships = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true, membershipId: true }
  });
  
  const enrollBatch = [];
  const groupBatch = [];
  
  for (const um of userMemberships) {
    const isLifetime = um.membershipId === 'mem_lifetime_ekspor';
    
    // SEMUA membership dapat KELAS BIMBINGAN EKSPOR YUK
    enrollBatch.push({
      id: 'enroll_' + nanoid(),
      userId: um.userId,
      courseId: kelasEkspor,
      progress: 0,
      updatedAt: new Date()
    });
    
    // LIFETIME dapat tambahan KELAS WEBSITE EKSPOR
    if (isLifetime) {
      enrollBatch.push({
        id: 'enroll_' + nanoid(),
        userId: um.userId,
        courseId: kelasWebsite,
        progress: 0,
        updatedAt: new Date()
      });
    }
    
    // SEMUA membership dapat Support Ekspor Yuk
    groupBatch.push({
      id: 'gm_' + nanoid(),
      userId: um.userId,
      groupId: grupSupport,
      role: 'MEMBER'
    });
    
    // LIFETIME dapat tambahan Website Ekspor
    if (isLifetime) {
      groupBatch.push({
        id: 'gm_' + nanoid(),
        userId: um.userId,
        groupId: grupWebsite,
        role: 'MEMBER'
      });
    }
  }
  
  console.log('Creating enrollments:', enrollBatch.length);
  await prisma.courseEnrollment.createMany({ data: enrollBatch });
  
  console.log('Creating group members:', groupBatch.length);
  await prisma.groupMember.createMany({ data: groupBatch });
  
  console.log('\n=== FINAL COUNTS ===');
  const finalEnrollments = await prisma.courseEnrollment.count();
  const finalGroups = await prisma.groupMember.count();
  console.log('Enrollments:', finalEnrollments);
  console.log('Group Members:', finalGroups);
  
  // Breakdown by course
  const eksporCount = await prisma.courseEnrollment.count({ where: { courseId: kelasEkspor } });
  const websiteCount = await prisma.courseEnrollment.count({ where: { courseId: kelasWebsite } });
  console.log('\nKELAS BIMBINGAN EKSPOR YUK:', eksporCount);
  console.log('KELAS WEBSITE EKSPOR:', websiteCount);
  
  // Breakdown by group
  const supportCount = await prisma.groupMember.count({ where: { groupId: grupSupport } });
  const websiteGrupCount = await prisma.groupMember.count({ where: { groupId: grupWebsite } });
  console.log('\nSupport Ekspor Yuk:', supportCount);
  console.log('Website Ekspor:', websiteGrupCount);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
