/**
 * Audit membership-driven access:
 * - Course enrollments for Ekspor Yuk + Website Ekspor
 * - Group memberships for Support Ekspor Yuk + Website Ekspor
 * - Detect duplicates (same userId+target multiple rows)
 * - Detect unexpected users (not in expected membership sets)
 *
 * Safe: read-only.
 *
 * Usage:
 *   node scripts/audit-membership-access.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const eksporCourse = await prisma.course.findFirst({
    where: { slug: 'kelas-eksporyuk' },
    select: { id: true, title: true, slug: true },
  });
  const websiteCourse = await prisma.course.findFirst({
    where: { slug: 'kelas-website-ekspor' },
    select: { id: true, title: true, slug: true },
  });

  const supportGroup = await prisma.group.findFirst({
    where: { slug: 'support-ekspor-yuk' },
    select: { id: true, name: true, slug: true },
  });
  const websiteGroup = await prisma.group.findFirst({
    where: { slug: 'website-ekspor' },
    select: { id: true, name: true, slug: true },
  });

  if (!eksporCourse || !websiteCourse) throw new Error('Missing required courses (kelas-eksporyuk / kelas-website-ekspor)');
  if (!supportGroup || !websiteGroup) throw new Error('Missing required groups (support-ekspor-yuk / website-ekspor)');

  const memberships = await prisma.membership.findMany({
    select: { id: true, duration: true },
  });
  const membershipById = new Map(memberships.map((m) => [m.id, m]));

  const activeUserMemberships = await prisma.userMembership.findMany({
    where: {
      isActive: true,
      endDate: { gte: now },
    },
    select: { userId: true, membershipId: true },
  });

  const allMembers = new Set();
  const lifetimeMembers = new Set();
  for (const um of activeUserMemberships) {
    allMembers.add(um.userId);
    if (membershipById.get(um.membershipId)?.duration === 'LIFETIME') {
      lifetimeMembers.add(um.userId);
    }
  }

  console.log('🔎 AUDIT MEMBERSHIP ACCESS');
  console.log(`Active members: ${allMembers.size}`);
  console.log(`Lifetime members: ${lifetimeMembers.size}`);
  console.log(`Course Ekspor Yuk: ${eksporCourse.id} (${eksporCourse.title})`);
  console.log(`Course Website Ekspor: ${websiteCourse.id} (${websiteCourse.title})`);
  console.log(`Group Support: ${supportGroup.id} (${supportGroup.name})`);
  console.log(`Group Website: ${websiteGroup.id} (${websiteGroup.name})`);

  // ===== Courses =====
  const courseEnrollments = await prisma.courseEnrollment.findMany({
    where: { courseId: { in: [eksporCourse.id, websiteCourse.id] } },
    select: { id: true, userId: true, courseId: true, createdAt: true },
  });

  const byCourseKey = new Map();
  for (const e of courseEnrollments) {
    const key = `${e.userId}|${e.courseId}`;
    const list = byCourseKey.get(key) || [];
    list.push(e);
    byCourseKey.set(key, list);
  }

  let courseDuplicates = 0;
  for (const list of byCourseKey.values()) {
    if (list.length > 1) courseDuplicates += (list.length - 1);
  }

  const eksporEnrollmentUsers = new Set(courseEnrollments.filter(e => e.courseId === eksporCourse.id).map(e => e.userId));
  const websiteEnrollmentUsers = new Set(courseEnrollments.filter(e => e.courseId === websiteCourse.id).map(e => e.userId));

  const missingEkspor = [];
  for (const userId of allMembers) {
    if (!eksporEnrollmentUsers.has(userId)) missingEkspor.push(userId);
  }

  const missingWebsite = [];
  for (const userId of lifetimeMembers) {
    if (!websiteEnrollmentUsers.has(userId)) missingWebsite.push(userId);
  }

  const unexpectedEkspor = [];
  for (const userId of eksporEnrollmentUsers) {
    if (!allMembers.has(userId)) unexpectedEkspor.push(userId);
  }

  const unexpectedWebsite = [];
  for (const userId of websiteEnrollmentUsers) {
    if (!lifetimeMembers.has(userId)) unexpectedWebsite.push(userId);
  }

  console.log('\n🎓 Course Enrollments');
  console.log(`Total enroll rows (2 courses): ${courseEnrollments.length}`);
  console.log(`Duplicate enroll rows (extra rows beyond 1 per user/course): ${courseDuplicates}`);
  console.log(`Missing Ekspor Yuk enrollments: ${missingEkspor.length}`);
  console.log(`Missing Website Ekspor enrollments: ${missingWebsite.length}`);
  console.log(`Unexpected Ekspor Yuk enrollments (non-member): ${unexpectedEkspor.length}`);
  console.log(`Unexpected Website Ekspor enrollments (non-lifetime): ${unexpectedWebsite.length}`);

  // ===== Groups =====
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId: { in: [supportGroup.id, websiteGroup.id] } },
    select: { id: true, userId: true, groupId: true, joinedAt: true },
  });

  const byGroupKey = new Map();
  for (const gm of groupMembers) {
    const key = `${gm.userId}|${gm.groupId}`;
    const list = byGroupKey.get(key) || [];
    list.push(gm);
    byGroupKey.set(key, list);
  }

  let groupDuplicates = 0;
  for (const list of byGroupKey.values()) {
    if (list.length > 1) groupDuplicates += (list.length - 1);
  }

  const supportUsers = new Set(groupMembers.filter(g => g.groupId === supportGroup.id).map(g => g.userId));
  const websiteGroupUsers = new Set(groupMembers.filter(g => g.groupId === websiteGroup.id).map(g => g.userId));

  const missingSupport = [];
  for (const userId of allMembers) {
    if (!supportUsers.has(userId)) missingSupport.push(userId);
  }

  const missingWebsiteGroup = [];
  for (const userId of lifetimeMembers) {
    if (!websiteGroupUsers.has(userId)) missingWebsiteGroup.push(userId);
  }

  const unexpectedSupport = [];
  for (const userId of supportUsers) {
    if (!allMembers.has(userId)) unexpectedSupport.push(userId);
  }

  const unexpectedWebsiteGroup = [];
  for (const userId of websiteGroupUsers) {
    if (!lifetimeMembers.has(userId)) unexpectedWebsiteGroup.push(userId);
  }

  console.log('\n👥 Group Memberships');
  console.log(`Total group member rows (2 groups): ${groupMembers.length}`);
  console.log(`Duplicate group member rows (extra rows beyond 1 per user/group): ${groupDuplicates}`);
  console.log(`Missing Support group memberships: ${missingSupport.length}`);
  console.log(`Missing Website group memberships: ${missingWebsiteGroup.length}`);
  console.log(`Unexpected Support group memberships (non-member): ${unexpectedSupport.length}`);
  console.log(`Unexpected Website group memberships (non-lifetime): ${unexpectedWebsiteGroup.length}`);

  // Keep output compact; show samples if needed
  function sample(arr) {
    return arr.slice(0, 5);
  }

  if (courseDuplicates || groupDuplicates || missingEkspor.length || missingWebsite.length || missingSupport.length || missingWebsiteGroup.length || unexpectedEkspor.length || unexpectedWebsite.length || unexpectedSupport.length || unexpectedWebsiteGroup.length) {
    console.log('\nSamples (first 5 userIds each):');
    if (missingEkspor.length) console.log('missingEkspor:', sample(missingEkspor));
    if (missingWebsite.length) console.log('missingWebsite:', sample(missingWebsite));
    if (unexpectedEkspor.length) console.log('unexpectedEkspor:', sample(unexpectedEkspor));
    if (unexpectedWebsite.length) console.log('unexpectedWebsite:', sample(unexpectedWebsite));
    if (missingSupport.length) console.log('missingSupport:', sample(missingSupport));
    if (missingWebsiteGroup.length) console.log('missingWebsiteGroup:', sample(missingWebsiteGroup));
    if (unexpectedSupport.length) console.log('unexpectedSupport:', sample(unexpectedSupport));
    if (unexpectedWebsiteGroup.length) console.log('unexpectedWebsiteGroup:', sample(unexpectedWebsiteGroup));
  } else {
    console.log('\n✅ No mismatches or duplicates detected for required courses/groups.')
  }
}

main()
  .catch((e) => {
    console.error('❌ Audit error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
