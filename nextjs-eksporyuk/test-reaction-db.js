const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCommentReaction() {
  const commentId = 'cmjp1nvn0000fitsud50gp24x';
  
  try {
    // Check if comment exists
    const comment = await prisma.postComment.findUnique({
      where: { id: commentId }
    });
    console.log('Comment exists:', !!comment);
    
    if (!comment) {
      console.log('Comment not found, getting first comment...');
      const firstComment = await prisma.postComment.findFirst({
        select: { id: true }
      });
      console.log('First comment:', firstComment);
      return;
    }
    
    // Get admin user
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true }
    });
    console.log('User:', user?.email, user?.id);
    
    if (!user) {
      console.log('No admin user found');
      return;
    }
    
    // Check existing reaction
    const existing = await prisma.commentReaction.findFirst({
      where: {
        commentId: commentId,
        userId: user.id
      }
    });
    console.log('Existing reaction:', existing);
    
    if (existing) {
      // Delete existing
      await prisma.commentReaction.delete({
        where: { id: existing.id }
      });
      console.log('Deleted existing reaction');
    }
    
    // Create new reaction
    const reaction = await prisma.commentReaction.create({
      data: {
        commentId: commentId,
        userId: user.id,
        type: 'LIKE'
      }
    });
    console.log('✅ Reaction created:', reaction);
    
    // Verify saved
    const saved = await prisma.commentReaction.findUnique({
      where: { id: reaction.id }
    });
    console.log('✅ Verified in DB:', saved);
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error('Code:', e.code);
    console.error('Meta:', e.meta);
  } finally {
    await prisma.$disconnect();
  }
}

testCommentReaction();
