/**
 * Test Email Notification System
 * Sends test emails using branded templates to verify email delivery
 */

const { renderBrandedTemplateBySlug } = require('./src/lib/branded-template-engine.ts');
const { mailketing } = require('./src/lib/integrations/mailketing.ts');

const testEmail = 'mangikiwwdigital@gmail.com';
const testName = 'Test Customer';

async function testWelcomeEmail() {
  console.log('\n📧 Testing Welcome Registration Email...');
  try {
    const emailTemplate = await renderBrandedTemplateBySlug('welcome-registration', {
      name: testName,
      email: testEmail,
      registration_date: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      role: 'Member Free',
      support_email: 'support@eksporyuk.com',
      support_phone: '+62 812-3456-7890',
      dashboard_link: 'https://eksporyuk.com/dashboard'
    });

    if (emailTemplate) {
      await mailketing.sendEmail({
        to: testEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        tags: ['welcome', 'registration', 'test']
      });
      console.log('✅ Welcome email sent successfully');
    }
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
  }
}

async function testOrderConfirmationEmail() {
  console.log('\n📧 Testing Order Confirmation Email...');
  try {
    const emailTemplate = await renderBrandedTemplateBySlug('order-confirmation', {
      name: testName,
      email: testEmail,
      invoice_number: 'INV-2024-TEST-001',
      transaction_date: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      product_name: 'Membership Pro Eksportir - Test',
      product_description: '3 Bulan - Akses penuh ke semua fitur EksporYuk',
      amount: 'Rp 500.000',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      support_email: 'support@eksporyuk.com',
      support_phone: '+62 812-3456-7890',
      payment_link: 'https://eksporyuk.com/payment/INV-2024-TEST-001'
    });

    if (emailTemplate) {
      await mailketing.sendEmail({
        to: testEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        tags: ['order', 'payment', 'test']
      });
      console.log('✅ Order confirmation email sent successfully');
    }
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error.message);
  }
}

async function testPaymentConfirmationEmail() {
  console.log('\n📧 Testing Payment Confirmation Email...');
  try {
    const emailTemplate = await renderBrandedTemplateBySlug('payment-confirmation', {
      name: testName,
      email: testEmail,
      invoice_number: 'INV-2024-TEST-002',
      amount: 'Rp 500.000',
      transaction_date: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      support_email: 'support@eksporyuk.com',
      support_phone: '+62 812-3456-7890',
      dashboard_link: 'https://eksporyuk.com/dashboard'
    });

    if (emailTemplate) {
      await mailketing.sendEmail({
        to: testEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        tags: ['payment-confirmation', 'test']
      });
      console.log('✅ Payment confirmation email sent successfully');
    }
  } catch (error) {
    console.error('❌ Failed to send payment confirmation email:', error.message);
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════');
  console.log('Email Notification System Test');
  console.log('═══════════════════════════════════════');
  console.log(`Testing email address: ${testEmail}`);
  console.log('═══════════════════════════════════════');

  try {
    await testWelcomeEmail();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testOrderConfirmationEmail();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testPaymentConfirmationEmail();
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ All tests completed!');
    console.log('═══════════════════════════════════════');
    console.log(`\nCheck ${testEmail} for 3 test emails`);
    console.log('If emails not received, check:');
    console.log('1. MAILKETING_API_KEY is set correctly');
    console.log('2. Email address is valid');
    console.log('3. Check spam/junk folder');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests().then(() => process.exit(0));
