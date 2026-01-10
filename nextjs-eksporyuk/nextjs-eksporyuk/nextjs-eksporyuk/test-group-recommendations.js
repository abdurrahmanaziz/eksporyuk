const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== GROUP RECOMMENDATION SYSTEM CHECK ===\n');
    
    // 1. Count all data
    const groupCount = await prisma.group.count();
    const userCount = await prisma.user.count();
    const memberCount = await prisma.groupMember.count();
    
    console.log('📊 DATABASE STATUS:');
    console.log(`   • Total Groups: ${groupCount}`);
    console.log(`   • Total Users: ${userCount}`);
    console.log(`   • Group Memberships: ${memberCount}\n`);
    
    if (groupCount === 0) {
      console.log('⚠️ NO GROUPS FOUND - Need to create sample groups first');
      console.log('\n Creating sample groups...\n');
      
      // Get a user
      const user = await prisma.user.findFirst();
      if (!user) {
        console.log('❌ No users found. Cannot create groups.');
        return;
      }
      
      // Create sample groups
      const group1 = await prisma.group.create({
        data: {
          name: 'Exporters Community',
          description: 'Community for export business professionals',
          type: 'PUBLIC',
          ownerId: user.id,
          isActive: true
        }
      });
      
      const group2 = await prisma.group.create({
        data: {
          name: 'Private Strategy Group',
          description: 'Private group for strategy discussion',
          type: 'PRIVATE',
          ownerId: user.id,
          isActive: true
        }
      });
      
      const group3 = await prisma.group.create({
        data: {
          name: 'Market Trends Discussion',
          description: 'Discuss latest market trends',
          type: 'PUBLIC',
          ownerId: user.id,
          isActive: true
        }
      });
      
      console.log('✅ Sample groups created:\n');
      console.log(`   1. ${group1.name} (PUBLIC)`);
      console.log(`   2. ${group2.name} (PRIVATE)`);
      console.log(`   3. ${group3.name} (PUBLIC)\n`);
      
      // Add user as member to group1 and group2
      await prisma.groupMember.create({
        data: {
          userId: user.id,
          groupId: group1.id
        }
      });
      
      await prisma.groupMember.create({
        data: {
          userId: user.id,
          groupId: group2.id
        }
      });
      
      console.log(`✅ User "${user.name}" added to groups 1 & 2\n`);
    }
    
    // 2. Now check groups
    console.log('🔍 GROUP TYPES:');
    const allGroups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        _count: { select: { groupMembers: true } }
      }
    });
    
    allGroups.forEach(g => {
      const typeIcon = g.type === 'PUBLIC' ? '🔓' : '🔒';
      console.log(`   ${typeIcon} ${g.name} | Type: ${g.type} | Members: ${g._count.groupMembers}`);
    });
    
    const publicCount = allGroups.filter(g => g.type === 'PUBLIC').length;
    const privateCount = allGroups.filter(g => g.type === 'PRIVATE').length;
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   • Public groups: ${publicCount} (will show in recommendations)`);
    console.log(`   • Private groups: ${privateCount} (hidden from recommendations)`);
    
    // 3. Test recommendation logic
    console.log(`\n🧪 TESTING RECOMMENDATION LOGIC:\n`);
    
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`   User: ${testUser.name}\n`);
      
      // Get user's groups
      const userMemberships = await prisma.groupMember.findMany({
        where: { userId: testUser.id },
        include: { group: true }
      });
      
      const userGroupIds = userMemberships.map(m => m.groupId);
      console.log(`   User's groups (${userGroupIds.length}):`);
      userMemberships.forEach(m => {
        console.log(`   - ${m.group.name} (${m.group.type})`);
      });
      
      // Get public groups
      const publicGroups = await prisma.group.findMany({
        where: { isActive: true, type: 'PUBLIC' }
      });
      
      console.log(`\n   Public groups available (${publicGroups.length}):`);
      publicGroups.forEach(g => {
        const isMember = userGroupIds.includes(g.id);
        console.log(`   ${isMember ? '✓' : '→'} ${g.name}`);
      });
      
      // Apply recommendation logic
      const userGroups = userMemberships.map(m => m.group).filter(g => g.isActive);
      const newPublicGroups = publicGroups.filter(g => !userGroupIds.includes(g.id));
      const recommended = [...userGroups, ...newPublicGroups].slice(0, 5);
      
      console.log(`\n   📱 AKAN DITAMPILKAN DI "GRUP REKOMENDASI":`);
      recommended.forEach((g, i) => {
        const isMember = userGroupIds.includes(g.id);
        const label = isMember ? '👤 (User Group)' : '🔓 (Public Group)';
        console.log(`   ${i+1}. ${g.name} ${label}`);
      });
    }
    
    console.log(`\n✅ CHECK COMPLETE - System is ready!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
})();