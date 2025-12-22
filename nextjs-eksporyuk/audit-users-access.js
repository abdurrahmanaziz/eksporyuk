const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditUsersAccess() {
  console.log('🔍 AUDIT USERS ACCESS - MENCARI YANG BELUM SESUAI\n');
  console.log('=======================================================\n');

  // Mapping yang benar berdasarkan audit sebelumnya
  const membershipMapping = {
    'cmjauif2n0001it1h0q4kwjym': { // 12 Bulan
      name: 'Paket Ekspor Yuk - 12 Bulan',
      expectedGroups: 1,
      expectedCourses: 1,
      groupIds: ['cmjffnu3c0000it5akoioe0rz'],
      courseIds: ['cmjfez54x0000itvavoi5lns0']
    },
    'cmjauiev30000it1h0c0wndna': { // 6 Bulan  
      name: 'Paket Ekspor Yuk - 6 Bulan',
      expectedGroups: 1,
      expectedCourses: 1,
      groupIds: ['cmjffnu3c0000it5akoioe0rz'],
      courseIds: ['cmjfez54x0000itvavoi5lns0']
    },
    'cmjauif3g0002it1h21ocqrf3': { // Lifetime
      name: 'Paket Ekspor Yuk - Lifetime',
      expectedGroups: 2,
      expectedCourses: 2,
      groupIds: ['cmjffnu3c0000it5akoioe0rz', 'cmjffnu8i0001it5a7jxt2n03'],
      courseIds: ['cmjfez54x0000itvavoi5lns0', 'cmjfezhnd004ditva3ku8njby']
    }
  };

  let totalProblems = 0;
  let problemUsers = [];

  for (const [membershipId, mapping] of Object.entries(membershipMapping)) {
    console.log(`\n🔍 Checking: ${mapping.name}`);
    console.log(`Expected: ${mapping.expectedGroups} groups, ${mapping.expectedCourses} courses\n`);

    // Get all active users untuk membership ini
    const userMemberships = await prisma.userMembership.findMany({
      where: { 
        membershipId,
        isActive: true,
        status: 'ACTIVE'
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      take: 50 // Limit untuk test dulu
    });

    console.log(`📊 Checking ${userMemberships.length} users...`);

    let membershipProblems = 0;

    for (const um of userMemberships) {
      const userId = um.user.id;
      
      // Check user's current groups
      const userGroups = await prisma.groupMember.findMany({
        where: { userId }
      });
      const userGroupIds = userGroups.map(g => g.groupId);

      // Check user's current courses  
      const userCourses = await prisma.courseEnrollment.findMany({
        where: { userId }
      });
      const userCourseIds = userCourses.map(c => c.courseId);

      // Check jika ada yang missing
      const missingGroups = mapping.groupIds.filter(gid => !userGroupIds.includes(gid));
      const missingCourses = mapping.courseIds.filter(cid => !userCourseIds.includes(cid));

      // Check jika ada yang berlebihan (tidak seharusnya punya)
      const extraGroups = userGroupIds.filter(gid => !mapping.groupIds.includes(gid));
      const extraCourses = userCourseIds.filter(cid => !mapping.courseIds.includes(cid));

      if (missingGroups.length > 0 || missingCourses.length > 0 || extraGroups.length > 0 || extraCourses.length > 0) {
        membershipProblems++;
        totalProblems++;
        
        const problem = {
          membershipType: mapping.name,
          user: um.user,
          currentGroups: userGroups.length,
          currentCourses: userCourses.length,
          missingGroups,
          missingCourses,
          extraGroups,
          extraCourses
        };
        problemUsers.push(problem);

        console.log(`❌ ${um.user.name} (${um.user.email})`);
        console.log(`   Current: ${userGroups.length} groups, ${userCourses.length} courses`);
        if (missingGroups.length > 0) console.log(`   Missing groups: ${missingGroups.length}`);
        if (missingCourses.length > 0) console.log(`   Missing courses: ${missingCourses.length}`);
        if (extraGroups.length > 0) console.log(`   Extra groups: ${extraGroups.length}`);
        if (extraCourses.length > 0) console.log(`   Extra courses: ${extraCourses.length}`);
      }
    }

    console.log(`\n📊 ${mapping.name}: ${membershipProblems} users with problems out of ${userMemberships.length} checked`);
  }

  console.log('\n=======================================================');
  console.log('📊 SUMMARY');
  console.log('=======================================================');
  console.log(`Total users with access problems: ${totalProblems}`);
  console.log(`Problems found in sample check (limited to 50 users per membership)`);
  
  if (totalProblems > 0) {
    console.log('\n⚠️  NEED FIXING! Users tidak mendapat akses sesuai membership mereka.');
  } else {
    console.log('\n✅ All checked users have correct access!');
  }

  await prisma.$disconnect();
}

auditUsersAccess().catch(console.error);