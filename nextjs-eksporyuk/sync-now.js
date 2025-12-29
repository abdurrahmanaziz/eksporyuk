const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const p = new PrismaClient();

async function main() {
  console.log('=== SYNC PREMIUM USERS TO COURSES & GROUPS ===\n');
  
  // Get courses & groups
  const courses = await p.course.findMany({select:{id:true,title:true}});
  const groups = await p.group.findMany({select:{id:true,name:true}});
  
  console.log('Courses:', courses.map(c=>c.title).join(', '));
  console.log('Groups:', groups.map(g=>g.name).join(', '));
  
  // Get premium users
  const premiumUsers = await p.user.findMany({
    where: {role: 'MEMBER_PREMIUM'},
    select: {id: true, email: true}
  });
  console.log(`\nPremium users: ${premiumUsers.length}`);
  
  // Get existing enrollments & group members
  const existingEnrollments = await p.courseEnrollment.findMany({select:{userId:true,courseId:true}});
  const existingGroupMembers = await p.groupMember.findMany({select:{userId:true,groupId:true}});
  
  const enrollmentSet = new Set(existingEnrollments.map(e=>`${e.userId}-${e.courseId}`));
  const groupSet = new Set(existingGroupMembers.map(g=>`${g.userId}-${g.groupId}`));
  
  let enrollCreated = 0;
  let groupCreated = 0;
  
  for (const user of premiumUsers) {
    // Enroll to ALL courses
    for (const course of courses) {
      const key = `${user.id}-${course.id}`;
      if (!enrollmentSet.has(key)) {
        try {
          await p.courseEnrollment.create({
            data: {
              id: `enroll_${nanoid(16)}`,
              userId: user.id,
              courseId: course.id,
              enrolledAt: new Date(),
              progress: 0
            }
          });
          enrollCreated++;
        } catch(e) {
          // Skip duplicate
        }
      }
    }
    
    // Add to ALL groups
    for (const group of groups) {
      const key = `${user.id}-${group.id}`;
      if (!groupSet.has(key)) {
        try {
          await p.groupMember.create({
            data: {
              id: `gm_${nanoid(16)}`,
              userId: user.id,
              groupId: group.id,
              role: 'MEMBER',
              joinedAt: new Date()
            }
          });
          groupCreated++;
        } catch(e) {
          // Skip duplicate
        }
      }
    }
    
    if ((enrollCreated + groupCreated) % 1000 === 0 && enrollCreated > 0) {
      console.log(`Progress: ${enrollCreated} enrollments, ${groupCreated} group members`);
    }
  }
  
  console.log(`\n=== DONE ===`);
  console.log(`Created ${enrollCreated} new enrollments`);
  console.log(`Created ${groupCreated} new group memberships`);
  
  // Final count
  const finalEnroll = await p.courseEnrollment.count();
  const finalGroup = await p.groupMember.count();
  console.log(`\nFinal: ${finalEnroll} enrollments, ${finalGroup} group members`);
  
  await p.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
