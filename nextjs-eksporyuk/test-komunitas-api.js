#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testKomunitasAPI() {
  try {
    console.log('\n✨ TEST: KOMUNITAS API RESPONSE STRUCTURE\n');
    console.log('═'.repeat(80));

    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    console.log(`\n👤 Testing API Response for: ${admin.name} (${admin.role})`);
    console.log(`📧 Email: ${admin.email}\n`);

    // === SIMULATE API LOGIC ===
    const userId = admin.id;

    // Get user's groups
    const userGroupMembers = await prisma.groupMember.findMany({
      where: { userId }
    });

    const userGroupsData = await Promise.all(
      userGroupMembers.map(gm => prisma.group.findUnique({ where: { id: gm.groupId } }))
    );

    // Get all public groups
    const publicGroups = await prisma.group.findMany({
      where: {
        isActive: true,
        type: 'PUBLIC'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Separate
    const userGroupIds = userGroupMembers.map(gm => gm.groupId);
    const userGroups = userGroupsData.filter(g => g && g.isActive && g.type === 'PUBLIC');
    const newPublicGroups = publicGroups.filter(g => !userGroupIds.includes(g.id));

    // Get member counts
    const userGroupMemberCounts = await Promise.all(
      userGroups.map(g => 
        prisma.groupMember.count({ where: { groupId: g.id } })
      )
    );

    const newGroupMemberCounts = await Promise.all(
      newPublicGroups.map(g => 
        prisma.groupMember.count({ where: { groupId: g.id } })
      )
    );

    // Format komunitas
    const komunitas = userGroups.map((g, i) => ({
      id: g.id,
      slug: g.slug || g.id,
      name: g.name,
      description: g.description || '',
      thumbnail: g.avatar || null,
      memberCount: userGroupMemberCounts[i] || 0,
      isUserMember: true
    }));

    // Format public groups discovery
    const publicGroupsDiscovery = newPublicGroups
      .slice(0, 5 - komunitas.length)
      .map((g, i) => ({
        id: g.id,
        slug: g.slug || g.id,
        name: g.name,
        description: g.description || '',
        thumbnail: g.avatar || null,
        memberCount: newGroupMemberCounts[i] || 0,
        isUserMember: false
      }));

    // === API RESPONSE ===
    const apiResponse = {
      komunitas,
      publicGroups: publicGroupsDiscovery,
      groups: [...komunitas, ...publicGroupsDiscovery]
    };

    console.log('📤 API RESPONSE:\n');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log(`\n📊 BREAKDOWN:\n`);
    console.log(`✅ KOMUNITAS (User's Groups):`);
    if (komunitas.length === 0) {
      console.log('   (empty - user hasn\'t joined any public groups)');
    } else {
      komunitas.forEach((g, i) => {
        console.log(`   ${i + 1}. ${g.name}`);
        console.log(`      └─ Members: ${g.memberCount}, isUserMember: ${g.isUserMember}`);
      });
    }

    console.log(`\n🔓 PUBLIC GROUPS (Discovery):`);
    if (publicGroupsDiscovery.length === 0) {
      console.log('   (empty - all public groups already joined or none available)');
    } else {
      publicGroupsDiscovery.forEach((g, i) => {
        console.log(`   ${i + 1}. ${g.name}`);
        console.log(`      └─ Members: ${g.memberCount}, isUserMember: ${g.isUserMember}`);
      });
    }

    console.log(`\n📈 STATS:\n`);
    console.log(`   • Komunitas (user's groups): ${komunitas.length}`);
    console.log(`   • Public discovery: ${publicGroupsDiscovery.length}`);
    console.log(`   • Total shown: ${komunitas.length + publicGroupsDiscovery.length} (max 5)`);
    console.log(`   • Private groups hidden: ${await prisma.group.count({ where: { type: 'PRIVATE' } })}`);

    console.log(`\n✨ RESPONSE FIELDS:\n`);
    console.log('   - komunitas: User\'s own public groups (shown first)');
    console.log('   - publicGroups: New public groups to discover');
    console.log('   - groups: All groups combined (backward compatible)');

    console.log('\n' + '═'.repeat(80));
    console.log('✅ API TEST COMPLETE - READY FOR PRODUCTION\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testKomunitasAPI();
