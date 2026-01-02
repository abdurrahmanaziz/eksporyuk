const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateExistingTransaction() {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { invoiceNumber: 'INV1767079675827' }
    });
    
    console.log('Current transaction status:', transaction?.status);
    console.log('Has payment proof?', !!transaction?.paymentProofUrl);
    
    if (transaction && transaction.paymentProofUrl && transaction.status === 'PENDING') {
      console.log('Updating transaction status to PENDING_CONFIRMATION...');
      
      const updated = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'PENDING_CONFIRMATION',
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Transaction status updated successfully!');
      console.log('Old status: PENDING');
      console.log('New status:', updated.status);
    } else {
      console.log('❌ Transaction not found or conditions not met');
      if (!transaction) {
        console.log('Transaction not found');
      } else if (!transaction.paymentProofUrl) {
        console.log('No payment proof uploaded');
      } else if (transaction.status !== 'PENDING') {
        console.log('Status is not PENDING (current:', transaction.status + ')');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingTransaction();