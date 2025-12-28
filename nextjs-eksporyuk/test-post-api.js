const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPostAPI() {
  try {
    // Get a real post ID and user ID
    const post = await prisma.post.findFirst({
      select: { id: true, authorId: true }
    });
    
    if (!post) {
      console.log('No posts found in database');
      return;
    }
    
    const postId = post.id;
    const userId = post.authorId;
    
    console.log('Testing with postId:', postId);
    console.log('Testing with userId:', userId);
    
    console.log('\n=== Testing Comments API ===');
    
    // Test the exact query from GET comments
    console.log('Testing GET comments query...');
    const comments = await prisma.postComment.findMany({
      where: {
        postId: postId,
        parentId: null,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          },
        },
        other_PostComment: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                avatar: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('✅ GET comments successful, count:', comments.length);
    
    // Test creating a comment (like POST endpoint)
    console.log('Testing POST comment query...');
    const newComment = await prisma.postComment.create({
      data: {
        content: 'Test comment ' + Date.now(),
        postId: postId,
        userId: userId,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          },
        },
      },
    });
    console.log('✅ POST comment successful:', newComment.id);
    
    // Clean up test comment
    await prisma.postComment.delete({
      where: { id: newComment.id }
    });
    console.log('✅ Cleanup test comment successful');
    
    console.log('\n=== Testing Save Post API ===');
    
    // Test find existing save (using findFirst like in the API)
    console.log('Testing find existing save...');
    const existingSave = await prisma.savedPost.findFirst({
      where: {
        postId,
        userId,
      },
    });
    console.log('✅ Find save successful:', !!existingSave);
    
    // Test creating a save post
    if (!existingSave) {
      console.log('Testing create save post...');
      const createSave = await prisma.savedPost.create({
        data: {
          userId,
          postId,
        },
      });
      console.log('✅ Create save successful:', !!createSave);
      
      // Clean up
      await prisma.savedPost.delete({
        where: { id: createSave.id }
      });
      console.log('✅ Cleanup save successful');
    } else {
      console.log('Save already exists, skipping create test');
    }
    
    console.log('\n=== Testing Reactions API ===');
    
    // Test get reactions
    console.log('Testing GET reactions query...');
    const reactions = await prisma.postReaction.findMany({
      where: { postId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('✅ GET reactions successful, count:', reactions.length);
    
    // Test creating a reaction
    console.log('Testing create reaction...');
    const existingReaction = await prisma.postReaction.findFirst({
      where: {
        postId,
        userId,
      },
    });
    
    if (!existingReaction) {
      const newReaction = await prisma.postReaction.create({
        data: {
          postId,
          userId,
          type: 'LIKE',
        },
      });
      console.log('✅ Create reaction successful:', newReaction.id);
      
      // Clean up
      await prisma.postReaction.delete({
        where: { id: newReaction.id }
      });
      console.log('✅ Cleanup reaction successful');
    } else {
      console.log('Reaction already exists, skipping create test');
    }
    
    console.log('\n✅✅✅ ALL TESTS PASSED ✅✅✅');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPostAPI();