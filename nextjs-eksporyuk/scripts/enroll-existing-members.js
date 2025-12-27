const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enrollExistingMembers() {
  // Get all active memberships with their users
  const activeUserMemberships = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    select: {
      userId: true,
      membershipId: true
    }
  });
  
  console.log(`Found ${activeUserMemberships.length} active user memberships`);
  
  // Get membership-course links
  const membershipCourses = await prisma.membershipCourse.findMany();
  const membershipGroups = await prisma.membershipGroup.findMany();
  
  console.log(`\nMembership links:`);
  console.log(`- ${membershipCourses.length} course links`);
  console.log(`- ${membershipGroups.length} group links`);
  
  let coursesEnrolled = 0;
  let groupsJoined = 0;
  let skippedCourses = 0;
  let skippedGroups = 0;
  
  for (const um of activeUserMemberships) {
    // Get courses for this membership
    const coursesForMembership = membershipCourses.filter(mc => mc.membershipId === um.membershipId);
    const groupsForMembership = membershipGroups.filter(mg => mg.membershipId === um.membershipId);
    
    // Enroll in courses
    for (const mc of coursesForMembership) {
      try {
        const existing = await prisma.courseEnrollment.findFirst({
          where: { userId: um.userId, courseId: mc.courseId }
        });
        
        if (!existing) {
          await prisma.courseEnrollment.create({
            data: {
              userId: um.userId,
              courseId: mc.courseId
            }
          });
          coursesEnrolled++;
        } else {
          skippedCourses++;
        }
      } catch (e) {
        skippedCourses++;
      }
    }
    
    // Join groups
    for (const mg of groupsForMembership) {
      try {
        const existing = await prisma.groupMember.findFirst({
          where: { userId: um.userId, groupId: mg.groupId }
        });
        
        if (!existing) {
          await prisma.groupMember.create({
            data: {
              userId: um.userId,
              groupId: mg.groupId,
              role: 'MEMBER'
            }
          });
          groupsJoined++;
        } else {
          skippedGroups++;
        }
      } catch (e) {
        skippedGroups++;
      }
    }
  }
  
  console.log(`\n=== RESULTS ===`);
  console.log(`New course enrollments: ${coursesEnrolled}`);
  console.log(`New group memberships: ${groupsJoined}`);
  console.log(`Skipped (already enrolled): ${skippedCourses} courses, ${skippedGroups} groups`);
  
  await prisma.$disconnect();
}

enrollExistingMembers().catch(console.error);
