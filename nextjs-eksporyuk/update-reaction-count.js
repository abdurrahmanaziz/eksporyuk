const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateReactionsCount() {
  const commentId = 'cmjp1nvn0000fitsud50gp24x';
  
  try {
    // Get reaction counts
    const reactionCounts = await prisma.commentReaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: { id: true },
    });

    const reactionsCount = reactionCounts.reduce((acc, curr) => {
      acc[curr.type] = curr._count.id;
      return acc;
    }, {});

    console.log('Reaction counts:', reactionsCount);

    // Update PostComment with new reaction count
    const updated = await prisma.postComment.update({
      where: { id: commentId },
      data: { reactionsCount },
    });

    console.log('✅ Updated comment reactionsCount:', updated.reactionsCount);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateReactionsCount();
