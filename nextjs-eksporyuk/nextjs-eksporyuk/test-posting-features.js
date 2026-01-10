import { PrismaClient } from './nextjs-eksporyuk/node_modules/@prisma/client/index.js'

async function testPostingFeatures() {
  const prisma = new PrismaClient()

  try {
    console.log('🧪 Testing Posting Features...')

    // 1. Test Post Model
    console.log('\n1. Testing Post Model...')
    const postCount = await prisma.post.count()
    console.log(`✅ Found ${postCount} posts`)

    // 2. Test PostComment Model
    console.log('\n2. Testing PostComment Model...')
    const commentCount = await prisma.postComment.count()
    console.log(`✅ Found ${commentCount} comments`)

    // 3. Test PostLike Model
    console.log('\n3. Testing PostLike Model...')
    const likeCount = await prisma.postLike.count()
    console.log(`✅ Found ${likeCount} likes`)

    // 4. Test PostReaction Model
    console.log('\n4. Testing PostReaction Model...')
    const reactionCount = await prisma.postReaction.count()
    console.log(`✅ Found ${reactionCount} reactions`)

    // 5. Test Group Posts
    console.log('\n5. Testing Group Posts...')
    const groupPosts = await prisma.post.findMany({
      where: { groupId: { not: null } },
      take: 3,
      include: {
        author: { select: { name: true } },
        group: { select: { name: true } },
        likes: { take: 2 },
        comments: { take: 2 }
      }
    })
    console.log(`✅ Found ${groupPosts.length} group posts`)

    // 6. Test Public Posts
    console.log('\n6. Testing Public/Feed Posts...')
    const publicPosts = await prisma.post.findMany({
      where: { groupId: null },
      take: 3
    })
    console.log(`✅ Found ${publicPosts.length} public posts`)

    // 7. Test creating a test post
    console.log('\n7. Testing Post Creation...')
    const testUser = await prisma.user.findFirst()
    
    if (testUser) {
      const testPost = await prisma.post.create({
        data: {
          authorId: testUser.id,
          content: "Test post for debugging - safe to delete",
          type: 'POST',
          approvalStatus: 'APPROVED'
        }
      })
      console.log(`✅ Created test post with ID: ${testPost.id}`)

      // Test cleanup
      await prisma.post.delete({ where: { id: testPost.id } })
      console.log(`✅ Cleaned up test post`)
    }

    // 8. Test Post with Comments
    console.log('\n8. Testing Post with Comments...')
    const postWithComments = await prisma.post.findFirst({
      where: { commentsCount: { gt: 0 } }
    })
    
    if (postWithComments) {
      const comments = await prisma.postComment.findMany({
        where: { postId: postWithComments.id },
        take: 3
      })
      console.log(`✅ Found ${comments.length} comments for post ${postWithComments.id}`)
    } else {
      console.log(`ℹ️ No posts with comments found`)
    }

    // 9. Test getUserPosts function simulation
    console.log('\n9. Testing User Posts Query...')
    if (testUser) {
      const userPosts = await prisma.post.findMany({
        where: { 
          authorId: testUser.id,
          OR: [
            { groupId: null }, // Public posts
            { groupId: { not: null } } // Group posts (we'd normally check membership)
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      console.log(`✅ Found ${userPosts.length} posts by user ${testUser.name}`)
    }

    console.log('\n✨ All posting features tests completed successfully!')

  } catch (error) {
    console.error('❌ Error testing posting features:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPostingFeatures()