const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

async function main() {
  console.log('=== RESTORE ENROLLMENTS & GROUP MEMBERS ===\n');
  
  // Get all active user memberships
  const userMemberships = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' }
  });
  
  console.log('Active memberships:', userMemberships.length);
  
  // Get memberships
  const memberships = await prisma.membership.findMany();
  
  // Get courses and groups
  const kelasEkspor = await prisma.course.findFirst({ where: { title: 'KELAS BIMBINGAN EKSPOR YUK' } });
  const kelasWebsite = await prisma.course.findFirst({ where: { title: 'KELAS WEBSITE EKSPOR' } });
  const grupSupport = await prisma.group.findFirst({ where: { name: 'Support Ekspor Yuk' } });
  const grupWebsite = await prisma.group.findFirst({ where: { name: 'Website Ekspor' } });
  
  console.log('Kelas Ekspor:', kelasEkspor.id);
  console.log('Kelas Website:', kelasWebsite.id);
  console.log('Grup Support:', grupSupport.id);
  console.log('Grup Website:', grupWebsite.id);
  
  const enrollments = [];
  const groupMembers = [];
  
  for (const um of userMemberships) {
    const membership = memberships.find(m => m.id === um.membershipId);
    const membershipName = membership?.name;
    const userId = um.userId;
    
    // All memberships get Kelas Ekspor + Grup Support
    enrollments.push({
      id: 'enr_' + nanoid(),
      userId,
      courseId: kelasEkspor.id
    });
    
    groupMembers.push({
      id: 'gm_' + nanoid(),
      userId,
      groupId: grupSupport.id,
      role: 'MEMBER'
    });
    
    // Only Lifetime gets Kelas Website + Grup Website
    if (membershipName === 'Paket Lifetime') {
      enrollments.push({
        id: 'enr_' + nanoid(),
        userId,
        courseId: kelasWebsite.id
      });
      
      groupMembers.push({
        id: 'gm_' + nanoid(),
        userId,
        groupId: grupWebsite.id,
        role: 'MEMBER'
      });
    }
  }
  
  console.log('\nTo create:', enrollments.length, 'enrollments');
  console.log('To create:', groupMembers.length, 'group members');
  
  // Batch create
  console.log('\nCreating enrollments...');
  await prisma.courseEnrollment.createMany({ data: enrollments, skipDuplicates: true });
  
  console.log('Creating group members...');
  await prisma.groupMember.createMany({ data: groupMembers, skipDuplicates: true });
  
  console.log('\n✅ Done!');
  
  // Final counts
  const finalEnrollments = await prisma.courseEnrollment.count();
  const finalMembers = await prisma.groupMember.count();
  
  console.log('\nFinal enrollments:', finalEnrollments);
  console.log('Final group members:', finalMembers);
  
  // Breakdown by membership
  console.log('\n=== BREAKDOWN BY MEMBERSHIP ===');
  const paketLifetime = memberships.find(m => m.name === 'Paket Lifetime');
  
  const lifetime = userMemberships.filter(um => um.membershipId === paketLifetime?.id);
  const non_lifetime = userMemberships.filter(um => um.membershipId !== paketLifetime?.id);
  
  console.log('Lifetime users:', lifetime.length, '→', lifetime.length * 2, 'enrollments +', lifetime.length * 2, 'groups');
  console.log('Non-Lifetime users:', non_lifetime.length, '→', non_lifetime.length, 'enrollments +', non_lifetime.length, 'groups');
  console.log('Expected total enrollments:', lifetime.length * 2 + non_lifetime.length);
  console.log('Expected total group members:', lifetime.length * 2 + non_lifetime.length);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
