const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncMembersFast() {
  console.log('🚀 FAST SYNC MEMBERS TO GROUPS & COURSES\n');
  console.log('═'.repeat(60));

  try {
    // Get all active user memberships
    const userMemberships = await prisma.userMembership.findMany({
      where: { status: 'ACTIVE' },
      select: {
        userId: true,
        endDate: true,
        membership: {
          select: {
            membershipGroups: { select: { groupId: true } },
            membershipCourses: { select: { courseId: true } }
          }
        }
      }
    });

    console.log(`\n📊 Active User Memberships: ${userMemberships.length}`);

    // Collect all group and course assignments
    const groupMemberData = [];
    const courseEnrollmentData = [];
    const courseProgressData = [];

    for (const um of userMemberships) {
      for (const mg of um.membership.membershipGroups) {
        groupMemberData.push({
          groupId: mg.groupId,
          userId: um.userId,
          role: 'MEMBER'
        });
      }
      
      for (const mc of um.membership.membershipCourses) {
        courseEnrollmentData.push({
          userId: um.userId,
          courseId: mc.courseId,
          progress: 0,
          completed: false
        });
        courseProgressData.push({
          userId: um.userId,
          courseId: mc.courseId,
          progress: 0,
          hasAccess: true,
          accessExpiresAt: um.endDate
        });
      }
    }

    console.log(`\n📝 Preparing to insert:`);
    console.log(`   - ${groupMemberData.length} group memberships`);
    console.log(`   - ${courseEnrollmentData.length} course enrollments`);

    // Batch insert group members (skip duplicates)
    console.log('\n🔄 Inserting group memberships...');
    const groupResult = await prisma.groupMember.createMany({
      data: groupMemberData,
      skipDuplicates: true
    });
    console.log(`   ✅ Created ${groupResult.count} new group memberships`);

    // Batch insert course enrollments (skip duplicates)
    console.log('\n🔄 Inserting course enrollments...');
    const enrollResult = await prisma.courseEnrollment.createMany({
      data: courseEnrollmentData,
      skipDuplicates: true
    });
    console.log(`   ✅ Created ${enrollResult.count} new course enrollments`);

    // For course progress, we need to do upserts in batches
    console.log('\n🔄 Updating course access...');
    let progressUpdated = 0;
    const batchSize = 100;
    
    for (let i = 0; i < courseProgressData.length; i += batchSize) {
      const batch = courseProgressData.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (cp) => {
        try {
          await prisma.userCourseProgress.upsert({
            where: {
              userId_courseId: {
                userId: cp.userId,
                courseId: cp.courseId
              }
            },
            create: {
              userId: cp.userId,
              courseId: cp.courseId,
              progress: 0,
              hasAccess: true,
              accessGrantedAt: new Date(),
              accessExpiresAt: cp.accessExpiresAt
            },
            update: {
              hasAccess: true,
              accessExpiresAt: cp.accessExpiresAt
            }
          });
          progressUpdated++;
        } catch (e) {
          // Skip errors
        }
      }));
      
      if (i % 1000 === 0) {
        console.log(`   Progress: ${i}/${courseProgressData.length}...`);
      }
    }
    console.log(`   ✅ Updated ${progressUpdated} course access records`);

    // Final counts
    console.log('\n═'.repeat(60));
    console.log('📊 FINAL COUNTS:');
    console.log('═'.repeat(60));
    
    const totalGroupMembers = await prisma.groupMember.count();
    const totalEnrollments = await prisma.courseEnrollment.count();
    const totalProgress = await prisma.userCourseProgress.count();

    console.log(`\n   👥 Total Group Members: ${totalGroupMembers}`);
    console.log(`   📚 Total Course Enrollments: ${totalEnrollments}`);
    console.log(`   📈 Total Course Access: ${totalProgress}`);

    console.log('\n✅ Sync complete!');

  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncMembersFast();
