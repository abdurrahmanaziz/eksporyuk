/**
 * Send Test Emails Using Branded Templates
 * Test complete email flow to customer
 */

const { renderBrandedTemplateBySlug } = require('./src/lib/branded-template-engine');
const { mailketing } = require('./src/lib/integrations/mailketing');

const TEST_EMAIL = 'mangikiwwdigital@gmail.com';

async function sendWelcomeEmail() {
  console.log('\n📧 Sending Welcome Email Test...');
  console.log(`To: ${TEST_EMAIL}`);
  
  try {
    const result = await renderBrandedTemplateBySlug('welcome-registration', {
      name: 'Test User',
      email: TEST_EMAIL,
      registration_date: '2 Januari 2026',
      role: 'Member Free',
      support_email: 'support@eksporyuk.com',
      support_phone: '+62 812-3456-7890',
      dashboard_link: 'https://eksporyuk.com/dashboard'
    });

    if (!result) {
      console.log('⚠️  Template not found or not rendered');
      return false;
    }

    console.log('✓ Template rendered');
    console.log(`✓ Subject: ${result.subject}`);
    
    // Send email
    const sendResult = await mailketing.sendEmail({
      to: TEST_EMAIL,
      subject: result.subject,
      html: result.html,
      tags: ['welcome', 'registration', 'test']
    });

    console.log('✅ Email sent successfully via Mailketing');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function sendOrderConfirmationEmail() {
  console.log('\n📧 Sending Order Confirmation Email Test...');
  console.log(`To: ${TEST_EMAIL}`);
  
  try {
    const result = await renderBrandedTemplateBySlug('order-confirmation', {
      name: 'Test User',
      email: TEST_EMAIL,
      invoice_number: 'TEST-INV-001',
      transaction_date: '2 Januari 2026',
      product_name: 'Membership Pro Eksportir - 3 Bulan',
      product_description: 'Akses penuh ke semua fitur pembelajaran EksporYuk',
      amount: 'Rp 500.000',
      due_date: '9 Januari 2026',
      support_email: 'support@eksporyuk.com',
      support_phone: '+62 812-3456-7890',
      payment_link: 'https://eksporyuk.com/payment/TEST-INV-001'
    });

    if (!result) {
      console.log('⚠️  Template not found or not rendered');
      return false;
    }

    console.log('✓ Template rendered');
    console.log(`✓ Subject: ${result.subject}`);
    
    const sendResult = await mailketing.sendEmail({
      to: TEST_EMAIL,
      subject: result.subject,
      html: result.html,
      tags: ['order', 'payment', 'test']
    });

    console.log('✅ Email sent successfully via Mailketing');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function sendPaymentConfirmationEmail() {
  console.log('\n📧 Sending Payment Confirmation Email Test...');
  console.log(`To: ${TEST_EMAIL}`);
  
  try {
    const result = await renderBrandedTemplateBySlug('payment-confirmation', {
      name: 'Test User',
      email: TEST_EMAIL,
      invoice_number: 'TEST-INV-002',
      amount: 'Rp 500.000',
      transaction_date: '2 Januari 2026 14:30 WIB',
      support_email: 'support@eksporyuk.com',
      support_phone: '+62 812-3456-7890',
      dashboard_link: 'https://eksporyuk.com/dashboard'
    });

    if (!result) {
      console.log('⚠️  Template not found or not rendered');
      return false;
    }

    console.log('✓ Template rendered');
    console.log(`✓ Subject: ${result.subject}`);
    
    const sendResult = await mailketing.sendEmail({
      to: TEST_EMAIL,
      subject: result.subject,
      html: result.html,
      tags: ['payment-confirmation', 'test']
    });

    console.log('✅ Email sent successfully via Mailketing');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  Email Notification System - Test Run ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`\nTarget Email: ${TEST_EMAIL}`);
  console.log('Sending 3 test emails...');

  const results = [];

  results.push(await sendWelcomeEmail());
  await new Promise(r => setTimeout(r, 1000));
  
  results.push(await sendOrderConfirmationEmail());
  await new Promise(r => setTimeout(r, 1000));
  
  results.push(await sendPaymentConfirmationEmail());

  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║              Test Results             ║');
  console.log('╚═══════════════════════════════════════╝\n');

  const passed = results.filter(r => r).length;
  console.log(`✅ Passed: ${passed}/3`);
  console.log(`❌ Failed: ${results.length - passed}/3`);

  if (passed === 3) {
    console.log('\n🎉 All tests passed!');
    console.log(`\n📨 Check ${TEST_EMAIL} for the test emails`);
    console.log('They should arrive within 1-5 minutes');
  } else {
    console.log('\n⚠️  Some tests failed');
    console.log('Check MAILKETING_API_KEY configuration');
  }

  console.log('\n═══════════════════════════════════════\n');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
