const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIX ENROLLMENTS ===\n');
  
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  console.log('Courses:', courses.map(c => c.title).join(', '));
  
  const groups = await prisma.group.findMany({ select: { id: true, name: true } });
  console.log('Groups:', groups.map(g => g.name).join(', '));
  
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true }
  });
  console.log('Premium users:', premiumUsers.length);
  
  const existingEnrollments = await prisma.courseEnrollment.findMany({
    select: { userId: true, courseId: true }
  });
  const enrollmentSet = new Set(existingEnrollments.map(e => e.userId + '-' + e.courseId));
  console.log('Existing enrollments:', existingEnrollments.length);
  
  const existingMembers = await prisma.groupMember.findMany({
    select: { userId: true, groupId: true }
  });
  const memberSet = new Set(existingMembers.map(m => m.userId + '-' + m.groupId));
  console.log('Existing group members:', existingMembers.length);
  
  let newEnrollments = 0;
  let newMembers = 0;
  let processed = 0;
  const now = new Date();
  
  for (const user of premiumUsers) {
    for (const course of courses) {
      const key = user.id + '-' + course.id;
      if (!enrollmentSet.has(key)) {
        await prisma.courseEnrollment.create({
          data: {
            id: 'enroll_' + nanoid(),
            userId: user.id,
            courseId: course.id,
            updatedAt: now
          }
        });
        newEnrollments++;
        enrollmentSet.add(key);
      }
    }
    
    for (const group of groups) {
      const key = user.id + '-' + group.id;
      if (!memberSet.has(key)) {
        await prisma.groupMember.create({
          data: {
            id: 'gm_' + nanoid(),
            userId: user.id,
            groupId: group.id,
            role: 'MEMBER',
            status: 'APPROVED'
          }
        });
        newMembers++;
        memberSet.add(key);
      }
    }
    
    processed++;
    if (processed % 500 === 0) {
      console.log('Processed:', processed, '/', premiumUsers.length, '| New enrollments:', newEnrollments, '| New members:', newMembers);
    }
  }
  
  console.log('\n=== RESULT ===');
  console.log('New enrollments:', newEnrollments);
  console.log('New group members:', newMembers);
  
  const totalEnroll = await prisma.courseEnrollment.count();
  const totalMembers = await prisma.groupMember.count();
  console.log('Total enrollments now:', totalEnroll);
  console.log('Total group members now:', totalMembers);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
