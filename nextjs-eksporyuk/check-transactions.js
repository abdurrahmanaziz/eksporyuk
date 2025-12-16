const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    console.log('📊 Checking database connection...');
    const count = await prisma.transaction.count();
    console.log(`Total transactions: ${count}`);
    
    if (count > 0) {
      const sample = await prisma.transaction.findFirst({
        select: {
          id: true,
          type: true,
          invoiceNumber: true,
          amount: true,
          metadata: true
        }
      });
      console.log('Sample transaction:', JSON.stringify(sample, null, 2));

      const typeGroups = await prisma.transaction.groupBy({
        by: ['type'],
        _count: { id: true }
      });
      console.log('Current type distribution:', typeGroups);
    } else {
      console.log('No transactions found in database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();