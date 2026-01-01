#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testKomunitasGroups() {
  try {
    console.log('\n📊 TEST: KOMUNITAS + PUBLIC GROUPS SEPARATION\n');
    console.log('═'.repeat(70));

    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    console.log(`\n👤 Testing with user: ${admin.name} (${admin.role})`);
    console.log(`📧 Email: ${admin.email}\n`);

    // Get user's group memberships
    const userGroupMembers = await prisma.groupMember.findMany({
      where: { userId: admin.id }
    });

    // Get group details
    const userGroupsData = await Promise.all(
      userGroupMembers.map(gm => prisma.group.findUnique({ where: { id: gm.groupId } }))
    );

    console.log(`📌 User's Group Memberships:`);
    if (userGroupsData.length === 0) {
      console.log('   (No groups joined yet)');
    } else {
      for (const g of userGroupsData.filter(Boolean)) {
        console.log(`   • ${g.name} (${g.type})`);
      }
    }

    // Get all public groups
    const allPublicGroups = await prisma.group.findMany({
      where: {
        isActive: true,
        type: 'PUBLIC'
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n🌍 All Public Groups in Database:`);
    for (const g of allPublicGroups) {
      const memberCount = await prisma.groupMember.count({
        where: { groupId: g.id }
      });
      console.log(`   • ${g.name} (${memberCount} members)`);
    }

    // Simulate API logic
    const userGroupIds = userGroupMembers.map(gm => gm.groupId);
    const userGroups = userGroupsData
      .filter(g => g && g.isActive && g.type === 'PUBLIC');

    const newPublicGroups = allPublicGroups.filter(
      g => !userGroupIds.includes(g.id)
    );

    console.log(`\n✅ KOMUNITAS (User's Groups - Always shown first):`);
    if (userGroups.length === 0) {
      console.log('   (User hasn\'t joined any public groups yet)');
    } else {
      for (const g of userGroups) {
        const memberCount = await prisma.groupMember.count({
          where: { groupId: g.id }
        });
        console.log(`   ✓ ${g.name} (${memberCount} members) [isUserMember=true]`);
      }
    }

    console.log(`\n🔓 DISCOVER (Public Groups - Show up to ${5 - userGroups.length} remaining slots):`);
    const discoverLimit = 5 - userGroups.length;
    const discoverGroups = newPublicGroups.slice(0, discoverLimit);
    
    if (discoverGroups.length === 0) {
      console.log('   (All public groups already joined or no more public groups)');
    } else {
      for (const g of discoverGroups) {
        const memberCount = await prisma.groupMember.count({
          where: { groupId: g.id }
        });
        console.log(`   • ${g.name} (${memberCount} members) [isUserMember=false]`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Komunitas groups shown: ${userGroups.length}`);
    console.log(`   • Discovery groups shown: ${discoverGroups.length}`);
    console.log(`   • Total displayed: ${userGroups.length + discoverGroups.length} (max 5)`);
    console.log(`   • Hidden private groups: ${(await prisma.group.count({ where: { type: 'PRIVATE' } }))}`);

    console.log(`\n✨ API Response Structure:`);
    console.log(`{
  "komunitas": [ /* ${userGroups.length} user's groups */ ],
  "publicGroups": [ /* ${discoverGroups.length} new public groups */ ],
  "groups": [ /* backward compatible - all ${userGroups.length + discoverGroups.length} groups */ ]
}`);

    console.log('\n' + '═'.repeat(70));
    console.log('✅ TEST COMPLETE\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testKomunitasGroups();
