/**
 * Auto-join users into required groups based on active memberships.
 *
 * Rules:
 * - All active members -> join "Support Ekspor Yuk" (slug: support-ekspor-yuk)
 * - Lifetime members     -> also join "Website Ekspor" (slug: website-ekspor)
 *
 * This script also creates the groups if they don't exist yet.
 * Safe by default: dry-run unless you pass --apply
 *
 * Usage:
 *   node scripts/auto-join-membership-groups.js          # dry-run
 *   node scripts/auto-join-membership-groups.js --apply  # write changes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function makeGroupMemberId(userId, groupId) {
  return `groupmember_${groupId}_${userId}`;
}

async function ensureGroup({ slug, name, description, type, requireApproval, ownerId, now }, apply) {
  const existing = await prisma.group.findFirst({ where: { slug }, select: { id: true, slug: true, name: true } });
  if (existing) return { group: existing, created: false };

  if (!apply) {
    return { group: { id: `group_${slug}`, slug, name }, created: true };
  }

  const created = await prisma.group.create({
    data: {
      id: `group_${slug}`,
      slug,
      name,
      description,
      type,
      ownerId,
      isActive: true,
      requireApproval,
      allowRichText: true,
      allowMedia: true,
      allowPolls: true,
      updatedAt: now,
    },
    select: { id: true, slug: true, name: true },
  });

  return { group: created, created: true };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const now = new Date();

  console.log('👥 AUTO JOIN (membership -> groups)');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true, email: true } });
  if (!adminUser) throw new Error('No ADMIN user found (needed as group owner).');

  const memberships = await prisma.membership.findMany({ select: { id: true, duration: true } });
  const membershipById = new Map(memberships.map((m) => [m.id, m]));

  const activeUserMemberships = await prisma.userMembership.findMany({
    where: { isActive: true, endDate: { gte: now } },
    select: { userId: true, membershipId: true },
  });

  const allMemberUserIds = new Set();
  const lifetimeUserIds = new Set();

  for (const um of activeUserMemberships) {
    allMemberUserIds.add(um.userId);
    const membership = membershipById.get(um.membershipId);
    if (membership?.duration === 'LIFETIME') lifetimeUserIds.add(um.userId);
  }

  const allMembers = Array.from(allMemberUserIds);
  const lifetimeMembers = Array.from(lifetimeUserIds);

  console.log(`All active members: ${allMembers.length}`);
  console.log(`Lifetime members: ${lifetimeMembers.length}`);
  console.log(`Owner: ${adminUser.email}`);

  const support = await ensureGroup(
    {
      slug: 'support-ekspor-yuk',
      name: 'Support Ekspor Yuk',
      description: 'Grup support untuk semua member Ekspor Yuk. Tanya jawab, diskusi, dan bantuan seputar ekspor.',
      type: 'PUBLIC',
      requireApproval: false,
      ownerId: adminUser.id,
      now,
    },
    apply
  );

  const website = await ensureGroup(
    {
      slug: 'website-ekspor',
      name: 'Website Ekspor',
      description: 'Komunitas khusus untuk pembahasan website ekspor, digital marketing, dan online presence untuk eksportir.',
      type: 'PRIVATE',
      requireApproval: true,
      ownerId: adminUser.id,
      now,
    },
    apply
  );

  console.log(`Group (Support): ${support.group.id} (${support.group.slug})${support.created ? ' [create]' : ''}`);
  console.log(`Group (Website): ${website.group.id} (${website.group.slug})${website.created ? ' [create]' : ''}`);

  const supportGroup = support.created && !apply ? null : await prisma.group.findFirst({ where: { slug: 'support-ekspor-yuk' }, select: { id: true } });
  const websiteGroup = website.created && !apply ? null : await prisma.group.findFirst({ where: { slug: 'website-ekspor' }, select: { id: true } });
  const supportGroupId = supportGroup?.id ?? support.group.id;
  const websiteGroupId = websiteGroup?.id ?? website.group.id;

  const targets = [];
  for (const userId of allMembers) targets.push({ userId, groupId: supportGroupId });
  for (const userId of lifetimeMembers) targets.push({ userId, groupId: websiteGroupId });

  if (!apply && (!supportGroup || !websiteGroup)) {
    console.log(`Would create group memberships (no existing-check): ${targets.length}`);
    console.log('Dry-run complete (no writes).');
    return;
  }

  if (!supportGroup || !websiteGroup) throw new Error('Group creation failed unexpectedly.');

  const existing = new Set();
  const userChunks = chunkArray(
    Array.from(new Set(targets.map((t) => t.userId))),
    1000
  );

  for (const userIdChunk of userChunks) {
    const rows = await prisma.groupMember.findMany({
      where: {
        userId: { in: userIdChunk },
        groupId: { in: [supportGroup.id, websiteGroup.id] },
      },
      select: { userId: true, groupId: true },
    });

    for (const r of rows) existing.add(`${r.userId}|${r.groupId}`);
  }

  const toCreate = [];
  for (const t of targets) {
    const key = `${t.userId}|${t.groupId}`;
    if (existing.has(key)) continue;
    toCreate.push({
      id: makeGroupMemberId(t.userId, t.groupId),
      userId: t.userId,
      groupId: t.groupId,
      role: 'MEMBER',
      joinedAt: now,
    });
  }

  console.log(`Missing group memberships to create: ${toCreate.length}`);

  if (!apply) {
    console.log('Dry-run complete (no writes).');
    return;
  }

  let created = 0;
  for (const batch of chunkArray(toCreate, 500)) {
    const res = await prisma.groupMember.createMany({ data: batch });
    created += res.count;
  }

  console.log(`✅ Created group memberships: ${created}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
