const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { PaymentRequest } = require('xendit-node');

async function testXenditVA() {
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
  
  const paymentRequestApi = new PaymentRequest({ secretKey });
  
  try {
    // Test create VA
    console.log('\nCreating test VA...');
    const result = await paymentRequestApi.createPaymentRequest({
      data: {
        referenceId: 'TEST-VA-' + Date.now(),
        amount: 250000,
        currency: 'IDR',
        paymentMethod: {
          type: 'VIRTUAL_ACCOUNT',
          reusability: 'ONE_TIME_USE',
          virtualAccount: {
            channelCode: 'BCA',
            channelProperties: {
              customerName: 'Test Customer',
              expiresAt: new Date(Date.now() + 86400000),
            }
          }
        }
      }
    });
    
    console.log('\n✅ SUCCESS! PaymentRequest created:');
    console.log('- ID:', result.id);
    console.log('- Status:', result.status);
    
    const vaNumber = result.paymentMethod?.virtualAccount?.channelProperties?.virtualAccountNumber;
    console.log('- VA Number:', vaNumber);
    console.log('- Full response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.rawResponse) {
      console.error('Raw Response:', error.rawResponse);
    }
  }
  
  await prisma.$disconnect();
}
testXenditVA();
