const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMembershipSystem() {
  console.log('🔍 AUDIT SISTEM MEMBERSHIP\n');
  console.log('═'.repeat(60));

  // 1. Check Memberships
  const memberships = await prisma.membership.findMany({
    include: {
      membershipGroups: { include: { group: true } },
      membershipCourses: { include: { course: true } },
      _count: { select: { userMemberships: true } }
    }
  });

  console.log('\n📦 MEMBERSHIP PLANS:');
  console.log('─'.repeat(60));
  for (const m of memberships) {
    console.log(`\n${m.name} (${m.slug || 'no-slug'})`);
    console.log(`   - Status: ${m.status} | Active: ${m.isActive}`);
    console.log(`   - Users: ${m._count.userMemberships}`);
    console.log(`   - Groups: ${m.membershipGroups.length}`);
    m.membershipGroups.forEach(mg => console.log(`      • ${mg.group.name}`));
    console.log(`   - Courses: ${m.membershipCourses.length}`);
    m.membershipCourses.forEach(mc => console.log(`      • ${mc.course.title}`));
  }

  // 2. Check UserMemberships
  const userMemberships = await prisma.userMembership.groupBy({
    by: ['status'],
    _count: true
  });

  console.log('\n\n📊 USER MEMBERSHIPS BY STATUS:');
  console.log('─'.repeat(60));
  userMemberships.forEach(um => {
    console.log(`   ${um.status}: ${um._count}`);
  });

  const totalUserMemberships = await prisma.userMembership.count();
  console.log(`   TOTAL: ${totalUserMemberships}`);

  // 3. Check Groups
  const groups = await prisma.group.findMany({
    include: {
      _count: { select: { members: true } },
      membershipGroups: true
    }
  });

  console.log('\n\n👥 GROUPS:');
  console.log('─'.repeat(60));
  for (const g of groups) {
    const linkedMemberships = g.membershipGroups.length;
    console.log(`   ${g.name}: ${g._count.members} members | Linked to ${linkedMemberships} membership(s)`);
  }

  // 4. Check GroupMembers
  const totalGroupMembers = await prisma.groupMember.count();
  console.log(`\n   TOTAL GROUP MEMBERS: ${totalGroupMembers}`);

  // 5. Check Courses
  const courses = await prisma.course.findMany({
    include: {
      _count: { select: { enrollments: true } },
      membershipCourses: true
    }
  });

  console.log('\n\n📚 COURSES:');
  console.log('─'.repeat(60));
  for (const c of courses) {
    const linkedMemberships = c.membershipCourses.length;
    console.log(`   ${c.title.substring(0, 40)}: ${c._count.enrollments} enrolled | Linked to ${linkedMemberships} membership(s)`);
  }

  // 6. Check CourseEnrollments
  const totalEnrollments = await prisma.courseEnrollment.count();
  console.log(`\n   TOTAL ENROLLMENTS: ${totalEnrollments}`);

  // 7. Check GAP: Users with membership but NOT in groups
  console.log('\n\n⚠️ GAP ANALYSIS:');
  console.log('─'.repeat(60));

  // Get users with active memberships
  const usersWithMembership = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: true,
      membership: {
        include: {
          membershipGroups: true,
          membershipCourses: true
        }
      }
    }
  });

  let notInGroup = 0;
  let notEnrolled = 0;

  for (const um of usersWithMembership) {
    // Check if user is in all required groups
    for (const mg of um.membership.membershipGroups) {
      const isMember = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: mg.groupId, userId: um.userId } }
      });
      if (!isMember) notInGroup++;
    }

    // Check if user is enrolled in all required courses
    for (const mc of um.membership.membershipCourses) {
      const isEnrolled = await prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId: um.userId, courseId: mc.courseId } }
      });
      if (!isEnrolled) notEnrolled++;
    }
  }

  console.log(`   Users with ACTIVE membership: ${usersWithMembership.length}`);
  console.log(`   Missing group memberships: ${notInGroup}`);
  console.log(`   Missing course enrollments: ${notEnrolled}`);

  console.log('\n═'.repeat(60));
  console.log('✅ AUDIT COMPLETE\n');

  await prisma.$disconnect();
}

checkMembershipSystem();
