const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPostAPI() {
  try {
    const postId = '353f90498e334497649c9634de0b5eb9';
    console.log('=== Testing Comments API ===');
    
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
    
    console.log('=== Testing Save Post API ===');
    const userId = 'cmjmv752p0000it02k3xieg6g'; // Sample user ID
    
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
    console.log('✅ Cleanup successful');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPostAPI();