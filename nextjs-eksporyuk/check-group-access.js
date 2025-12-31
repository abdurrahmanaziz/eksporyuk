const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // 1. Cek grup yang ada
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      type: true
    }
  });
  
  console.log('=== GROUPS ===');
  for (const g of groups) {
    const memberCount = await prisma.groupMember.count({ where: { groupId: g.id }});
    console.log('📁 ' + g.name + ' (' + g.type + ') - ' + memberCount + ' members');
  }
  
  // 2. Cek membership dengan groups (MembershipGroup table)
  const membershipGroups = await prisma.membershipGroup.findMany({
    select: {
      membershipId: true,
      groupId: true
    }
  });
  
  console.log('\n=== MEMBERSHIP-GROUP RELATIONS ===');
  console.log('Total relations: ' + membershipGroups.length);
  
  for (const mg of membershipGroups) {
    const m = await prisma.membership.findUnique({ where: { id: mg.membershipId }, select: { name: true }});
    const g = await prisma.group.findUnique({ where: { id: mg.groupId }, select: { name: true }});
    console.log('🎫 ' + (m ? m.name : 'unknown') + ' → 📁 ' + (g ? g.name : 'unknown'));
  }
  
  // 3. Cek GroupMember untuk sample member premium
  console.log('\n=== GROUP MEMBERSHIP FOR PREMIUM MEMBERS ===');
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true, name: true, email: true },
    take: 5
  });
  
  for (const u of premiumUsers) {
    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId: u.id },
      select: { groupId: true, role: true }
    });
    
    console.log('\n👤 ' + u.name + ' (' + u.email + ')');
    if (groupMemberships.length === 0) {
      console.log('   ⚠️ TIDAK ADA AKSES GROUP!');
    } else {
      for (const gm of groupMemberships) {
        const g = await prisma.group.findUnique({ where: { id: gm.groupId }, select: { name: true }});
        console.log('   ✅ ' + (g ? g.name : 'unknown') + ' (role: ' + gm.role + ')');
      }
    }
  }
  
  // 4. Cek apakah ada flow untuk auto-add to group
  console.log('\n=== CHECKING MEMBERSHIP ACTIVATION FLOW ===');
  
  // Cek semua membership
  const memberships = await prisma.membership.findMany({
    select: {
      id: true,
      name: true,
      slug: true
    }
  });
  
  console.log('Total memberships: ' + memberships.length);
  for (const m of memberships) {
    const groupLinks = await prisma.membershipGroup.findMany({
      where: { membershipId: m.id }
    });
    console.log('🎫 ' + m.name + ' (' + m.slug + ') → ' + groupLinks.length + ' groups linked');
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
