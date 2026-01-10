const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyReactions() {
  try {
    // Get all reactions for this comment
    const reactions = await prisma.commentReaction.findMany({
      where: {
        commentId: 'cmjp1nvn0000fitsud50gp24x'
      },
      include: {
        User: {
          select: { email: true, name: true }
        }
      }
    });
    
    console.log('=== REACTIONS SAVED IN DB ===');
    console.log('Total reactions:', reactions.length);
    reactions.forEach(r => {
      console.log(`- ${r.type} by ${r.User?.email} at ${r.createdAt}`);
    });
    
    // Get comment with reaction count
    const comment = await prisma.postComment.findUnique({
      where: { id: 'cmjp1nvn0000fitsud50gp24x' },
      select: {
        id: true,
        content: true,
        reactionsCount: true,
        _count: {
          select: { CommentReaction: true }
        }
      }
    });
    
    console.log('\n=== COMMENT INFO ===');
    console.log('Comment ID:', comment?.id);
    console.log('Content:', comment?.content?.substring(0, 50));
    console.log('Reactions Count (stored):', comment?.reactionsCount);
    console.log('Actual reaction count:', comment?._count?.CommentReaction);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyReactions();
