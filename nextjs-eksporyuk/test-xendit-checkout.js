#!/usr/bin/env node

/**
 * Test Xendit Payment Integration
 * 
 * This script tests the checkout API to verify if Xendit redirect URLs are properly generated.
 */

const fetch = require('node-fetch');

async function testXenditCheckout() {
  console.log('🧪 Testing Xendit Payment Integration');
  console.log('=====================================\n');

  const testPayload = {
    type: 'MEMBERSHIP',
    membershipId: 'test-package',
    amount: 50000,
    customerData: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '08123456789',
      whatsapp: '08123456789'
    },
    paymentMethod: 'bank_transfer',
    paymentChannel: 'BCA'
  };

  try {
    console.log('📦 Sending test checkout request...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`\n📡 Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Checkout Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success) {
        if (data.paymentUrl) {
          console.log('\n🎯 Payment URL Found:');
          console.log(`URL: ${data.paymentUrl}`);
          
          if (data.paymentUrl.includes('xendit') || data.paymentUrl.includes('invoice')) {
            console.log('✅ Successfully redirecting to Xendit checkout page!');
          } else {
            console.log('⚠️ Payment URL appears to be local page, not Xendit checkout');
          }
        } else {
          console.log('❌ No paymentUrl in response');
        }

        if (data.xenditData) {
          console.log('\n🏦 Xendit Data:');
          console.log(`Invoice ID: ${data.xenditData.id}`);
          console.log(`URL: ${data.xenditData.url}`);
          console.log(`Bank: ${data.xenditData.bankCode}`);
        }
      } else {
        console.log('❌ Checkout failed:', data.error);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n📋 Summary:');
  console.log('- Checkout API should return paymentUrl pointing to Xendit');
  console.log('- Frontend should redirect to this URL after successful checkout');
  console.log('- User should see Xendit payment page with bank transfer options');
}

testXenditCheckout();