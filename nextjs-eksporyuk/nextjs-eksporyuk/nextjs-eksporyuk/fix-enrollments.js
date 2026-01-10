const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIXING ENROLLMENTS FOR PREMIUM USERS ===\n');
  
  // Get all courses
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  console.log(`Courses: ${courses.map(c => c.title).join(', ')}`);
  
  // Get all groups
  const groups = await prisma.group.findMany({ select: { id: true, name: true } });
  console.log(`Groups: ${groups.map(g => g.name).join(', ')}`);
  
  // Get premium users
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true, email: true }
  });
  console.log(`\nPremium users: ${premiumUsers.length}`);
  
  let enrolledCount = 0;
  let groupAddedCount = 0;
  
  for (const user of premiumUsers) {
    // Enroll to all courses
    for (const course of courses) {
      try {
        await prisma.courseEnrollment.upsert({
          where: { uniqueEnrollment: { userId: user.id, courseId: course.id } },
          create: { userId: user.id, courseId: course.id, status: 'ACTIVE' },
          update: {}
        });
        enrolledCount++;
      } catch (e) {}
    }
    
    // Add to all groups
    for (const group of groups) {
      try {
        await prisma.groupMember.upsert({
          where: { uniqueMember: { userId: user.id, groupId: group.id } },
          create: { userId: user.id, groupId: group.id, role: 'MEMBER', status: 'APPROVED' },
          update: {}
        });
        groupAddedCount++;
      } catch (e) {}
    }
    
    if (enrolledCount % 500 === 0) {
      console.log(`Progress: ${enrolledCount} enrollments...`);
    }
  }
  
  console.log(`\n=== DONE ===`);
  console.log(`Course enrollments created/updated: ${enrolledCount}`);
  console.log(`Group memberships created/updated: ${groupAddedCount}`);
  
  // Final count
  const totalEnrollments = await prisma.courseEnrollment.count();
  const totalGroupMembers = await prisma.groupMember.count();
  console.log(`\nTotal enrollments now: ${totalEnrollments}`);
  console.log(`Total group members now: ${totalGroupMembers}`);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
