const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Testing feed API logic...\n')
  
  // Get admin user
  const user = await prisma.user.findFirst({
    where: { email: 'admin@eksporyuk.com' }
  })
  
  if (!user) {
    console.log('❌ Admin user not found')
    return
  }
  
  console.log('✅ User found:', user.id, user.name)
  
  // Get user's active memberships
  const userMemberships = await prisma.userMembership.findMany({
    where: {
      userId: user.id,
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() }
    }
  })
  
  console.log('User memberships:', userMemberships.length)
  
  // Get all users (since no membership for testing)
  const allUsers = await prisma.user.findMany({
    select: { id: true }
  })
  const communityUserIds = allUsers.map(u => u.id)
  
  console.log('Community users:', communityUserIds.length)
  
  // Get accessible groups
  const accessibleGroups = await prisma.group.findMany({
    where: {
      isActive: true,
      OR: [
        { members: { some: { userId: user.id } } },
        { ownerId: user.id },
        { type: 'PUBLIC' }
      ]
    }
  })
  
  console.log('Accessible groups:', accessibleGroups.length)
  accessibleGroups.forEach(g => {
    console.log('  -', g.name, `(${g.type})`)
  })
  
  const groupIds = accessibleGroups.map(g => g.id)
  
  // Get posts
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        {
          groupId: { in: groupIds },
          OR: [
            { approvalStatus: 'APPROVED' },
            { approvalStatus: { equals: null } }
          ]
        },
        {
          groupId: null,
          authorId: { in: communityUserIds },
          OR: [
            { approvalStatus: 'APPROVED' },
            { approvalStatus: { equals: null } }
          ]
        }
      ]
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      group: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 20
  })
  
  console.log('\n📝 Total posts found:', posts.length)
  
  posts.forEach((post, i) => {
    console.log(`\n${i + 1}. Post ID: ${post.id}`)
    console.log(`   Author: ${post.author.name}`)
    console.log(`   Group: ${post.group ? post.group.name : 'Personal'}`)
    console.log(`   Content: ${post.content.substring(0, 80)}...`)
    console.log(`   Status: ${post.approvalStatus || 'null'}`)
  })
  
  if (posts.length === 0) {
    console.log('\n❌ No posts found! Checking why...')
    
    // Check all posts in database
    const allPosts = await prisma.post.findMany({
      include: {
        group: { select: { name: true } }
      }
    })
    
    console.log('\nTotal posts in DB:', allPosts.length)
    allPosts.forEach(p => {
      console.log(`  - Post ${p.id}: group=${p.group?.name || 'none'}, status=${p.approvalStatus || 'null'}`)
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
