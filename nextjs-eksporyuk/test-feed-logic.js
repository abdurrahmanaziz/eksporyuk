const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFeedAPI() {
  console.log('🧪 TESTING FEED API LOCALLY\n');
  
  try {
    // Use admin_test user
    const session = { user: { id: 'admin_test_1766965516934' } };
    
    console.log(`Testing with user ID: ${session.user.id}\n`);
    
    // Replicate the feed API logic
    const filter = 'all';
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Get current user's active memberships
    const currentUserMemberships = await prisma.userMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      select: { membershipId: true }
    });
    console.log(`1. User has ${currentUserMemberships.length} active memberships`);

    const userMembershipIds = currentUserMemberships.map(m => m.membershipId);

    // Get community users
    let communityUserIdList = [];
    if (userMembershipIds.length > 0) {
      const communityUserIds = await prisma.userMembership.findMany({
        where: {
          membershipId: { in: userMembershipIds },
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        select: { userId: true },
        distinct: ['userId']
      });
      communityUserIdList = communityUserIds.map(u => u.userId);
    } else {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      communityUserIdList = allUsers.map(u => u.id);
      console.log(`2. No memberships - using all ${communityUserIdList.length} users`);
    }

    // Get user's direct group memberships
    const directGroupMemberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      select: { groupId: true }
    });
    const directGroupIds = directGroupMemberships.map(g => g.groupId);
    console.log(`3. Direct group memberships: ${directGroupIds.length}`);

    // Get groups via membership plan
    const membershipGroupAccess = await prisma.membershipGroup.findMany({
      where: { membershipId: { in: userMembershipIds } },
      select: { groupId: true }
    });
    const membershipGroupIds = membershipGroupAccess.map(g => g.groupId);
    console.log(`4. Groups via membership: ${membershipGroupIds.length}`);

    // Get groups user owns
    const ownedGroups = await prisma.group.findMany({
      where: { ownerId: session.user.id, isActive: true },
      select: { id: true }
    });
    const ownedGroupIds = ownedGroups.map(g => g.id);
    console.log(`5. Owned groups: ${ownedGroupIds.length}`);

    // Get public groups
    const publicGroups = await prisma.group.findMany({
      where: { type: 'PUBLIC', isActive: true },
      select: { id: true }
    });
    const publicGroupIds = publicGroups.map(g => g.id);
    console.log(`6. Public groups: ${publicGroupIds.length}`);

    // Combine all accessible group IDs
    const accessibleGroupIds = [...new Set([...directGroupIds, ...membershipGroupIds, ...ownedGroupIds, ...publicGroupIds])];
    console.log(`7. Total accessible groups: ${accessibleGroupIds.length}`);

    // Build where conditions
    const whereConditions = {};
    const postOrConditions = [];
    
    if (accessibleGroupIds.length > 0) {
      postOrConditions.push({ groupId: { in: accessibleGroupIds } });
    }
    
    if (communityUserIdList.length > 0) {
      postOrConditions.push({ 
        groupId: null, 
        authorId: { in: communityUserIdList } 
      });
    }

    console.log(`8. Post OR conditions: ${postOrConditions.length}`);

    if (postOrConditions.length === 0) {
      console.log('\n❌ No accessible content - returning empty');
      return;
    }

    whereConditions.OR = postOrConditions;

    // Fetch posts
    console.log('\n9. Fetching posts with WHERE conditions:');
    console.log(JSON.stringify(whereConditions, null, 2).substring(0, 300) + '...\n');

    const posts = await prisma.post.findMany({
      where: whereConditions,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: limit,
      select: { id: true, content: true, authorId: true, groupId: true, approvalStatus: true }
    });

    console.log(`✅ Found ${posts.length} posts\n`);
    
    if (posts.length > 0) {
      console.log('Sample posts:');
      posts.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i+1}. "${p.content.substring(0, 40)}..." (${p.approvalStatus})`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFeedAPI();
