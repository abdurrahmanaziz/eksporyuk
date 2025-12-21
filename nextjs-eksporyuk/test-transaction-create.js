const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTransactionCreate() {
  try {
    console.log('Testing transaction creation...');
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'derryking914@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.id);
    
    // Test transaction create with minimal required fields
    const testData = {
      userId: user.id,
      amount: 100000,
      status: 'SUCCESS',
      type: 'MEMBERSHIP',
      description: 'Test transaction'
    };
    
    console.log('Creating transaction with data:', testData);
    
    const transaction = await prisma.transaction.create({
      data: testData
    });
    
    console.log('Transaction created successfully:', transaction.id);
    
    // Clean up - delete the test transaction
    await prisma.transaction.delete({
      where: { id: transaction.id }
    });
    
    console.log('Test transaction cleaned up');
    
  } catch (error) {
    console.error('Error details:', error);
    if (error.code) {
      console.log('Error code:', error.code);
    }
    if (error.meta) {
      console.log('Error meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testTransactionCreate();