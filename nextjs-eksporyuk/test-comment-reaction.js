const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCommentReaction() {
  try {
    // Get a comment to test
    const comment = await prisma.postComment.findFirst({
      select: { id: true }
    });
    
    if (!comment) {
      console.log('No comments found');
      return;
    }
    
    console.log('Testing with comment:', comment.id);
    
    // Get a user
    const user = await prisma.user.findFirst({
      select: { id: true }
    });
    
    console.log('Testing with user:', user.id);
    
    // Try to create a reaction
    const reaction = await prisma.commentReaction.create({
      data: {
        commentId: comment.id,
        userId: user.id,
        type: 'LIKE',
      },
    });
    
    console.log('✅ Created reaction:', reaction.id);
    
    // Clean up
    await prisma.commentReaction.delete({
      where: { id: reaction.id }
    });
    console.log('✅ Cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testCommentReaction();
