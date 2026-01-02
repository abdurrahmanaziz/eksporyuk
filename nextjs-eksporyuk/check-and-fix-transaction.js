const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactionStatus() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'mangikiwwdigital@gmail.com' }
    });
    
    const transaction = await prisma.transaction.findFirst({
      where: { 
        userId: user.id,
        invoiceNumber: 'INV1767079675827' 
      }
    });
    
    console.log('=== TRANSACTION STATUS CHECK ===');
    console.log('Invoice:', transaction.invoiceNumber);
    console.log('Status:', transaction.status);
    console.log('Has Payment Proof:', !!transaction.paymentProofUrl);
    console.log('Payment Proof Submitted:', transaction.paymentProofSubmittedAt);
    console.log('Updated At:', transaction.updatedAt);
    
    if (transaction.paymentProofUrl && transaction.status === 'PENDING') {
      console.log('\n🚨 ISSUE FOUND:');
      console.log('Transaction has payment proof but status is still PENDING');
      console.log('This needs to be updated to PENDING_CONFIRMATION');
      
      console.log('\nFixing transaction status...');
      const updated = await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'PENDING_CONFIRMATION',
          updatedAt: new Date()
        }
      });
      
      console.log('✅ FIXED! Status updated to:', updated.status);
      
    } else if (transaction.status === 'PENDING_CONFIRMATION') {
      console.log('\n✅ STATUS CORRECT');
      console.log('Transaction status is PENDING_CONFIRMATION');
      console.log('Billing should show waiting status');
    } else {
      console.log('\nCurrent status:', transaction.status);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionStatus();