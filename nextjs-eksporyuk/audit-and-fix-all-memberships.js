const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditAndFixMemberships() {
  console.log('🔍 AUDIT & FIX ALL USER MEMBERSHIPS\n');
  console.log('='.repeat(60));
  
  // 1. Get all active user memberships
  const activeUserMemberships = await prisma.userMembership.findMany({
    where: {
      isActive: true,
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      membership: {
        include: {
          membershipGroups: { include: { group: true } },
          membershipCourses: { include: { course: true } }
        }
      }
    }
  });
  
  console.log(`\n📦 Total Active Memberships: ${activeUserMemberships.length}\n`);
  
  const report = {
    totalUsers: 0,
    usersFixed: 0,
    groupsAdded: 0,
    coursesAdded: 0,
    details: []
  };
  
  // 2. Process each user membership
  for (const um of activeUserMemberships) {
    const userId = um.userId;
    const userName = um.user?.name || 'Unknown';
    const userEmail = um.user?.email || 'Unknown';
    const membershipName = um.membership?.name || 'Unknown';
    
    report.totalUsers++;
    
    const userReport = {
      user: `${userName} (${userEmail})`,
      membership: membershipName,
      groupsAdded: [],
      coursesAdded: [],
      alreadyHasGroups: [],
      alreadyHasCourses: []
    };
    
    // Get expected groups from membership
    const expectedGroups = um.membership?.membershipGroups || [];
    const expectedCourses = um.membership?.membershipCourses || [];
    
    // Get user's current groups
    const userGroups = await prisma.groupMember.findMany({
      where: { userId }
    });
    const userGroupIds = userGroups.map(g => g.groupId);
    
    // Get user's current course enrollments
    const userEnrollments = await prisma.courseEnrollment.findMany({
      where: { userId }
    });
    const userCourseIds = userEnrollments.map(e => e.courseId);
    
    let fixedSomething = false;
    
    // 3. Auto-join missing groups
    for (const mg of expectedGroups) {
      const groupId = mg.groupId;
      const groupName = mg.group?.name || 'Unknown Group';
      
      if (!userGroupIds.includes(groupId)) {
        // Add user to group
        try {
          await prisma.groupMember.create({
            data: {
              userId,
              groupId,
              role: 'MEMBER'
            }
          });
          userReport.groupsAdded.push(groupName);
          report.groupsAdded++;
          fixedSomething = true;
        } catch (err) {
          // Skip if already exists (unique constraint)
          if (!err.message.includes('Unique constraint')) {
            console.error(`  Error adding group ${groupName}:`, err.message);
          }
        }
      } else {
        userReport.alreadyHasGroups.push(groupName);
      }
    }
    
    // 4. Auto-enroll missing courses
    for (const mc of expectedCourses) {
      const courseId = mc.courseId;
      const courseTitle = mc.course?.title || 'Unknown Course';
      
      if (!userCourseIds.includes(courseId)) {
        // Enroll user to course
        try {
          await prisma.courseEnrollment.create({
            data: {
              userId,
              courseId,
              progress: 0,
              completed: false
            }
          });
          userReport.coursesAdded.push(courseTitle);
          report.coursesAdded++;
          fixedSomething = true;
        } catch (err) {
          // Skip if already exists (unique constraint)
          if (!err.message.includes('Unique constraint')) {
            console.error(`  Error enrolling course ${courseTitle}:`, err.message);
          }
        }
      } else {
        userReport.alreadyHasCourses.push(courseTitle);
      }
    }
    
    if (fixedSomething) {
      report.usersFixed++;
    }
    
    report.details.push(userReport);
  }
  
  // 5. Print Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUDIT REPORT');
  console.log('='.repeat(60));
  console.log(`\n✅ Total Users with Active Membership: ${report.totalUsers}`);
  console.log(`🔧 Users Fixed: ${report.usersFixed}`);
  console.log(`👥 Groups Added: ${report.groupsAdded}`);
  console.log(`📚 Courses Added: ${report.coursesAdded}`);
  
  console.log('\n' + '-'.repeat(60));
  console.log('DETAIL PER USER:');
  console.log('-'.repeat(60));
  
  for (const detail of report.details) {
    console.log(`\n👤 ${detail.user}`);
    console.log(`   📦 Membership: ${detail.membership}`);
    
    if (detail.groupsAdded.length > 0) {
      console.log(`   ✅ Groups Added: ${detail.groupsAdded.join(', ')}`);
    }
    if (detail.coursesAdded.length > 0) {
      console.log(`   ✅ Courses Added: ${detail.coursesAdded.join(', ')}`);
    }
    if (detail.alreadyHasGroups.length > 0) {
      console.log(`   ℹ️  Already in Groups: ${detail.alreadyHasGroups.join(', ')}`);
    }
    if (detail.alreadyHasCourses.length > 0) {
      console.log(`   ℹ️  Already Enrolled: ${detail.alreadyHasCourses.join(', ')}`);
    }
    
    if (detail.groupsAdded.length === 0 && detail.coursesAdded.length === 0) {
      console.log(`   ✓ No fix needed - already has all access`);
    }
  }
  
  await prisma.$disconnect();
  console.log('\n✅ Audit & Fix Complete!\n');
  
  return report;
}

auditAndFixMemberships().catch(console.error);
