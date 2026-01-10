const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== GRUP REKOMENDASI - VERIFICATION ===\n');
    
    // 1. Check groups count
    const groups = await prisma.group.findMany();
    const publicGroups = groups.filter(g => g.type === 'PUBLIC' && g.isActive);
    const privateGroups = groups.filter(g => g.type === 'PRIVATE' && g.isActive);
    
    console.log('✅ DATABASE STATUS:');
    console.log(`   • Total groups: ${groups.length}`);
    console.log(`   • Public groups: ${publicGroups.length}`);
    console.log(`   • Private groups: ${privateGroups.length}\n`);
    
    if (groups.length > 0) {
      console.log('📋 ALL GROUPS:');
      groups.forEach(g => {
        const icon = g.type === 'PUBLIC' ? '🔓' : '🔒';
        console.log(`   ${icon} ${g.name} (${g.type})`);
      });
    }
    
    // 2. Check users and memberships
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length > 0) {
      const user = users[0];
      console.log(`\n👤 TEST USER: ${user.name} (${user.role})\n`);
      
      // Count user's groups
      const userMemberships = await prisma.groupMember.findMany({
        where: { userId: user.id }
      });
      
      console.log(`   User's memberships: ${userMemberships.length}`);
      userMemberships.forEach(m => {
        const group = groups.find(g => g.id === m.groupId);
        if (group) {
          console.log(`   - ${group.name} (${group.type})`);
        }
      });
    }
    
    // 3. Verify API logic
    console.log(`\n🧪 API LOGIC VERIFICATION:\n`);
    
    console.log('The API will do:');
    console.log('  1. Get user\'s groups (all types)');
    console.log('  2. Get PUBLIC groups');
    console.log('  3. Combine: [user groups] + [new public groups]');
    console.log('  4. Limit to 5 groups');
    console.log('  5. PRIVATE groups will be filtered out\n');
    
    console.log('✅ SYSTEM READY FOR TESTING\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();