import { PrismaClient } from './nextjs-eksporyuk/node_modules/@prisma/client/index.js'

async function testPostingAPIs() {
  const prisma = new PrismaClient()

  try {
    console.log('🧪 Testing Posting API Functions...')

    // Test getPostWithDetails function simulation
    console.log('\n1. Testing getPostWithDetails functionality...')
    
    // Create a test user first
    const testUser = await prisma.user.upsert({
      where: { email: 'test-posting@example.com' },
      create: {
        email: 'test-posting@example.com',
        name: 'Test Posting User',
        username: 'testposting',
        password: 'hashedpassword'
      },
      update: {}
    })

    // Create a test group
    const testGroup = await prisma.group.upsert({
      where: { slug: 'test-posting-group' },
      create: {
        name: 'Test Posting Group',
        description: 'Group for testing posting',
        slug: 'test-posting-group',
        ownerId: testUser.id,
        type: 'PUBLIC'
      },
      update: {}
    })

    // Create test posts
    const testPost = await prisma.post.create({
      data: {
        authorId: testUser.id,
        groupId: testGroup.id,
        content: "This is a test post with group for API testing",
        type: 'POST',
        approvalStatus: 'APPROVED'
      }
    })

    const publicPost = await prisma.post.create({
      data: {
        authorId: testUser.id,
        groupId: null, // Public post
        content: "This is a public test post for feed testing",
        type: 'POST',
        approvalStatus: 'APPROVED'
      }
    })

    console.log(`✅ Created test group post: ${testPost.id}`)
    console.log(`✅ Created test public post: ${publicPost.id}`)

    // Test include queries - simulate getPostWithDetails
    console.log('\n2. Testing include queries...')

    const postWithDetails = await prisma.post.findUnique({
      where: { id: testPost.id },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true, role: true, province: true, city: true, locationVerified: true }
        },
        group: {
          select: { id: true, name: true, slug: true, type: true, avatar: true }
        },
        likes: true,
        reactions: true,
        comments: { orderBy: { createdAt: 'asc' } },
        _count: {
          select: { likes: true, reactions: true, comments: true }
        }
      }
    })

    console.log(`✅ Successfully loaded post with full details:`)
    console.log(`   - Post: ${postWithDetails.content.substring(0, 50)}...`)
    console.log(`   - Author: ${postWithDetails.author.name}`)
    console.log(`   - Group: ${postWithDetails.group.name}`)
    console.log(`   - Likes count: ${postWithDetails._count.likes}`)
    console.log(`   - Comments count: ${postWithDetails._count.comments}`)

    // Test community feed query
    console.log('\n3. Testing community feed query...')

    const feedPosts = await prisma.post.findMany({
      where: {
        OR: [
          { groupId: null }, // Public posts
          { 
            group: { 
              type: 'PUBLIC',
              isActive: true 
            }
          }
        ],
        approvalStatus: 'APPROVED'
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true }
        },
        group: {
          select: { id: true, name: true, slug: true, type: true }
        },
        _count: {
          select: { likes: true, comments: true, reactions: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`✅ Community feed query returned ${feedPosts.length} posts`)

    // Test group posts query
    console.log('\n4. Testing group posts query...')

    const groupPosts = await prisma.post.findMany({
      where: {
        groupId: testGroup.id,
        approvalStatus: 'APPROVED'
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        },
        _count: {
          select: { likes: true, comments: true, reactions: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    })

    console.log(`✅ Group posts query returned ${groupPosts.length} posts`)

    // Test user posts query
    console.log('\n5. Testing user posts query...')

    const userPosts = await prisma.post.findMany({
      where: {
        authorId: testUser.id,
        OR: [
          { groupId: null },
          { 
            group: { 
              type: 'PUBLIC' 
            }
          }
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        },
        group: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`✅ User posts query returned ${userPosts.length} posts`)

    // Test post interactions
    console.log('\n6. Testing post interactions...')

    const testLike = await prisma.postLike.create({
      data: {
        postId: testPost.id,
        userId: testUser.id
      }
    })

    const testComment = await prisma.postComment.create({
      data: {
        postId: testPost.id,
        userId: testUser.id,
        content: "This is a test comment"
      }
    })

    const testReaction = await prisma.postReaction.create({
      data: {
        postId: testPost.id,
        userId: testUser.id,
        type: 'LOVE'
      }
    })

    console.log(`✅ Created like: ${testLike.id}`)
    console.log(`✅ Created comment: ${testComment.id}`)
    console.log(`✅ Created reaction: ${testReaction.id}`)

    // Test final query with all relations
    console.log('\n7. Testing complete post query...')

    const fullPost = await prisma.post.findUnique({
      where: { id: testPost.id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true }
        },
        group: {
          select: { id: true, name: true, slug: true, type: true }
        },
        likes: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        _count: {
          select: { likes: true, comments: true, reactions: true }
        }
      }
    })

    console.log(`✅ Complete post loaded with:`)
    console.log(`   - ${fullPost._count.likes} likes`)
    console.log(`   - ${fullPost._count.comments} comments`) 
    console.log(`   - ${fullPost._count.reactions} reactions`)

    // Cleanup
    console.log('\n8. Cleaning up test data...')
    
    await prisma.postReaction.deleteMany({ where: { postId: { in: [testPost.id, publicPost.id] } } })
    await prisma.postComment.deleteMany({ where: { postId: { in: [testPost.id, publicPost.id] } } })
    await prisma.postLike.deleteMany({ where: { postId: { in: [testPost.id, publicPost.id] } } })
    await prisma.post.deleteMany({ where: { id: { in: [testPost.id, publicPost.id] } } })
    await prisma.group.delete({ where: { id: testGroup.id } })
    await prisma.user.delete({ where: { id: testUser.id } })

    console.log(`✅ Cleaned up test data`)

    console.log('\n✨ All posting API tests completed successfully!')

  } catch (error) {
    console.error('❌ Error testing posting APIs:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPostingAPIs()