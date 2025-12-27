/**
 * Audit membership, course enrollment, and group membership
 */

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('📊 AUDIT: Membership, Course Enrollment, Group Membership');
  console.log('='.repeat(70));
  
  // 1. Total counts
  const totalUsers = await p.user.count();
  const totalMemberships = await p.userMembership.count();
  const totalEnrollments = await p.courseEnrollment.count();
  const totalGroupMembers = await p.groupMember.count();
  
  console.log('\n📈 TOTAL COUNTS:');
  console.log('   Users:', totalUsers);
  console.log('   UserMemberships:', totalMemberships);
  console.log('   CourseEnrollments:', totalEnrollments);
  console.log('   GroupMembers:', totalGroupMembers);
  
  // 2. Membership breakdown
  const memByType = await p.userMembership.groupBy({
    by: ['membershipId'],
    _count: true
  });
  
  console.log('\n📊 MEMBERSHIP BREAKDOWN:');
  for (const m of memByType) {
    const mem = await p.membership.findUnique({ where: { id: m.membershipId }, select: { name: true } });
    console.log('   ', mem?.name || m.membershipId, ':', m._count);
  }
  
  // 3. Users with membership but NO course enrollments
  const usersWithMem = await p.userMembership.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true }
  });
  const userIdsWithMem = [...new Set(usersWithMem.map(u => u.userId))];
  
  const usersWithEnrollments = await p.courseEnrollment.findMany({
    where: { userId: { in: userIdsWithMem } },
    select: { userId: true }
  });
  const userIdsWithEnrollments = new Set(usersWithEnrollments.map(u => u.userId));
  
  const usersWithMemNoEnrollment = userIdsWithMem.filter(id => !userIdsWithEnrollments.has(id));
  
  console.log('\n⚠️  POTENTIAL ISSUES:');
  console.log('   Users with ACTIVE membership but NO course enrollment:', usersWithMemNoEnrollment.length);
  
  // 4. Users with membership but NO group membership
  const usersWithGroups = await p.groupMember.findMany({
    where: { userId: { in: userIdsWithMem } },
    select: { userId: true }
  });
  const userIdsWithGroups = new Set(usersWithGroups.map(u => u.userId));
  
  const usersWithMemNoGroup = userIdsWithMem.filter(id => !userIdsWithGroups.has(id));
  console.log('   Users with ACTIVE membership but NO group membership:', usersWithMemNoGroup.length);
  
  // 5. Check MembershipCourse and MembershipGroup links
  const memCourses = await p.membershipCourse.findMany();
  const memGroups = await p.membershipGroup.findMany();
  
  console.log('\n🔗 MEMBERSHIP LINKS:');
  console.log('   MembershipCourse links:', memCourses.length);
  console.log('   MembershipGroup links:', memGroups.length);
  
  // Group by membership
  const coursesByMem = {};
  const groupsByMem = {};
  
  for (const mc of memCourses) {
    if (!coursesByMem[mc.membershipId]) coursesByMem[mc.membershipId] = [];
    coursesByMem[mc.membershipId].push(mc.courseId);
  }
  
  for (const mg of memGroups) {
    if (!groupsByMem[mg.membershipId]) groupsByMem[mg.membershipId] = [];
    groupsByMem[mg.membershipId].push(mg.groupId);
  }
  
  console.log('\n📋 MEMBERSHIP → COURSES/GROUPS:');
  const allMems = await p.membership.findMany({ select: { id: true, name: true } });
  for (const mem of allMems) {
    const courses = coursesByMem[mem.id] || [];
    const groups = groupsByMem[mem.id] || [];
    console.log('   ', mem.name);
    console.log('      Courses:', courses.length > 0 ? courses.length : '❌ NONE');
    console.log('      Groups:', groups.length > 0 ? groups.length : '❌ NONE');
  }
  
  // 6. Get course and group names for lifetime
  console.log('\n📚 LIFETIME MEMBERSHIP DETAILS:');
  const lifetimeCourses = coursesByMem['mem_lifetime_ekspor'] || [];
  const lifetimeGroups = groupsByMem['mem_lifetime_ekspor'] || [];
  
  if (lifetimeCourses.length > 0) {
    const courses = await p.course.findMany({
      where: { id: { in: lifetimeCourses } },
      select: { id: true, title: true }
    });
    console.log('   Courses:');
    courses.forEach(c => console.log('      -', c.title));
  } else {
    console.log('   Courses: ❌ NONE LINKED');
  }
  
  if (lifetimeGroups.length > 0) {
    const groups = await p.group.findMany({
      where: { id: { in: lifetimeGroups } },
      select: { id: true, name: true }
    });
    console.log('   Groups:');
    groups.forEach(g => console.log('      -', g.name));
  } else {
    console.log('   Groups: ❌ NONE LINKED');
  }
  
  await p.$disconnect();
}

main().catch(console.error);
