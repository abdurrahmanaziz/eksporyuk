const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const prisma = new PrismaClient();

const createId = () => randomBytes(16).toString('hex');

async function test() {
  const user = await prisma.user.findUnique({
    where: { email: 'abdurrahmanazizsultan@gmail.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User ID:', user.id);
  
  // Check membership
  const membership = await prisma.userMembership.findFirst({
    where: { userId: user.id, isActive: true }
  });
  
  if (!membership) {
    console.log('No active membership');
    return;
  }
  
  console.log('Membership ID:', membership.membershipId);
  
  // Check membershipGroup
  const mg = await prisma.membershipGroup.findMany({
    where: { membershipId: membership.membershipId }
  });
  
  console.log('MembershipGroups:', mg.length);
  mg.forEach(m => console.log('  Group ID:', m.groupId));
  
  // Try to add to group
  if (mg.length > 0) {
    const groupId = mg[0].groupId;
    
    // Check if already member using findFirst instead of findUnique
    const existing = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: user.id
      }
    });
    
    console.log('Existing group member:', existing);
    
    if (!existing) {
      try {
        const created = await prisma.groupMember.create({
          data: {
            id: createId(),
            groupId: groupId,
            userId: user.id,
            role: 'MEMBER'
          }
        });
        console.log('Created:', created);
      } catch (err) {
        console.log('Error creating:', err.message);
        console.log('Error code:', err.code);
      }
    }
  }
  
  // Verify
  const groups = await prisma.groupMember.findMany({
    where: { userId: user.id }
  });
  console.log('\nFinal groups:', groups.length);
  for (const g of groups) {
    const group = await prisma.group.findUnique({ where: { id: g.groupId }, select: { name: true }});
    console.log('  - ' + (group ? group.name : 'unknown'));
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
