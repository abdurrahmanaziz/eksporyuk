const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    // Use raw SQL to delete old enums
    await prisma.$executeRaw`DELETE FROM "Notification" WHERE type = 'MENTION'`;
    await prisma.$executeRaw`DELETE FROM "Payout" WHERE status IN ('PROCESSING', 'FAILED', 'REVERSED')`;
    await prisma.$executeRaw`UPDATE "PostComment" SET documents = NULL WHERE documents IS NOT NULL`;
    await prisma.$executeRaw`UPDATE "PostComment" SET videos = NULL WHERE videos IS NOT NULL`;
    
    console.log('✅ Database fixed');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
