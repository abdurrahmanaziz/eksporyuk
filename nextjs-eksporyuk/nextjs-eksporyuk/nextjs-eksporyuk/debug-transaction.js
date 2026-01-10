const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugTransaction() {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: '3ba2d9d6964496940b5fe77aa5af990d' }
    });
    
    if (!transaction) {
      console.log('❌ Transaction not found');
      return;
    }
    
    console.log('🔍 Transaction Debug:');
    console.log('ID:', transaction.id);
    console.log('Status:', transaction.status);
    console.log('PaymentMethod:', transaction.paymentMethod);
    console.log('PaymentProvider:', transaction.paymentProvider);
    console.log('Reference:', transaction.reference);
    console.log('PaymentURL:', transaction.paymentUrl);
    
    if (transaction.metadata) {
      const meta = typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : transaction.metadata;
      console.log('\nMetadata:');
      console.log('  paymentMethodType:', meta.paymentMethodType);
      console.log('  paymentChannel:', meta.paymentChannel);
      console.log('  paymentChannelName:', meta.paymentChannelName);
      console.log('  redirectedFromManual:', meta.redirectedFromManual);
      console.log('  Full metadata:', JSON.stringify(meta, null, 2));
    } else {
      console.log('\n❌ No metadata found');
    }
    
    // Check auto-redirect criteria
    const metadata = transaction.metadata;
    const paymentMethodType = metadata?.paymentMethodType;
    const paymentChannel = metadata?.paymentChannel;
    
    console.log('\n🔧 Auto-Redirect Check:');
    console.log('  paymentMethodType === "bank_transfer":', paymentMethodType === 'bank_transfer');
    console.log('  paymentChannel exists:', !!paymentChannel);
    console.log('  paymentChannel !== "manual":', paymentChannel !== 'manual');
    console.log('  !transaction.reference:', !transaction.reference);
    
    const shouldRedirect = paymentMethodType === 'bank_transfer' && 
                          paymentChannel && 
                          paymentChannel !== 'manual' && 
                          !transaction.reference;
    
    console.log('  SHOULD REDIRECT:', shouldRedirect);
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    await prisma.$disconnect();
  }
}

debugTransaction();