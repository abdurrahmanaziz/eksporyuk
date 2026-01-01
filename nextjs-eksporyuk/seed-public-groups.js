const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🌱 CREATING SAMPLE PUBLIC GROUPS...\n');
    
    // Get a user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found');
      return;
    }
    
    // Create public groups
    const publicGroup1 = await prisma.group.create({
      data: {
        id: 'pub-group-1-' + Date.now(),
        name: 'Export Business Community',
        description: 'General community for export business professionals',
        type: 'PUBLIC',
        ownerId: user.id,
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    const publicGroup2 = await prisma.group.create({
      data: {
        id: 'pub-group-2-' + Date.now(),
        name: 'Market Trends & News',
        description: 'Share and discuss latest market trends',
        type: 'PUBLIC',
        ownerId: user.id,
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    const publicGroup3 = await prisma.group.create({
      data: {
        id: 'pub-group-3-' + Date.now(),
        name: 'Export Documentation Help',
        description: 'Get help with export documentation',
        type: 'PUBLIC',
        ownerId: user.id,
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ PUBLIC GROUPS CREATED:');
    console.log(`   1. ${publicGroup1.name}`);
    console.log(`   2. ${publicGroup2.name}`);
    console.log(`   3. ${publicGroup3.name}\n`);
    
    // Add user as member to public groups
    await prisma.groupMember.create({
      data: { 
        id: 'gm-' + Date.now() + '-1',
        userId: user.id, 
        groupId: publicGroup1.id 
      }
    });
    
    await prisma.groupMember.create({
      data: { 
        id: 'gm-' + Date.now() + '-2',
        userId: user.id, 
        groupId: publicGroup2.id 
      }
    });
    
    console.log(`✅ User "${user.name}" is now member of 2 public groups\n`);
    
    // Show final status
    const allGroups = await prisma.group.findMany();
    const publicCount = allGroups.filter(g => g.type === 'PUBLIC').length;
    const privateCount = allGroups.filter(g => g.type === 'PRIVATE').length;
    
    console.log('📊 FINAL STATUS:');
    console.log(`   Total groups: ${allGroups.length}`);
    console.log(`   • Public groups: ${publicCount} ✓`);
    console.log(`   • Private groups: ${privateCount} ✓\n`);
    
    console.log('✅ RECOMMENDATION SYSTEM IS READY TO TEST!');
    console.log('\nDashboard akan menampilkan:');
    console.log(`   • User's public groups (${2})`);
    console.log(`   • New public groups available (${publicCount - 2})`);
    console.log(`   • Private groups: HIDDEN ✗\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();