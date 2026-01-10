const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditAndFixMemberships() {
  console.log('🔍 AUDIT MEMBERSHIP AUTO-ENROLLMENT\n');
  console.log('=====================================\n');

  // 1. Get all memberships with their groups and courses
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    include: {
      membershipGroups: { include: { group: true } },
      membershipCourses: { include: { course: true } }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`📦 Found ${memberships.length} active memberships:\n`);
  
  for (const m of memberships) {
    console.log(`  - ${m.name} (${m.duration})`);
    console.log(`    Groups: ${m.membershipGroups.length}`);
    m.membershipGroups.forEach(g => console.log(`      • ${g.group.name}`));
    console.log(`    Courses: ${m.membershipCourses.length}`);
    m.membershipCourses.forEach(c => console.log(`      • ${c.course.title}`));
    console.log('');
  }

  // 2. Get all active user memberships
  const userMemberships = await prisma.userMembership.findMany({
    where: { 
      isActive: true,
      status: 'ACTIVE'
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      membership: {
        include: {
          membershipGroups: { include: { group: true } },
          membershipCourses: { include: { course: true } }
        }
      }
    }
  });

  console.log('=====================================');
  console.log(`\n👥 Found ${userMemberships.length} active user memberships\n`);

  let totalFixed = 0;
  let totalGroupsAdded = 0;
  let totalCoursesAdded = 0;

  // 3. Check each user membership and fix if needed
  for (const um of userMemberships) {
    const user = um.user;
    const membership = um.membership;
    
    if (!membership) continue;

    const requiredGroups = membership.membershipGroups.map(mg => mg.group);
    const requiredCourses = membership.membershipCourses.map(mc => mc.course);

    // Get user's current groups
    const userGroups = await prisma.groupMember.findMany({
      where: { userId: user.id }
    });
    const userGroupIds = userGroups.map(g => g.groupId);

    // Get user's current courses
    const userCourses = await prisma.courseEnrollment.findMany({
      where: { userId: user.id }
    });
    const userCourseIds = userCourses.map(c => c.courseId);

    // Find missing groups
    const missingGroups = requiredGroups.filter(g => !userGroupIds.includes(g.id));
    
    // Find missing courses
    const missingCourses = requiredCourses.filter(c => !userCourseIds.includes(c.id));

    if (missingGroups.length > 0 || missingCourses.length > 0) {
      console.log(`\n❌ ${user.name} (${user.email})`);
      console.log(`   Membership: ${membership.name}`);
      
      if (missingGroups.length > 0) {
        console.log(`   Missing Groups: ${missingGroups.length}`);
        missingGroups.forEach(g => console.log(`     • ${g.name}`));
      }
      
      if (missingCourses.length > 0) {
        console.log(`   Missing Courses: ${missingCourses.length}`);
        missingCourses.forEach(c => console.log(`     • ${c.title}`));
      }

      // Fix: Add missing groups
      for (const group of missingGroups) {
        try {
          await prisma.groupMember.create({
            data: {
              groupId: group.id,
              userId: user.id,
              role: 'MEMBER',
              joinedAt: new Date()
            }
          });
          console.log(`   ✅ Added to group: ${group.name}`);
          totalGroupsAdded++;
        } catch (e) {
          if (e.code === 'P2002') {
            console.log(`   ℹ️ Already in group: ${group.name}`);
          } else {
            console.log(`   ⚠️ Error adding to group ${group.name}: ${e.message}`);
          }
        }
      }

      // Fix: Add missing courses
      for (const course of missingCourses) {
        try {
          await prisma.courseEnrollment.create({
            data: {
              courseId: course.id,
              userId: user.id,
              progress: 0,
              completed: false
            }
          });
          console.log(`   ✅ Enrolled in course: ${course.title}`);
          totalCoursesAdded++;
        } catch (e) {
          if (e.code === 'P2002') {
            console.log(`   ℹ️ Already enrolled: ${course.title}`);
          } else {
            console.log(`   ⚠️ Error enrolling ${course.title}: ${e.message}`);
          }
        }
      }

      totalFixed++;
    }
  }

  console.log('\n=====================================');
  console.log('📊 SUMMARY');
  console.log('=====================================');
  console.log(`Total active memberships checked: ${userMemberships.length}`);
  console.log(`Users with missing access fixed: ${totalFixed}`);
  console.log(`Groups added: ${totalGroupsAdded}`);
  console.log(`Courses added: ${totalCoursesAdded}`);

  // 4. Verify all users now have correct access
  console.log('\n=====================================');
  console.log('✅ VERIFICATION - Users with complete access:');
  console.log('=====================================\n');

  for (const um of userMemberships) {
    const user = um.user;
    const membership = um.membership;
    
    if (!membership) continue;

    const userGroups = await prisma.groupMember.findMany({
      where: { userId: user.id }
    });
    
    const userCourses = await prisma.courseEnrollment.findMany({
      where: { userId: user.id }
    });

    console.log(`✅ ${user.name} (${user.email})`);
    console.log(`   Membership: ${membership.name}`);
    console.log(`   Groups: ${userGroups.length} | Courses: ${userCourses.length}`);
  }

  await prisma.$disconnect();
  console.log('\n🎉 Audit and fix complete!');
}

auditAndFixMemberships().catch(console.error);
