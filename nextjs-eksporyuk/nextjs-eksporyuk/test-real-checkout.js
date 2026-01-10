/**
 * Test Real Checkout Flow - POST to /api/checkout/simple
 * This will verify that Xendit invoice creation now returns invoiceUrl correctly
 */

const fetch = require('node-fetch');

async function testRealCheckout() {
  console.log('🧪 Testing REAL checkout flow...\n');

  try {
    const response = await fetch('https://eksporyuk.com/api/checkout/simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN_HERE' // User needs to provide real session
      },
      body: JSON.stringify({
        membershipId: 'cm56sswpl0000uvwcozf8u4wr', // Premium Membership
        paymentMethod: 'va',
        paymentChannel: 'BCA',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '081234567890'
      })
    });

    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.paymentUrl) {
      console.log('\n✅ SUCCESS!');
      console.log('🔗 Payment URL:', data.paymentUrl);
      console.log('Expected format: https://checkout.xendit.co/web/...');
      
      if (data.paymentUrl.includes('checkout.xendit.co')) {
        console.log('✅ Correct Xendit URL format!');
      } else {
        console.log('❌ Wrong URL format - not redirecting to Xendit checkout');
      }
    } else {
      console.log('\n❌ FAILED - No paymentUrl in response');
      console.log('Error:', data.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealCheckout();
