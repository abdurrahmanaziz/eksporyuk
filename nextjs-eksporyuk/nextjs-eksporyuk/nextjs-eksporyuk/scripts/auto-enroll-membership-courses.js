/**
 * Auto-enroll users into required courses based on active memberships.
 *
 * Rules:
 * - All active members -> enroll into "KELAS BIMBINGAN EKSPOR YUK" (slug: kelas-eksporyuk)
 * - Lifetime members     -> also enroll into "KELAS WEBSITE EKSPOR" (slug: kelas-website-ekspor)
 *
 * Safe by default: dry-run unless you pass --apply
 *
 * Usage:
 *   node scripts/auto-enroll-membership-courses.js          # dry-run
 *   node scripts/auto-enroll-membership-courses.js --apply  # write changes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function makeEnrollmentId(userId, courseId) {
  return `enroll_${courseId}_${userId}`;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const now = new Date();

  const eksporYukCourse = await prisma.course.findFirst({
    where: { slug: 'kelas-eksporyuk' },
    select: { id: true, title: true, slug: true },
  });

  const websiteEksporCourse = await prisma.course.findFirst({
    where: { slug: 'kelas-website-ekspor' },
    select: { id: true, title: true, slug: true },
  });

  if (!eksporYukCourse) {
    throw new Error('Course not found: slug=kelas-eksporyuk');
  }
  if (!websiteEksporCourse) {
    throw new Error('Course not found: slug=kelas-website-ekspor');
  }

  const memberships = await prisma.membership.findMany({
    select: { id: true, duration: true, name: true, slug: true },
  });
  const membershipById = new Map(memberships.map((m) => [m.id, m]));

  const activeUserMemberships = await prisma.userMembership.findMany({
    where: {
      isActive: true,
      endDate: { gte: now },
    },
    select: { userId: true, membershipId: true },
  });

  const allMemberUserIds = new Set();
  const lifetimeUserIds = new Set();

  for (const um of activeUserMemberships) {
    allMemberUserIds.add(um.userId);
    const membership = membershipById.get(um.membershipId);
    if (membership?.duration === 'LIFETIME') {
      lifetimeUserIds.add(um.userId);
    }
  }

  const allMembers = Array.from(allMemberUserIds);
  const lifetimeMembers = Array.from(lifetimeUserIds);

  console.log('🎓 AUTO ENROLL (membership -> courses)');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`All active members: ${allMembers.length}`);
  console.log(`Lifetime members: ${lifetimeMembers.length}`);
  console.log(`Course (Ekspor Yuk): ${eksporYukCourse.id} (${eksporYukCourse.title})`);
  console.log(`Course (Website Ekspor): ${websiteEksporCourse.id} (${websiteEksporCourse.title})`);

  const targets = [];
  for (const userId of allMembers) {
    targets.push({ userId, courseId: eksporYukCourse.id });
  }
  for (const userId of lifetimeMembers) {
    targets.push({ userId, courseId: websiteEksporCourse.id });
  }

  const existing = new Set();
  const userChunks = chunkArray(
    Array.from(new Set(targets.map((t) => t.userId))),
    1000
  );

  for (const userIdChunk of userChunks) {
    const rows = await prisma.courseEnrollment.findMany({
      where: {
        userId: { in: userIdChunk },
        courseId: { in: [eksporYukCourse.id, websiteEksporCourse.id] },
      },
      select: { userId: true, courseId: true },
    });

    for (const r of rows) {
      existing.add(`${r.userId}|${r.courseId}`);
    }
  }

  const toCreate = [];
  for (const t of targets) {
    const key = `${t.userId}|${t.courseId}`;
    if (existing.has(key)) continue;
    toCreate.push({
      id: makeEnrollmentId(t.userId, t.courseId),
      userId: t.userId,
      courseId: t.courseId,
      progress: 0,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`Missing enrollments to create: ${toCreate.length}`);

  if (!apply) {
    console.log('Dry-run complete (no writes).');
    return;
  }

  let created = 0;
  for (const batch of chunkArray(toCreate, 500)) {
    const res = await prisma.courseEnrollment.createMany({ data: batch });
    created += res.count;
  }

  console.log(`✅ Created enrollments: ${created}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
