const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySystemIntegrity() {
  console.log('🔍 COMPREHENSIVE SYSTEM VERIFICATION STARTED');
  console.log('='.repeat(60));
  
  let totalErrors = 0;
  let totalUsers = 0;
  
  try {
    // Get all membership packages
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      include: {
        membershipGroups: {
          include: { group: true }
        },
        membershipCourses: {
          include: { course: true }
        }
      }
    });
    
    console.log('\n📦 MEMBERSHIP PACKAGES:');
    memberships.forEach(membership => {
      const groupCount = membership.membershipGroups.length;
      const courseCount = membership.membershipCourses.length;
      console.log(`  • ${membership.name}: ${groupCount} groups, ${courseCount} courses`);
    });
    
    // Get all users with active memberships
    const usersWithMemberships = await prisma.user.findMany({
      where: {
        userMemberships: {
          some: {
            isActive: true,
            membership: { isActive: true }
          }
        }
      },
      include: {
        userMemberships: {
          where: {
            isActive: true,
            membership: { isActive: true }
          },
          include: {
            membership: {
              include: {
                membershipGroups: {
                  include: { group: true }
                },
                membershipCourses: {
                  include: { course: true }
                }
              }
            }
          }
        }
      }
    });
    
    console.log(`\n👥 TOTAL USERS WITH ACTIVE MEMBERSHIPS: ${usersWithMemberships.length}`);
    console.log('\n🔍 DETAILED VERIFICATION:');
    console.log('='.repeat(60));
    
    // Get all group members and course enrollments separately
    const allGroupMembers = await prisma.groupMember.findMany();
    const allCourseEnrollments = await prisma.courseEnrollment.findMany();
    const allGroups = await prisma.group.findMany();
    const allCourses = await prisma.course.findMany();
    
    // Create maps for faster lookup
    const userGroupsMap = new Map();
    const userCoursesMap = new Map();
    const groupsById = new Map();
    const coursesById = new Map();
    
    // Build group and course maps
    allGroups.forEach(g => groupsById.set(g.id, g));
    allCourses.forEach(c => coursesById.set(c.id, c));
    
    // Build user access maps
    allGroupMembers.forEach(gm => {
      if (!userGroupsMap.has(gm.userId)) {
        userGroupsMap.set(gm.userId, []);
      }
      const group = groupsById.get(gm.groupId);
      if (group) {
        userGroupsMap.get(gm.userId).push(group);
      }
    });
    
    allCourseEnrollments.forEach(ce => {
      if (!userCoursesMap.has(ce.userId)) {
        userCoursesMap.set(ce.userId, []);
      }
      const course = coursesById.get(ce.courseId);
      if (course) {
        userCoursesMap.get(ce.userId).push(course);
      }
    });
    
    // Verify each user's access
    for (const user of usersWithMemberships) {
      totalUsers++;
      let userErrors = [];
      
      const userGroups = userGroupsMap.get(user.id) || [];
      const userCourses = userCoursesMap.get(user.id) || [];
      const userGroupIds = userGroups.map(g => g.id);
      const userCourseIds = userCourses.map(c => c.id);
      
      for (const userMembership of user.userMemberships) {
        const membership = userMembership.membership;
        const requiredGroups = membership.membershipGroups.map(mg => mg.group);
        const requiredCourses = membership.membershipCourses.map(mc => mc.course);
        
        // Check for missing required groups
        for (const requiredGroup of requiredGroups) {
          if (!userGroupIds.includes(requiredGroup.id)) {
            userErrors.push(`Missing GROUP: ${requiredGroup.name} (${requiredGroup.id})`);
          }
        }
        
        // Check for missing required courses
        for (const requiredCourse of requiredCourses) {
          if (!userCourseIds.includes(requiredCourse.id)) {
            userErrors.push(`Missing COURSE: ${requiredCourse.title} (${requiredCourse.id})`);
          }
        }
        
        // Check for excess access (users shouldn't have more than their membership allows)
        const allRequiredGroupIds = memberships.flatMap(m => m.membershipGroups.map(mg => mg.groupId));
        const allRequiredCourseIds = memberships.flatMap(m => m.membershipCourses.map(mc => mc.courseId));
        
        for (const userGroup of userGroups) {
          if (allRequiredGroupIds.includes(userGroup.id)) {
            // Check if this group is allowed for this user's membership
            const hasAccess = membership.membershipGroups.some(mg => mg.groupId === userGroup.id);
            if (!hasAccess) {
              userErrors.push(`EXCESS GROUP: ${userGroup.name} (${userGroup.id}) - not allowed for ${membership.name}`);
            }
          }
        }
        
        for (const userCourse of userCourses) {
          if (allRequiredCourseIds.includes(userCourse.id)) {
            // Check if this course is allowed for this user's membership
            const hasAccess = membership.membershipCourses.some(mc => mc.courseId === userCourse.id);
            if (!hasAccess) {
              userErrors.push(`EXCESS COURSE: ${userCourse.title} (${userCourse.id}) - not allowed for ${membership.name}`);
            }
          }
        }
      }
      
      if (userErrors.length > 0) {
        totalErrors += userErrors.length;
        console.log(`\n❌ USER: ${user.name} (${user.email})`);
        const userMembershipTitles = user.userMemberships.map(um => um.membership.name).join(', ');
        console.log(`   Membership: ${userMembershipTitles}`);
        console.log(`   Groups: ${userGroups.length}, Courses: ${userCourses.length}`);
        
        userErrors.forEach(error => {
          console.log(`   ❌ ${error}`);
        });
      } else {
        // Optional: show success cases for first 10 users
        if (totalUsers <= 10) {
          console.log(`✅ ${user.name}: ${user.userMemberships[0]?.membership.name} - Access OK`);
        }
      }
      
      // Show progress every 100 users
      if (totalUsers % 100 === 0) {
        console.log(`\n📊 Progress: ${totalUsers} users checked, ${totalErrors} errors found so far`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL VERIFICATION REPORT');
    console.log('='.repeat(60));
    
    if (totalErrors === 0) {
      console.log('🎉 SYSTEM PERFECT!');
      console.log(`✅ All ${totalUsers} users have correct access`);
      console.log('✅ No missing groups or courses found');
      console.log('✅ No excess access found');
      console.log('✅ System integrity: 100%');
    } else {
      console.log('⚠️  ISSUES FOUND:');
      console.log(`❌ Total errors: ${totalErrors}`);
      console.log(`👥 Users checked: ${totalUsers}`);
      console.log(`🔧 System integrity: ${((totalUsers - (totalErrors / 2)) / totalUsers * 100).toFixed(1)}%`);
      console.log('\n❗ Manual intervention may be required');
    }
    
    // Summary by membership type
    console.log('\n📋 MEMBERSHIP DISTRIBUTION:');
    const membershipCounts = {};
    for (const user of usersWithMemberships) {
      for (const userMembership of user.userMemberships) {
        const name = userMembership.membership.name;
        membershipCounts[name] = (membershipCounts[name] || 0) + 1;
      }
    }
    
    Object.entries(membershipCounts).forEach(([name, count]) => {
      console.log(`  • ${name}: ${count} users`);
    });
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySystemIntegrity();