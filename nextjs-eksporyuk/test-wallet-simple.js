const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Starting...');
    
    const count = await prisma.wallet.count();
    console.log('Total wallets:', count);
    
    const withEarnings = await prisma.wallet.count({
      where: { totalEarnings: { gt: 0 } }
    });
    console.log('Wallets with earnings > 0:', withEarnings);
    
    const sample = await prisma.wallet.findFirst({
      where: { totalEarnings: { gt: 0 } },
      select: { userId: true, totalEarnings: true, balance: true }
    });
    
    if (sample) {
      console.log('Sample wallet:', sample);
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

test();
