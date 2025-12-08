/**
 * Debug Credit Checkout - Simulate API call with proper session
 * Run: node debug-checkout.js
 */

// Simulate what the API does step by step
async function debugCheckout() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Debugging Credit Checkout Flow\n');
    
    // Step 1: Simulate getting user
    console.log('Step 1: Getting user...');
    const user = await prisma.user.findFirst({
      where: { email: 'affiliate@eksporyuk.com' }
    });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log('✅ User:', user.name, user.id);

    // Step 2: Check settings for payment validation
    console.log('\nStep 2: Checking payment settings...');
    const settings = await prisma.settings.findFirst();
    console.log('   Min amount:', settings?.minPaymentAmount);
    console.log('   Max amount:', settings?.maxPaymentAmount);
    console.log('   Expiry hours:', settings?.paymentExpiryHours);

    // Step 3: Check Xendit config
    console.log('\nStep 3: Checking Xendit config...');
    const xenditConfig = await prisma.integrationConfig.findUnique({
      where: { service: 'xendit' }
    });
    console.log('   DB config exists:', !!xenditConfig);
    console.log('   DB config active:', xenditConfig?.isActive);
    
    const envKey = process.env.XENDIT_SECRET_KEY;
    console.log('   Env key exists:', !!envKey);
    console.log('   Env key is placeholder:', envKey?.includes('PASTE'));

    // Step 4: Get affiliate profile
    console.log('\nStep 4: Getting affiliate profile...');
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
    if (!affiliate) {
      console.log('❌ Affiliate profile not found');
      return;
    }
    console.log('✅ Affiliate:', affiliate.id);

    // Step 5: Try creating transaction
    console.log('\nStep 5: Creating test transaction...');
    const timestamp = Date.now();
    const invoiceNumber = `INV-DEBUG-${timestamp}`;
    const externalId = `DEBUG-${timestamp}-${affiliate.id.slice(0, 8)}`;

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        invoiceNumber,
        type: 'PRODUCT',
        amount: 50000,
        status: 'PENDING',
        description: 'Debug: Top up 70 kredit broadcast email',
        externalId,
        metadata: {
          affiliateId: affiliate.id,
          credits: 70,
          packageId: 'Starter',
          packageName: 'Starter',
          type: 'CREDIT_TOPUP',
        },
      },
    });
    console.log('✅ Transaction created:', transaction.id);

    // Step 6: Try Xendit mock (simulate what xenditService.createInvoice does)
    console.log('\nStep 6: Simulating Xendit invoice creation...');
    const mockId = 'debug-invoice-' + Date.now();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const mockInvoice = {
      id: mockId,
      externalId: externalId,
      external_id: externalId,
      status: 'PENDING',
      amount: 50000,
      invoiceUrl: `${baseUrl}/dev/mock-payment?invoice=${mockId}&amount=50000&external_id=${externalId}`,
      invoice_url: `${baseUrl}/dev/mock-payment?invoice=${mockId}&amount=50000&external_id=${externalId}`,
      _mock: true,
    };
    console.log('✅ Mock invoice created');
    console.log('   Invoice URL:', mockInvoice.invoiceUrl);

    // Step 7: Update transaction with payment URL
    console.log('\nStep 7: Updating transaction with payment URL...');
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        reference: mockInvoice.id,
        paymentUrl: mockInvoice.invoiceUrl,
        paymentProvider: 'XENDIT',
        metadata: {
          ...transaction.metadata,
          xenditInvoiceId: mockInvoice.id,
          xenditInvoiceUrl: mockInvoice.invoiceUrl,
        },
      },
    });
    console.log('✅ Transaction updated');

    // Cleanup - delete debug transaction
    console.log('\nCleaning up debug transaction...');
    await prisma.transaction.delete({ where: { id: transaction.id } });
    console.log('✅ Debug transaction deleted');

    console.log('\n🎉 All steps passed! The issue might be:');
    console.log('   1. Session not being passed correctly from frontend');
    console.log('   2. CORS or cookie issue');
    console.log('   3. Error in xendit-node library initialization');
    console.log('\nTry opening: ' + mockInvoice.invoiceUrl);

  } catch (error) {
    console.error('\n❌ Error at step:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugCheckout();
