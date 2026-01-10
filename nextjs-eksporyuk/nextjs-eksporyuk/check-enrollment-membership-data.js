const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEnrollmentAndMembershipData() {
  console.log('🔍 CHECKING ENROLLMENT & MEMBERSHIP DATA');
  console.log('==========================================\n');
  
  try {
    // 1. Check for duplicate enrollments
    console.log('📊 1. DUPLICATE ENROLLMENT CHECK');
    console.log('--------------------------------');
    
    const duplicateEnrollments = await prisma.$queryRaw`
      SELECT "userId", "courseId", COUNT(*) as count
      FROM "CourseEnrollment" 
      GROUP BY "userId", "courseId" 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    if (duplicateEnrollments.length > 0) {
      console.log(`❌ Found ${duplicateEnrollments.length} duplicate enrollment combinations:`);
      duplicateEnrollments.slice(0, 10).forEach((dup, idx) => {
        console.log(`   ${idx + 1}. User: ${dup.userId}, Course: ${dup.courseId}, Count: ${dup.count}`);
      });
    } else {
      console.log('✅ No duplicate enrollments found');
    }
    
    // 2. Total enrollment stats
    console.log('\n📊 2. ENROLLMENT STATISTICS');
    console.log('---------------------------');
    
    const totalEnrollments = await prisma.courseEnrollment.count();
    const uniqueStudents = await prisma.courseEnrollment.groupBy({
      by: ['userId'],
    });
    const uniqueCourses = await prisma.courseEnrollment.groupBy({
      by: ['courseId'],
    });
    
    console.log(`Total Enrollments: ${totalEnrollments.toLocaleString()}`);
    console.log(`Unique Students: ${uniqueStudents.length.toLocaleString()}`);
    console.log(`Unique Courses: ${uniqueCourses.length.toLocaleString()}`);
    
    // 3. Member analysis: Active vs Premium
    console.log('\n👥 3. MEMBER ANALYSIS: ACTIVE vs PREMIUM');
    console.log('---------------------------------------');
    
    // Total users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });
    
    console.log('Users by Role:');
    usersByRole.forEach(role => {
      console.log(`   ${role.role}: ${role._count.toLocaleString()}`);
    });
    
    // Active memberships
    const activeMemberships = await prisma.userMembership.count({
      where: { status: 'ACTIVE' }
    });
    
    console.log(`\nActive Memberships: ${activeMemberships.toLocaleString()}`);
    
    // Premium users (role = MEMBER_PREMIUM)
    const premiumUsers = await prisma.user.count({
      where: { role: 'MEMBER_PREMIUM' }
    });
    
    console.log(`Premium Role Users: ${premiumUsers.toLocaleString()}`);
    
    // Users with active memberships but different roles
    console.log('\n🔍 4. ROLE vs MEMBERSHIP MISMATCH ANALYSIS');
    console.log('------------------------------------------');
    
    const usersWithActiveMemberships = await prisma.userMembership.findMany({
      where: { status: 'ACTIVE' },
      select: { 
        userId: true,
        membershipId: true
      }
    });
    
    // Get user roles for these users
    const userIds = [...new Set(usersWithActiveMemberships.map(um => um.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true }
    });
    
    const userRoleMap = {};
    users.forEach(user => {
      userRoleMap[user.id] = user.role;
    });
    
    const roleCounts = {};
    usersWithActiveMemberships.forEach(membership => {
      const role = userRoleMap[membership.userId];
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    console.log('Users with ACTIVE memberships by role:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count.toLocaleString()}`);
    });
    
    // 5. Membership types breakdown
    console.log('\n📦 5. MEMBERSHIP TYPES BREAKDOWN');
    console.log('--------------------------------');
    
    const membershipBreakdown = await prisma.userMembership.findMany({
      where: { status: 'ACTIVE' },
      select: {
        membershipId: true
      }
    });
    
    // Get membership details
    const membershipIds = [...new Set(membershipBreakdown.map(um => um.membershipId))];
    const memberships = await prisma.membership.findMany({
      where: { id: { in: membershipIds } },
      select: { id: true, name: true, duration: true }
    });
    
    const membershipMap = {};
    memberships.forEach(m => {
      membershipMap[m.id] = m;
    });
    
    const membershipTypes = {};
    membershipBreakdown.forEach(um => {
      const membership = membershipMap[um.membershipId];
      const type = membership ? membership.name : 'Unknown';
      membershipTypes[type] = (membershipTypes[type] || 0) + 1;
    });
    
    console.log('Active memberships by type:');
    Object.entries(membershipTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count.toLocaleString()}`);
    });
    
    // 6. Potential issues
    console.log('\n⚠️  6. POTENTIAL ISSUES');
    console.log('----------------------');
    
    // Users with active memberships but FREE role  
    const freeUsersWithMembershipQuery = await prisma.user.findMany({
      where: {
        role: 'MEMBER_FREE'
      },
      select: { id: true }
    });
    
    const freeUserIds = freeUsersWithMembershipQuery.map(u => u.id);
    const freeUsersWithActiveMemberships = await prisma.userMembership.count({
      where: {
        userId: { in: freeUserIds },
        status: 'ACTIVE'
      }
    });
    
    if (freeUsersWithActiveMemberships > 0) {
      console.log(`❌ ${freeUsersWithActiveMemberships} FREE users have active memberships (should be PREMIUM)`);
    } else {
      console.log('✅ No FREE users with active memberships');
    }
    
    // Premium users without active memberships
    const premiumUsersQuery = await prisma.user.findMany({
      where: {
        role: 'MEMBER_PREMIUM'
      },
      select: { id: true }
    });
    
    const premiumUserIds = premiumUsersQuery.map(u => u.id);
    const premiumUsersWithActiveMemberships = await prisma.userMembership.count({
      where: {
        userId: { in: premiumUserIds },
        status: 'ACTIVE'
      }
    });
    
    const premiumUsersWithoutMembership = premiumUserIds.length - premiumUsersWithActiveMemberships;
    
    if (premiumUsersWithoutMembership > 0) {
      console.log(`❌ ${premiumUsersWithoutMembership} PREMIUM users have no active memberships`);
    } else {
      console.log('✅ All PREMIUM users have active memberships');
    }
    
    console.log('\n✅ Analysis Complete');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnrollmentAndMembershipData();