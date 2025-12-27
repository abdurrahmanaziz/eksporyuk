/**
 * COMPREHENSIVE ACCESS CONTROL VERIFICATION
 * 
 * Cek:
 * 1. Perbedaan MEMBER_FREE vs MEMBER_PREMIUM
 * 2. Akses ke Groups berdasarkan MembershipGroup
 * 3. Akses ke Courses berdasarkan MembershipCourse
 * 4. Akses ke Products berdasarkan MembershipProduct
 * 5. UserMembership status dan validity
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAccessControl() {
  console.log('🔐 COMPREHENSIVE ACCESS CONTROL VERIFICATION');
  console.log('═'.repeat(80));
  console.log('');

  try {
    // ============================================================
    // 1. CEK PERBEDAAN MEMBER_FREE vs MEMBER_PREMIUM
    // ============================================================
    console.log('1️⃣  MEMBER ROLES DISTRIBUTION\n');
    console.log('─'.repeat(80));
    
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });
    
    console.log('User Role Distribution:');
    roleDistribution.forEach(r => {
      console.log(`   ${r.role}: ${r._count} users`);
    });
    
    // Check active memberships
    const activeMemberships = await prisma.userMembership.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('\nUserMembership Status:');
    activeMemberships.forEach(m => {
      console.log(`   ${m.status}: ${m._count} records`);
    });
    
    // ============================================================
    // 2. CEK MEMBER_PREMIUM YANG TIDAK PUNYA MEMBERSHIP
    // ============================================================
    console.log('\n\n2️⃣  MEMBER_PREMIUM WITHOUT ACTIVE MEMBERSHIP (Potential Issues)\n');
    console.log('─'.repeat(80));
    
    const premiumUsers = await prisma.user.findMany({
      where: { role: 'MEMBER_PREMIUM' },
      select: { id: true, email: true, role: true }
    });
    
    let premiumWithoutMembership = 0;
    let premiumWithMembership = 0;
    const issues = [];
    
    for (const user of premiumUsers.slice(0, 100)) { // Sample 100
      const membership = await prisma.userMembership.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE'
        }
      });
      
      if (membership) {
        premiumWithMembership++;
      } else {
        premiumWithoutMembership++;
        if (issues.length < 10) {
          issues.push(user.email);
        }
      }
    }
    
    console.log(`Premium users checked (sample): 100`);
    console.log(`✅ With active membership: ${premiumWithMembership}`);
    console.log(`⚠️  Without membership: ${premiumWithoutMembership}`);
    
    if (issues.length > 0) {
      console.log('\nExamples (first 10):');
      issues.forEach(email => console.log(`   - ${email}`));
    }
    
    // ============================================================
    // 3. CEK MEMBER_FREE YANG PUNYA MEMBERSHIP (Shouldn't happen)
    // ============================================================
    console.log('\n\n3️⃣  MEMBER_FREE WITH ACTIVE MEMBERSHIP (Critical Issues)\n');
    console.log('─'.repeat(80));
    
    const freeUsers = await prisma.user.findMany({
      where: { role: 'MEMBER_FREE' },
      select: { id: true, email: true }
    });
    
    let freeWithMembership = 0;
    const criticalIssues = [];
    
    for (const user of freeUsers.slice(0, 100)) { // Sample 100
      const membership = await prisma.userMembership.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE'
        }
      });
      
      if (membership) {
        freeWithMembership++;
        if (criticalIssues.length < 10) {
          const membershipData = await prisma.membership.findUnique({
            where: { id: membership.membershipId }
          });
          criticalIssues.push({
            email: user.email,
            membership: membershipData?.duration
          });
        }
      }
    }
    
    console.log(`Free users checked (sample): 100`);
    console.log(`${freeWithMembership === 0 ? '✅' : '❌'} With active membership: ${freeWithMembership}`);
    
    if (criticalIssues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES FOUND:');
      criticalIssues.forEach(issue => {
        console.log(`   - ${issue.email} has ${issue.membership} membership!`);
      });
    }
    
    // ============================================================
    // 4. CEK MEMBERSHIP ASSIGNMENT (Groups, Courses, Products)
    // ============================================================
    console.log('\n\n4️⃣  MEMBERSHIP ACCESS CONFIGURATION\n');
    console.log('─'.repeat(80));
    
    // Get all memberships
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        duration: true
      }
    });
    
    console.log(`Total membership plans: ${memberships.length}\n`);
    
    for (const membership of memberships) {
      console.log(`\n📦 ${membership.name} (${membership.duration})`);
      console.log('─'.repeat(60));
      
      // Check assigned groups
      const membershipGroups = await prisma.membershipGroup.findMany({
        where: { membershipId: membership.id }
      });
      
      console.log(`   Groups: ${membershipGroups.length} assigned`);
      if (membershipGroups.length > 0 && membershipGroups.length <= 3) {
        for (const mg of membershipGroups) {
          const group = await prisma.group.findUnique({
            where: { id: mg.groupId },
            select: { name: true }
          });
          console.log(`      - ${group?.name || 'Unknown'}`);
        }
      }
      
      // Check assigned courses
      const membershipCourses = await prisma.membershipCourse.findMany({
        where: { membershipId: membership.id }
      });
      
      console.log(`   Courses: ${membershipCourses.length} assigned`);
      if (membershipCourses.length > 0 && membershipCourses.length <= 3) {
        for (const mc of membershipCourses) {
          const course = await prisma.course.findUnique({
            where: { id: mc.courseId },
            select: { title: true }
          });
          console.log(`      - ${course?.title || 'Unknown'}`);
        }
      }
      
      // Check assigned products
      const membershipProducts = await prisma.membershipProduct.findMany({
        where: { membershipId: membership.id }
      });
      
      console.log(`   Products: ${membershipProducts.length} assigned`);
    }
    
    // ============================================================
    // 5. CEK USER ENROLLMENT vs MEMBERSHIP
    // ============================================================
    console.log('\n\n5️⃣  USER ACCESS VERIFICATION (Sample)\n');
    console.log('─'.repeat(80));
    
    // Sample: Check 5 premium users
    const samplePremiumUsers = await prisma.user.findMany({
      where: { role: 'MEMBER_PREMIUM' },
      take: 5,
      select: { id: true, email: true }
    });
    
    for (const user of samplePremiumUsers) {
      console.log(`\n👤 ${user.email}`);
      
      // Get membership
      const userMembership = await prisma.userMembership.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE'
        }
      });
      
      if (!userMembership) {
        console.log('   ⚠️  No active membership!');
        continue;
      }
      
      const membershipData = await prisma.membership.findUnique({
        where: { id: userMembership.membershipId },
        select: { name: true, duration: true }
      });
      
      console.log(`   Membership: ${membershipData?.name} (${membershipData?.duration})`);
      console.log(`   Valid until: ${userMembership.endDate.toISOString().split('T')[0]}`);
      
      // Check what groups they SHOULD have access to
      const allowedGroups = await prisma.membershipGroup.findMany({
        where: { membershipId: userMembership.membershipId }
      });
      
      console.log(`   Should access ${allowedGroups.length} groups`);
      
      // Check actual group membership
      const actualGroupMembership = await prisma.groupMember.count({
        where: {
          userId: user.id
        }
      });
      
      console.log(`   Actually in ${actualGroupMembership} groups`);
      
      // Check course enrollments
      const enrollments = await prisma.courseEnrollment.count({
        where: {
          userId: user.id
        }
      });
      
      console.log(`   Enrolled in ${enrollments} courses`);
    }
    
    // ============================================================
    // 6. FINAL SUMMARY
    // ============================================================
    console.log('\n\n' + '═'.repeat(80));
    console.log('📊 FINAL SUMMARY\n');
    
    const totalUsers = await prisma.user.count();
    const totalFree = await prisma.user.count({ where: { role: 'MEMBER_FREE' } });
    const totalPremium = await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } });
    const totalActiveMemberships = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });
    
    console.log(`Total Users: ${totalUsers}`);
    console.log(`├─ MEMBER_FREE: ${totalFree}`);
    console.log(`└─ MEMBER_PREMIUM: ${totalPremium}`);
    console.log(`\nActive Memberships: ${totalActiveMemberships}`);
    
    // Calculate expected vs actual
    const expectedPremiumWithMembership = totalActiveMemberships;
    const deviation = Math.abs(totalPremium - expectedPremiumWithMembership);
    
    if (deviation > 100) {
      console.log(`\n⚠️  WARNING: ${deviation} users might have incorrect role/membership`);
      console.log(`   Expected: MEMBER_PREMIUM ≈ Active Memberships`);
      console.log(`   Actual: ${totalPremium} PREMIUM vs ${totalActiveMemberships} Memberships`);
    } else {
      console.log(`\n✅ Role-Membership alignment looks good (deviation: ${deviation})`);
    }
    
    // Check access control rules
    console.log('\n\n🔐 ACCESS CONTROL RULES:\n');
    console.log('1. MEMBER_FREE:');
    console.log('   ✓ Can browse public content');
    console.log('   ✓ Cannot access premium groups');
    console.log('   ✓ Cannot access premium courses');
    console.log('   ✓ Must buy membership to upgrade\n');
    
    console.log('2. MEMBER_PREMIUM:');
    console.log('   ✓ Must have active UserMembership record');
    console.log('   ✓ Access groups assigned to their membership');
    console.log('   ✓ Access courses assigned to their membership');
    console.log('   ✓ Access products assigned to their membership');
    console.log('   ✓ Membership expires → Role should revert to FREE\n');
    
    console.log('3. ADMIN/MENTOR/AFFILIATE:');
    console.log('   ✓ Can have special access without membership');
    console.log('   ✓ Not affected by membership expiry\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAccessControl();
