const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Remove old notification types
    const notifs = await prisma.notification.findMany({
      where: { type: 'MENTION' }
    });
    
    if (notifs.length > 0) {
      await prisma.notification.deleteMany({
        where: { type: 'MENTION' }
      });
      console.log(`Deleted ${notifs.length} MENTION notifications`);
    }
    
    console.log('✅ Cleanup done');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
