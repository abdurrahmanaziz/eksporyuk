const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

async function main() {
  console.log('=== SYNC SEJOLI USERS TO COURSES & GROUPS ===\n');
  
  // Get all courses and groups
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  const groups = await prisma.group.findMany({ select: { id: true, name: true } });
  
  console.log(`Courses: ${courses.map(c => c.title).join(', ')}`);
  console.log(`Groups: ${groups.map(g => g.name).join(', ')}`);
  
  // Get users with ACTIVE membership
  const activeUMs = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true, membershipId: true, endDate: true }
  });
  
  console.log(`\nTotal users with active membership: ${activeUMs.length}`);
  
  let enrolledCount = 0;
  let groupedCount = 0;
  let skippedEnroll = 0;
  let skippedGroup = 0;
  const now = new Date();
  
  for (let i = 0; i < activeUMs.length; i++) {
    const um = activeUMs[i];
    
    if (i % 500 === 0) {
      console.log(`Processing ${i}/${activeUMs.length}...`);
    }
    
    // Enroll to all courses
    for (const course of courses) {
      const exists = await prisma.courseEnrollment.findFirst({
        where: { userId: um.userId, courseId: course.id }
      });
      
      if (!exists) {
        await prisma.courseEnrollment.create({
          data: {
            id: `enroll_${nanoid(16)}`,
            userId: um.userId,
            courseId: course.id,
            progress: 0,
            completed: false,
            createdAt: now,
            updatedAt: now
          }
        });
        enrolledCount++;
      } else {
        skippedEnroll++;
      }
    }
    
    // Add to all groups
    for (const group of groups) {
      const exists = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: um.userId } }
      });
      
      if (!exists) {
        await prisma.groupMember.create({
          data: {
            id: `gm_${nanoid(16)}`,
            groupId: group.id,
            userId: um.userId,
            role: 'MEMBER',
            createdAt: now,
            updatedAt: now
          }
        });
        groupedCount++;
      } else {
        skippedGroup++;
      }
    }
  }
  
  console.log(`\n=== RESULTS ===`);
  console.log(`New course enrollments created: ${enrolledCount}`);
  console.log(`Existing enrollments skipped: ${skippedEnroll}`);
  console.log(`New group members added: ${groupedCount}`);
  console.log(`Existing group members skipped: ${skippedGroup}`);
  
  // Final counts
  const totalEnrollments = await prisma.courseEnrollment.count();
  const totalGroupMembers = await prisma.groupMember.count();
  
  console.log(`\n=== FINAL TOTALS ===`);
  console.log(`Total course enrollments: ${totalEnrollments}`);
  console.log(`Total group members: ${totalGroupMembers}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
