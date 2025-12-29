const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIX ENROLLMENTS (BATCH) ===\n');
  
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  console.log('Courses:', courses.map(c => c.title).join(', '));
  
  const groups = await prisma.group.findMany({ select: { id: true, name: true } });
  console.log('Groups:', groups.map(g => g.name).join(', '));
  
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true }
  });
  console.log('Premium users:', premiumUsers.length);
  
  // Get existing
  const existingEnrollments = await prisma.courseEnrollment.findMany({ select: { userId: true, courseId: true } });
  const enrollmentSet = new Set(existingEnrollments.map(e => e.userId + '-' + e.courseId));
  
  const existingMembers = await prisma.groupMember.findMany({ select: { userId: true, groupId: true } });
  const memberSet = new Set(existingMembers.map(m => m.userId + '-' + m.groupId));
  
  console.log('Existing enrollments:', existingEnrollments.length);
  console.log('Existing group members:', existingMembers.length);
  
  // Build batch data
  const now = new Date();
  const enrollBatch = [];
  const memberBatch = [];
  
  for (const user of premiumUsers) {
    for (const course of courses) {
      const key = user.id + '-' + course.id;
      if (!enrollmentSet.has(key)) {
        enrollBatch.push({
          id: 'enroll_' + nanoid(),
          userId: user.id,
          courseId: course.id,
          updatedAt: now
        });
      }
    }
    for (const group of groups) {
      const key = user.id + '-' + group.id;
      if (!memberSet.has(key)) {
        memberBatch.push({
          id: 'gm_' + nanoid(),
          userId: user.id,
          groupId: group.id,
          role: 'MEMBER',
          status: 'APPROVED'
        });
      }
    }
  }
  
  console.log('\nTo create:', enrollBatch.length, 'enrollments,', memberBatch.length, 'group members');
  
  // Batch insert
  if (enrollBatch.length > 0) {
    console.log('Creating enrollments...');
    await prisma.courseEnrollment.createMany({ data: enrollBatch, skipDuplicates: true });
  }
  
  if (memberBatch.length > 0) {
    console.log('Creating group members...');
    await prisma.groupMember.createMany({ data: memberBatch, skipDuplicates: true });
  }
  
  console.log('\n=== RESULT ===');
  const totalEnroll = await prisma.courseEnrollment.count();
  const totalMembers = await prisma.groupMember.count();
  console.log('Total enrollments now:', totalEnroll);
  console.log('Total group members now:', totalMembers);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
