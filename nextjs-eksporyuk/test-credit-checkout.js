/**
 * Test Credit Checkout Flow
 * Run: node test-credit-checkout.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCheckoutFlow() {
  console.log('🧪 Testing Credit Checkout Flow\n');
  
  // 1. Get affiliate user
  const affiliate = await prisma.user.findFirst({
    where: { email: 'affiliate@eksporyuk.com' },
    include: { affiliateProfile: true }
  });
  
  if (!affiliate?.affiliateProfile) {
    console.log('❌ No affiliate profile found');
    return;
  }
  
  console.log('✅ Affiliate:', affiliate.name, affiliate.email);
  console.log('   Profile ID:', affiliate.affiliateProfile.id);
  
  // 2. Check current credit balance
  let credit = await prisma.affiliateCredit.findUnique({
    where: { affiliateId: affiliate.affiliateProfile.id }
  });
  
  if (!credit) {
    // Create initial credit record
    credit = await prisma.affiliateCredit.create({
      data: {
        affiliateId: affiliate.affiliateProfile.id,
        balance: 0,
        totalTopUp: 0,
        totalUsed: 0,
      }
    });
    console.log('✅ Created initial credit record');
  }
  
  console.log('💰 Current Balance:', credit.balance, 'credits');
  
  // 3. Create a test transaction (simulate checkout)
  const packageData = {
    name: 'Starter',
    credits: 70,
    price: 50000
  };
  
  const externalId = `CREDIT-${Date.now()}-${affiliate.affiliateProfile.id.slice(0, 8)}`;
  const invoiceNumber = `INV-CREDIT-${Date.now()}`;
  
  const transaction = await prisma.transaction.create({
    data: {
      userId: affiliate.id,
      invoiceNumber,
      type: 'PRODUCT',
      amount: packageData.price,
      status: 'PENDING',
      description: `Top up ${packageData.credits} kredit broadcast email`,
      externalId,
      paymentProvider: 'XENDIT',
      paymentUrl: `http://localhost:3000/dev/mock-payment?invoice=test-${Date.now()}&amount=${packageData.price}&external_id=${externalId}`,
      metadata: {
        affiliateId: affiliate.affiliateProfile.id,
        credits: packageData.credits,
        packageId: packageData.name,
        packageName: packageData.name,
        type: 'CREDIT_TOPUP',
      },
    },
  });
  
  console.log('\n✅ Transaction Created:');
  console.log('   ID:', transaction.id);
  console.log('   External ID:', externalId);
  console.log('   Amount: Rp', packageData.price.toLocaleString('id-ID'));
  console.log('   Credits:', packageData.credits);
  
  console.log('\n📱 Mock Payment URL:');
  console.log(transaction.paymentUrl);
  
  // 4. Simulate successful payment (what webhook would do)
  console.log('\n🔄 Simulating payment success...');
  
  // Update transaction status
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'SUCCESS',
      paidAt: new Date(),
    },
  });
  
  // Add credits
  const balanceBefore = credit.balance;
  const balanceAfter = balanceBefore + packageData.credits;
  
  await prisma.affiliateCredit.update({
    where: { id: credit.id },
    data: {
      balance: { increment: packageData.credits },
      totalTopUp: { increment: packageData.credits },
    },
  });
  
  // Create credit transaction
  await prisma.affiliateCreditTransaction.create({
    data: {
      creditId: credit.id,
      affiliateId: affiliate.affiliateProfile.id,
      type: 'TOPUP',
      amount: packageData.credits,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      description: `Top up ${packageData.credits} kredit - ${packageData.name}`,
      referenceType: 'PAYMENT',
      referenceId: transaction.id,
      status: 'COMPLETED',
    },
  });
  
  console.log('✅ Credits Added!');
  console.log('   Balance Before:', balanceBefore);
  console.log('   Balance After:', balanceAfter);
  
  // 5. Verify
  const updatedCredit = await prisma.affiliateCredit.findUnique({
    where: { affiliateId: affiliate.affiliateProfile.id }
  });
  
  console.log('\n🎉 Final Balance:', updatedCredit.balance, 'credits');
  console.log('\n✅ Test completed successfully!');
}

testCheckoutFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
