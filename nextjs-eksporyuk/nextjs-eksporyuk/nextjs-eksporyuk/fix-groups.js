const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIX GROUP MEMBERS ===\n');
  
  const groups = await prisma.group.findMany({ select: { id: true, name: true } });
  console.log('Groups:', groups.map(g => g.name).join(', '));
  
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true }
  });
  console.log('Premium users:', premiumUsers.length);
  
  const existingMembers = await prisma.groupMember.findMany({ select: { userId: true, groupId: true } });
  const memberSet = new Set(existingMembers.map(m => m.userId + '-' + m.groupId));
  console.log('Existing group members:', existingMembers.length);
  
  const memberBatch = [];
  for (const user of premiumUsers) {
    for (const group of groups) {
      const key = user.id + '-' + group.id;
      if (!memberSet.has(key)) {
        memberBatch.push({
          id: 'gm_' + nanoid(),
          userId: user.id,
          groupId: group.id,
          role: 'MEMBER'
        });
      }
    }
  }
  
  console.log('To create:', memberBatch.length, 'group members');
  
  if (memberBatch.length > 0) {
    console.log('Creating group members...');
    await prisma.groupMember.createMany({ data: memberBatch, skipDuplicates: true });
    console.log('Done!');
  }
  
  const totalMembers = await prisma.groupMember.count();
  console.log('Total group members now:', totalMembers);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
