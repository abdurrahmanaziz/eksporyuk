const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

async function main() {
  console.log('=== RESTORE ENROLLMENTS & GROUP MEMBERS ===\n');
  
  const userMemberships = await prisma.userMembership.findMany({ where: { status: 'ACTIVE' } });
  console.log('Active memberships:', userMemberships.length);
  
  const memberships = await prisma.membership.findMany();
  const kelasEkspor = await prisma.course.findFirst({ where: { title: 'KELAS BIMBINGAN EKSPOR YUK' } });
  const kelasWebsite = await prisma.course.findFirst({ where: { title: 'KELAS WEBSITE EKSPOR' } });
  const grupSupport = await prisma.group.findFirst({ where: { name: 'Support Ekspor Yuk' } });
  const grupWebsite = await prisma.group.findFirst({ where: { name: 'Website Ekspor' } });
  
  const enrollments = [];
  const groupMembers = [];
  const now = new Date();
  
  for (const um of userMemberships) {
    const membership = memberships.find(m => m.id === um.membershipId);
    const userId = um.userId;
    
    // All: Kelas Ekspor + Grup Support
    enrollments.push({ id: 'enr_' + nanoid(), userId, courseId: kelasEkspor.id, updatedAt: now });
    groupMembers.push({ id: 'gm_' + nanoid(), userId, groupId: grupSupport.id, role: 'MEMBER' });
    
    // Lifetime only: Kelas Website + Grup Website
    if (membership?.name === 'Paket Lifetime') {
      enrollments.push({ id: 'enr_' + nanoid(), userId, courseId: kelasWebsite.id, updatedAt: now });
      groupMembers.push({ id: 'gm_' + nanoid(), userId, groupId: grupWebsite.id, role: 'MEMBER' });
    }
  }
  
  console.log('\nCreating', enrollments.length, 'enrollments...');
  await prisma.courseEnrollment.createMany({ data: enrollments, skipDuplicates: true });
  
  console.log('Creating', groupMembers.length, 'group members...');
  await prisma.groupMember.createMany({ data: groupMembers, skipDuplicates: true });
  
  const finalEnrollments = await prisma.courseEnrollment.count();
  const finalMembers = await prisma.groupMember.count();
  
  console.log('\n✅ DONE!');
  console.log('Final enrollments:', finalEnrollments);
  console.log('Final group members:', finalMembers);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
