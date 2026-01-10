const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const txn = await prisma.transaction.findUnique({
      where: { id: 'txn_1768036141053_lk8d7r75lh' }
    });
    
    if (txn) {
      console.log('✅ Transaction found:');
      console.log(JSON.stringify(txn, null, 2));
    } else {
      console.log('❌ Transaction NOT found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
