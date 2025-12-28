const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAPI() {
  try {
    const postId = '353f90498e334497649c9634de0b5eb9';
    
    console.log('=== DEBUG API ENDPOINTS ===');
    console.log('Checking post exists...');
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true }
    });
    console.log('Post found:', !!post);
    
    if (!post) {
      console.log('Post not found! This could be the issue.');
      return;
    }

    console.log('Testing reactions query...');
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
    console.log('✅ Reactions query successful, count:', reactions.length);
    
    console.log('Testing reaction counts...');
    const reactionCounts = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { id: true },
    });
    console.log('✅ Reaction counts successful:', reactionCounts);
    
    console.log('Testing comments query...');
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('✅ Comments query successful, count:', comments.length);
    
    console.log('Testing saves query...');
    const saves = await prisma.savedPost.findMany({
      where: { postId }
    });
    console.log('✅ Saves query successful, count:', saves.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugAPI().catch(console.error);