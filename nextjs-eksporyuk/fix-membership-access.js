const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMembershipAccess() {
  console.log('🔧 FIXING MEMBERSHIP ACCESS - PRECISE MAPPING\n');
  console.log('===========================================\n');

  // Mapping yang BENAR sesuai audit
  const membershipMapping = {
    'cmjauif2n0001it1h0q4kwjym': { // 12 Bulan
      name: 'Paket Ekspor Yuk - 12 Bulan',
      allowedGroups: ['cmjffnu3c0000it5akoioe0rz'], // Grup Support Ekspor Yuk
      allowedCourses: ['cmjfez54x0000itvavoi5lns0'] // KELAS BIMBINGAN EKSPOR YUK
    },
    'cmjauiev30000it1h0c0wndna': { // 6 Bulan  
      name: 'Paket Ekspor Yuk - 6 Bulan',
      allowedGroups: ['cmjffnu3c0000it5akoioe0rz'], // Grup Support Ekspor Yuk
      allowedCourses: ['cmjfez54x0000itvavoi5lns0'] // KELAS BIMBINGAN EKSPOR YUK
    },
    'cmjauif3g0002it1h21ocqrf3': { // Lifetime
      name: 'Paket Ekspor Yuk - Lifetime',
      allowedGroups: ['cmjffnu3c0000it5akoioe0rz', 'cmjffnu8i0001it5a7jxt2n03'],
      allowedCourses: ['cmjfez54x0000itvavoi5lns0', 'cmjfezhnd004ditva3ku8njby']
    }
  };

  let totalFixed = 0;
  let totalGroupsRemoved = 0;
  let totalCoursesRemoved = 0;
  let totalGroupsAdded = 0;
  let totalCoursesAdded = 0;

  for (const [membershipId, mapping] of Object.entries(membershipMapping)) {
    console.log(`\n🔧 Processing: ${mapping.name}`);

    // Get ALL active users untuk membership ini (tidak limit)
    const userMemberships = await prisma.userMembership.findMany({
      where: { 
        membershipId,
        isActive: true,
        status: 'ACTIVE'
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    console.log(`👥 Processing ${userMemberships.length} users...`);

    for (const um of userMemberships) {
      const userId = um.user.id;
      let userFixed = false;

      // === FIX GROUPS ===
      
      // Get user's current groups
      const userGroups = await prisma.groupMember.findMany({
        where: { userId }
      });

      // Remove groups yang tidak seharusnya dimiliki
      for (const userGroup of userGroups) {
        if (!mapping.allowedGroups.includes(userGroup.groupId)) {
          console.log(`  ❌ Removing excess group from ${um.user.name}: ${userGroup.groupId}`);
          await prisma.groupMember.delete({
            where: { id: userGroup.id }
          });
          totalGroupsRemoved++;
          userFixed = true;
        }
      }

      // Add groups yang seharusnya dimiliki tapi belum ada
      const currentGroupIds = userGroups.map(g => g.groupId);
      for (const requiredGroupId of mapping.allowedGroups) {
        if (!currentGroupIds.includes(requiredGroupId)) {
          try {
            console.log(`  ✅ Adding required group to ${um.user.name}: ${requiredGroupId}`);
            await prisma.groupMember.create({
              data: {
                groupId: requiredGroupId,
                userId: userId,
                role: 'MEMBER',
                joinedAt: new Date()
              }
            });
            totalGroupsAdded++;
            userFixed = true;
          } catch (e) {
            if (e.code === 'P2002') {
              console.log(`  ℹ️ Group already exists for ${um.user.name}: ${requiredGroupId}`);
            } else {
              console.log(`  ⚠️ Error adding group: ${e.message}`);
            }
          }
        }
      }

      // === FIX COURSES ===
      
      // Get user's current courses
      const userCourses = await prisma.courseEnrollment.findMany({
        where: { userId }
      });

      // Remove courses yang tidak seharusnya dimiliki
      for (const userCourse of userCourses) {
        if (!mapping.allowedCourses.includes(userCourse.courseId)) {
          console.log(`  ❌ Removing excess course from ${um.user.name}: ${userCourse.courseId}`);
          await prisma.courseEnrollment.delete({
            where: { id: userCourse.id }
          });
          totalCoursesRemoved++;
          userFixed = true;
        }
      }

      // Add courses yang seharusnya dimiliki tapi belum ada
      const currentCourseIds = userCourses.map(c => c.courseId);
      for (const requiredCourseId of mapping.allowedCourses) {
        if (!currentCourseIds.includes(requiredCourseId)) {
          try {
            console.log(`  ✅ Adding required course to ${um.user.name}: ${requiredCourseId}`);
            await prisma.courseEnrollment.create({
              data: {
                courseId: requiredCourseId,
                userId: userId,
                progress: 0,
                completed: false
              }
            });
            totalCoursesAdded++;
            userFixed = true;
          } catch (e) {
            if (e.code === 'P2002') {
              console.log(`  ℹ️ Course already exists for ${um.user.name}: ${requiredCourseId}`);
            } else {
              console.log(`  ⚠️ Error adding course: ${e.message}`);
            }
          }
        }
      }

      if (userFixed) {
        totalFixed++;
      }
    }

    console.log(`✅ ${mapping.name}: Processed ${userMemberships.length} users`);
  }

  console.log('\n===========================================');
  console.log('📊 FINAL SUMMARY');
  console.log('===========================================');
  console.log(`Total users fixed: ${totalFixed}`);
  console.log(`Groups added: ${totalGroupsAdded}`);
  console.log(`Groups removed: ${totalGroupsRemoved}`);
  console.log(`Courses added: ${totalCoursesAdded}`);
  console.log(`Courses removed: ${totalCoursesRemoved}`);

  await prisma.$disconnect();
  console.log('\n🎉 Membership access fix complete!');
}

fixMembershipAccess().catch(console.error);