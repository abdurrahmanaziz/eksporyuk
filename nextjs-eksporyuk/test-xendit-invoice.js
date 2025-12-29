const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Invoice } = require('xendit-node');

async function testXenditInvoice() {
  // Get secret key from DB
  const config = await prisma.integrationConfig.findFirst({
    where: { service: 'xendit' }
  });
  
  const secretKey = config?.config?.XENDIT_SECRET_KEY;
  console.log('Using Secret Key:', secretKey?.substring(0, 20) + '...');
  
  if (!secretKey) {
    console.error('No secret key found!');
    return;
  }
  
  const invoiceApi = new Invoice({ secretKey });
  
  try {
    // Test create Invoice
    console.log('\nCreating test Invoice...');
    const result = await invoiceApi.createInvoice({
      data: {
        externalId: 'TEST-INV-' + Date.now(),
        amount: 250000,
        payerEmail: 'test@eksporyuk.com',
        description: 'Test Payment',
        invoiceDuration: 86400,
        currency: 'IDR',
        successRedirectUrl: 'https://eksporyuk.com/checkout/success',
        failureRedirectUrl: 'https://eksporyuk.com/checkout/failed',
      }
    });
    
    console.log('\n✅ SUCCESS! Invoice created:');
    console.log('- ID:', result.id);
    console.log('- Status:', result.status);
    console.log('- Invoice URL:', result.invoiceUrl);
    console.log('- Amount:', result.amount);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.rawResponse) {
      console.error('Raw Response:', error.rawResponse);
    }
  }
  
  await prisma.$disconnect();
}
testXenditInvoice();
