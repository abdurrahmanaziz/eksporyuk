const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 CHECKING GROUP RECOMMENDATION SYSTEM\n');
    
    // Check GroupType enum values
    console.log('1️⃣ Checking GROUP TYPES:');
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        _count: { select: { members: true } }
      }
    });
    
    console.log('   Total groups in DB:', groups.length);
    groups.forEach(g => {
      console.log(`   • ${g.name} | Type: ${g.type} | Active: ${g.isActive} | Members: ${g._count.members}`);
    });
    
    // Check public groups
    const publicGroups = groups.filter(g => g.type === 'PUBLIC' && g.isActive);
    console.log(`\n2️⃣ PUBLIC GROUPS AVAILABLE: ${publicGroups.length}`);
    publicGroups.forEach(g => {
      console.log(`   ✓ ${g.name}`);
    });
    
    // Check private groups
    const privateGroups = groups.filter(g => g.type === 'PRIVATE' && g.isActive);
    console.log(`\n3️⃣ PRIVATE GROUPS (Hidden): ${privateGroups.length}`);
    privateGroups.forEach(g => {
      console.log(`   ✗ ${g.name} (not shown in recommendations)`);
    });
    
    // Check users
    console.log(`\n4️⃣ Checking USERS for membership:`);
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        role: true,
        _count: { select: { groupMembers: true } }
      },
      take: 3
    });
    
    users.forEach(u => {
      console.log(`   • ${u.name} (${u.role}) - Member of ${u._count.groupMembers} groups`);
    });
    
    // Test the logic for one user
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n5️⃣ Testing recommendation logic for: ${testUser.name}`);
      
      // Get user's groups
      const userGroupMembers = await prisma.groupMember.findMany({
        where: { userId: testUser.id },
        include: { group: true }
      });
      
      const userGroupIds = userGroupMembers.map(gm => gm.groupId);
      console.log(`   User's groups: ${userGroupIds.length}`);
      userGroupMembers.forEach(gm => {
        console.log(`   - ${gm.group.name} (${gm.group.type})`);
      });
      
      // Get public groups
      const publicGroupsForUser = await prisma.group.findMany({
        where: {
          isActive: true,
          type: 'PUBLIC'
        }
      });
      
      console.log(`\n   Public groups available: ${publicGroupsForUser.length}`);
      
      // Combine logic exactly as in API
      const userGroups = userGroupMembers.map(gm => gm.group).filter(g => g.isActive);
      const newPublicGroups = publicGroupsForUser.filter(g => !userGroupIds.includes(g.id));
      const allToShow = [...userGroups, ...newPublicGroups].slice(0, 5);
      
      console.log(`\n   📊 AKAN DITAMPILKAN DI DASHBOARD (max 5):`);
      allToShow.forEach((g, i) => {
        const isMember = userGroupIds.includes(g.id);
        console.log(`   ${i+1}. ${g.name} (${g.type}) - ${isMember ? '👤 USER GROUP' : '🔓 PUBLIC GROUP'}`);
      });
      
      console.log(`\n   Total akan ditampilkan: ${allToShow.length} groups`);
    }
    
    console.log(`\n✅ DATABASE & LOGIC CHECK COMPLETE`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();