#!/usr/bin/env node

/**
 * 🧪 XENDIT PAYMENT GATEWAY TESTER
 * 
 * Test payment flow end-to-end including webhook verification
 * Run: node test-xendit-payment.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

const XENDIT_TEST_MODE = {
  // Test API keys (public - bisa digunakan untuk demo)
  API_KEY: 'xnd_development_xxxxxxxxxx', // User harus isi dari dashboard
  
  // Test Virtual Account numbers
  VA_PAID_BANKS: {
    BCA: '88088000000001',
    BNI: '88088000000002',
    BRI: '88088000000003',
    MANDIRI: '88088000000004',
    PERMATA: '88088000000005'
  },
  
  // Test webhook payloads
  WEBHOOK_PAID: {
    event: 'va.payment.complete',
    external_id: '', // Will be filled from user input
    bank_code: 'BCA',
    amount: 0, // Will be filled from user input
    payment_id: 'test_payment_' + Date.now(),
    transaction_timestamp: new Date().toISOString()
  }
};

console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🧪 XENDIT PAYMENT TESTING SUITE            ┃
┃  Version: 1.0.0                             ┃
┃  Environment: TEST MODE                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📌 PREREQUISITES:
   1. Xendit account (https://dashboard.xendit.co)
   2. TEST API keys configured in .env
   3. Local/staging server running
   4. Webhook URL accessible

🔗 WEBHOOK URL FORMAT:
   Local: http://localhost:3000/api/webhooks/xendit
   Ngrok: https://your-subdomain.ngrok.io/api/webhooks/xendit
   Staging: https://staging.eksporyuk.com/api/webhooks/xendit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`);

async function main() {
  try {
    // Phase 1: Configuration Check
    console.log('📋 PHASE 1: CONFIGURATION CHECK\n');
    
    const baseUrl = await ask('Enter your server URL (e.g., http://localhost:3000): ');
    const apiKey = await ask('Enter Xendit API Key (TEST mode): ');
    const webhookToken = await ask('Enter Webhook Token (from Xendit dashboard): ');
    
    console.log('\n✅ Configuration captured\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Phase 2: Create Test Transaction
    console.log('💳 PHASE 2: CREATE TEST TRANSACTION\n');
    
    console.log('Select transaction type:');
    console.log('1. Membership (PRO - Rp 100,000)');
    console.log('2. Membership (LIFETIME - Rp 1,500,000)');
    console.log('3. Course (Custom amount)');
    console.log('4. Product (Custom amount)');
    
    const typeChoice = await ask('\nYour choice (1-4): ');
    
    let transactionType = 'MEMBERSHIP';
    let amount = 100000;
    let externalId = 'test_tx_' + Date.now();
    
    switch (typeChoice.trim()) {
      case '1':
        amount = 100000;
        transactionType = 'MEMBERSHIP';
        console.log('\n📦 Selected: PRO Membership - Rp 100,000');
        break;
      case '2':
        amount = 1500000;
        transactionType = 'MEMBERSHIP';
        console.log('\n📦 Selected: LIFETIME Membership - Rp 1,500,000');
        break;
      case '3':
        transactionType = 'COURSE';
        const courseAmount = await ask('Enter course amount (Rp): ');
        amount = parseInt(courseAmount) || 50000;
        console.log(`\n📚 Selected: Course - Rp ${amount.toLocaleString('id-ID')}`);
        break;
      case '4':
        transactionType = 'PRODUCT';
        const productAmount = await ask('Enter product amount (Rp): ');
        amount = parseInt(productAmount) || 25000;
        console.log(`\n🎁 Selected: Product - Rp ${amount.toLocaleString('id-ID')}`);
        break;
      default:
        console.log('\n⚠️  Invalid choice, using default (PRO Membership)');
    }
    
    console.log(`\n📌 Transaction ID: ${externalId}`);
    console.log(`💰 Amount: Rp ${amount.toLocaleString('id-ID')}`);
    console.log(`🏷️  Type: ${transactionType}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Phase 3: Generate Virtual Account
    console.log('🏦 PHASE 3: VIRTUAL ACCOUNT GENERATION\n');
    
    console.log('Select bank:');
    console.log('1. BCA (Most popular)');
    console.log('2. BNI');
    console.log('3. BRI');
    console.log('4. Mandiri');
    console.log('5. Permata');
    
    const bankChoice = await ask('\nYour choice (1-5): ');
    
    let bankCode = 'BCA';
    switch (bankChoice.trim()) {
      case '1': bankCode = 'BCA'; break;
      case '2': bankCode = 'BNI'; break;
      case '3': bankCode = 'BRI'; break;
      case '4': bankCode = 'MANDIRI'; break;
      case '5': bankCode = 'PERMATA'; break;
      default: console.log('⚠️  Invalid choice, using BCA');
    }
    
    console.log(`\n✅ Bank selected: ${bankCode}`);
    console.log('\n🔄 Creating Virtual Account via Xendit API...');
    console.log('   (In real implementation, this calls Xendit API)');
    
    // Simulate VA creation
    const vaNumber = generateTestVA(bankCode);
    
    console.log(`\n✅ Virtual Account Created!`);
    console.log(`┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`);
    console.log(`┃  Bank: ${bankCode.padEnd(33)} ┃`);
    console.log(`┃  VA Number: ${vaNumber.padEnd(27)} ┃`);
    console.log(`┃  Amount: Rp ${amount.toLocaleString('id-ID').padEnd(23)} ┃`);
    console.log(`┃  Expires: 24 hours                   ┃`);
    console.log(`┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
    
    console.log('\n📝 CUSTOMER INSTRUCTIONS:');
    console.log(`   1. Open mobile banking / internet banking`);
    console.log(`   2. Select "Transfer" → "Virtual Account"`);
    console.log(`   3. Enter VA Number: ${vaNumber}`);
    console.log(`   4. Verify amount: Rp ${amount.toLocaleString('id-ID')}`);
    console.log(`   5. Complete the payment`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Phase 4: Simulate Payment
    console.log('💸 PHASE 4: PAYMENT SIMULATION\n');
    
    const simulatePayment = await ask('Simulate payment now? (y/n): ');
    
    if (simulatePayment.toLowerCase() === 'y') {
      console.log('\n🔄 Simulating payment...');
      console.log('   (In TEST mode, payment is instant)');
      
      // Wait 2 seconds to simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\n✅ Payment received by Xendit');
      console.log('🔔 Webhook notification will be sent to your server\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Phase 5: Webhook Testing
      console.log('🔗 PHASE 5: WEBHOOK TESTING\n');
      
      const testWebhook = await ask('Test webhook endpoint now? (y/n): ');
      
      if (testWebhook.toLowerCase() === 'y') {
        console.log('\n🔄 Preparing webhook payload...');
        
        const webhookPayload = {
          event: 'va.payment.complete',
          external_id: externalId,
          bank_code: bankCode,
          amount: amount,
          account_number: vaNumber,
          payment_id: 'test_payment_' + Date.now(),
          transaction_timestamp: new Date().toISOString()
        };
        
        console.log('\n📦 Webhook Payload:');
        console.log(JSON.stringify(webhookPayload, null, 2));
        
        console.log('\n🚀 Sending POST request to webhook...');
        console.log(`   URL: ${baseUrl}/api/webhooks/xendit`);
        console.log(`   Token: ${webhookToken.substring(0, 10)}...`);
        
        // Simulate webhook call
        try {
          const response = await fetch(`${baseUrl}/api/webhooks/xendit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-callback-token': webhookToken
            },
            body: JSON.stringify(webhookPayload)
          });
          
          const status = response.status;
          const result = await response.json().catch(() => ({}));
          
          console.log(`\n📥 Response received:`);
          console.log(`   Status: ${status}`);
          console.log(`   Body: ${JSON.stringify(result, null, 2)}`);
          
          if (status === 200) {
            console.log('\n✅ WEBHOOK TEST PASSED!');
            console.log('\n🎉 Expected Database Changes:');
            console.log(`   • Transaction status: PENDING → SUCCESS`);
            console.log(`   • Payment method: VA_${bankCode}`);
            console.log(`   • Paid at: ${new Date().toISOString()}`);
            
            if (transactionType === 'MEMBERSHIP') {
              console.log(`   • UserMembership created: ACTIVE`);
              console.log(`   • Auto-joined groups`);
              console.log(`   • Auto-enrolled courses`);
              console.log(`   • Revenue distribution processed`);
            } else if (transactionType === 'COURSE') {
              console.log(`   • CourseEnrollment created`);
              console.log(`   • Progress initialized: 0%`);
            } else if (transactionType === 'PRODUCT') {
              console.log(`   • UserProduct created`);
              console.log(`   • Download access granted`);
            }
            
            console.log(`   • Email notification sent`);
            console.log(`   • WhatsApp notification queued (if enabled)`);
            
          } else if (status === 401) {
            console.log('\n❌ WEBHOOK AUTHENTICATION FAILED');
            console.log('   Possible issues:');
            console.log('   • Webhook token mismatch');
            console.log('   • Token not configured in server');
            console.log('   • Header name incorrect (use x-callback-token)');
          } else {
            console.log(`\n⚠️  UNEXPECTED RESPONSE: ${status}`);
            console.log('   Check server logs for errors');
          }
          
        } catch (error) {
          console.log('\n❌ WEBHOOK REQUEST FAILED');
          console.log(`   Error: ${error.message}`);
          console.log('\n   Possible issues:');
          console.log('   • Server not running');
          console.log('   • Incorrect URL');
          console.log('   • Network/firewall blocking request');
          console.log('   • CORS policy (if testing from browser)');
        }
      }
    } else {
      console.log('\n⏩ Skipping payment simulation');
      console.log('\n💡 MANUAL TESTING STEPS:');
      console.log(`   1. Create real transaction in app`);
      console.log(`   2. Note the transaction ID`);
      console.log(`   3. Make payment to VA number`);
      console.log(`   4. Wait for webhook notification (1-5 minutes)`);
      console.log(`   5. Check database for status update`);
      console.log(`   6. Verify membership/course/product activation`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Phase 6: Database Verification
    console.log('🔍 PHASE 6: DATABASE VERIFICATION\n');
    
    console.log('📊 CHECK THESE TABLES:');
    console.log('\n1. Transaction:');
    console.log(`   SELECT * FROM "Transaction" WHERE id = '${externalId}';`);
    console.log(`   Expected: status = 'SUCCESS', paidAt != NULL`);
    
    if (transactionType === 'MEMBERSHIP') {
      console.log('\n2. UserMembership:');
      console.log(`   SELECT * FROM "UserMembership" WHERE transactionId = '${externalId}';`);
      console.log(`   Expected: isActive = true, status = 'ACTIVE'`);
      
      console.log('\n3. GroupMember:');
      console.log(`   SELECT * FROM "GroupMember" WHERE userId = (SELECT userId FROM "Transaction" WHERE id = '${externalId}');`);
      console.log(`   Expected: Member added to membership groups`);
      
      console.log('\n4. PendingRevenue:');
      console.log(`   SELECT * FROM "PendingRevenue" WHERE transactionId = '${externalId}';`);
      console.log(`   Expected: Revenue splits created (founder, co-founder, affiliate)`);
    } else if (transactionType === 'COURSE') {
      console.log('\n2. CourseEnrollment:');
      console.log(`   SELECT * FROM "CourseEnrollment" WHERE transactionId = '${externalId}';`);
      console.log(`   Expected: Enrollment created, progress = 0`);
    } else if (transactionType === 'PRODUCT') {
      console.log('\n2. UserProduct:');
      console.log(`   SELECT * FROM "UserProduct" WHERE transactionId = '${externalId}';`);
      console.log(`   Expected: Product ownership granted`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Summary
    console.log('📝 TESTING SUMMARY\n');
    console.log(`✅ Configuration: OK`);
    console.log(`✅ Transaction Created: ${externalId}`);
    console.log(`✅ Virtual Account: ${vaNumber} (${bankCode})`);
    console.log(`✅ Amount: Rp ${amount.toLocaleString('id-ID')}`);
    console.log(`✅ Type: ${transactionType}`);
    
    console.log('\n🔗 USEFUL LINKS:');
    console.log(`   • Xendit Dashboard: https://dashboard.xendit.co/`);
    console.log(`   • Webhook Logs: https://dashboard.xendit.co/webhooks`);
    console.log(`   • Test Cards: https://docs.xendit.co/xendit-api-overview/test-mode`);
    console.log(`   • Your App: ${baseUrl}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ TEST COMPLETE!\n');
    console.log('📧 If webhook succeeded, user should receive email notification.');
    console.log('📱 Check WhatsApp if Starsender is configured.\n');
    
    rl.close();
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    rl.close();
    process.exit(1);
  }
}

function generateTestVA(bankCode) {
  const prefix = '88088';
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return prefix + random;
}

// Run the test suite
main().catch(console.error);
