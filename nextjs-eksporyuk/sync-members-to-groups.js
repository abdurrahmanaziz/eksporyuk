const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncMembersToGroups() {
  console.log('🔄 SYNC MEMBERS TO GROUPS & COURSES\n');
  console.log('═'.repeat(60));

  try {
    // Get all active user memberships
    const userMemberships = await prisma.userMembership.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true } },
        membership: {
          include: {
            membershipGroups: true,
            membershipCourses: true
          }
        }
      }
    });

    console.log(`\n📊 Active User Memberships: ${userMemberships.length}`);

    let groupsAdded = 0;
    let coursesAdded = 0;
    let groupsSkipped = 0;
    let coursesSkipped = 0;

    for (const um of userMemberships) {
      // Add user to all membership groups
      for (const mg of um.membership.membershipGroups) {
        try {
          const existing = await prisma.groupMember.findUnique({
            where: {
              groupId_userId: {
                groupId: mg.groupId,
                userId: um.userId
              }
            }
          });
          
          if (!existing) {
            await prisma.groupMember.create({
              data: {
                groupId: mg.groupId,
                userId: um.userId,
                role: 'MEMBER'
              }
            });
            groupsAdded++;
          } else {
            groupsSkipped++;
          }
        } catch (e) {
          // Skip duplicate errors
        }
      }

      // Enroll user to all membership courses
      for (const mc of um.membership.membershipCourses) {
        try {
          const existing = await prisma.courseEnrollment.findUnique({
            where: {
              userId_courseId: {
                userId: um.userId,
                courseId: mc.courseId
              }
            }
          });
          
          if (!existing) {
            await prisma.courseEnrollment.create({
              data: {
                userId: um.userId,
                courseId: mc.courseId,
                progress: 0,
                completed: false
              }
            });
            coursesAdded++;
          } else {
            coursesSkipped++;
          }
        } catch (e) {
          // Skip duplicate errors
        }
      }

      // Also create UserCourseProgress for access
      for (const mc of um.membership.membershipCourses) {
        try {
          await prisma.userCourseProgress.upsert({
            where: {
              userId_courseId: {
                userId: um.userId,
                courseId: mc.courseId
              }
            },
            create: {
              userId: um.userId,
              courseId: mc.courseId,
              progress: 0,
              hasAccess: true,
              accessGrantedAt: new Date(),
              accessExpiresAt: um.endDate
            },
            update: {
              hasAccess: true,
              accessExpiresAt: um.endDate
            }
          });
        } catch (e) {
          // Skip errors
        }
      }

      if ((groupsAdded + coursesAdded) % 500 === 0 && (groupsAdded + coursesAdded) > 0) {
        console.log(`   Progress: ${groupsAdded} groups added, ${coursesAdded} enrollments added...`);
      }
    }

    console.log('\n═'.repeat(60));
    console.log('📊 RESULTS:');
    console.log('═'.repeat(60));
    console.log(`\n   Group Memberships Added: ${groupsAdded}`);
    console.log(`   Group Memberships Skipped (already exists): ${groupsSkipped}`);
    console.log(`   Course Enrollments Added: ${coursesAdded}`);
    console.log(`   Course Enrollments Skipped (already exists): ${coursesSkipped}`);

    // Final counts
    const totalGroupMembers = await prisma.groupMember.count();
    const totalEnrollments = await prisma.courseEnrollment.count();

    console.log(`\n   📈 Total Group Members Now: ${totalGroupMembers}`);
    console.log(`   📈 Total Course Enrollments Now: ${totalEnrollments}`);

    console.log('\n✅ Sync complete!');

  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncMembersToGroups();
