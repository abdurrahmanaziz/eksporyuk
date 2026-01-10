#!/usr/bin/env node

// Test script untuk memverifikasi VA payment flow sudah beralih ke Invoice
// Run: node test-va-to-invoice.js

console.log('🧪 Testing VA to Invoice Payment Flow Migration\n');

async function testPaymentFlow() {
  try {
    // Test 1: VA payment dengan BCA
    console.log('1. Testing BCA VA payment (should use Invoice now)...');
    
    const bcaResponse = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'MEMBERSHIP',
        membershipId: 'test-membership',
        paymentMethod: 'bank_transfer', 
        paymentChannel: 'BCA',
        customerDetails: {
          name: 'Test User BCA',
          email: 'test-bca@example.com',
          phone: '081234567890'
        }
      })
    });

    const bcaData = await bcaResponse.json();
    
    if (bcaData.success) {
      console.log('✅ BCA Payment Response:');
      console.log('   - Transaction ID:', bcaData.transactionId);
      console.log('   - Payment URL:', bcaData.paymentUrl);
      
      if (bcaData.paymentUrl && bcaData.paymentUrl.includes('checkout.xendit.co')) {
        console.log('✅ SUCCESS: BCA VA redirects to Xendit Invoice (avoiding IP allowlist)');
      } else if (bcaData.paymentUrl && bcaData.paymentUrl.includes('/payment/va/')) {
        console.log('❌ WARNING: Still using local VA page (IP allowlist issue)');
      } else {
        console.log('⚠️  UNKNOWN: Payment URL format not recognized');
      }
    } else {
      console.log('❌ BCA Payment failed:', bcaData.error);
    }
    
    console.log('');

    // Test 2: E-wallet payment (should remain as Invoice)
    console.log('2. Testing E-wallet payment (should remain as Invoice)...');
    
    const ewalletResponse = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'MEMBERSHIP',
        membershipId: 'test-membership',
        paymentMethod: 'ewallet',
        customerDetails: {
          name: 'Test User E-wallet',
          email: 'test-ewallet@example.com', 
          phone: '081234567890'
        }
      })
    });

    const ewalletData = await ewalletResponse.json();
    
    if (ewalletData.success) {
      console.log('✅ E-wallet Payment Response:');
      console.log('   - Transaction ID:', ewalletData.transactionId);
      console.log('   - Payment URL:', ewalletData.paymentUrl);
      
      if (ewalletData.paymentUrl && ewalletData.paymentUrl.includes('checkout.xendit.co')) {
        console.log('✅ SUCCESS: E-wallet correctly uses Xendit Invoice');
      } else {
        console.log('❌ WARNING: E-wallet not using expected Invoice flow');
      }
    } else {
      console.log('❌ E-wallet Payment failed:', ewalletData.error);
    }

    console.log('');

    // Test 3: Manual payment (should remain as manual)
    console.log('3. Testing manual payment (should remain as manual)...');
    
    const manualResponse = await fetch('http://localhost:3000/api/checkout/simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        membershipId: 'test-membership',
        paymentMethod: 'manual',
        customerDetails: {
          name: 'Test User Manual',
          email: 'test-manual@example.com',
          phone: '081234567890'
        }
      })
    });

    const manualData = await manualResponse.json();
    
    if (manualData.success) {
      console.log('✅ Manual Payment Response:');
      console.log('   - Transaction ID:', manualData.transactionId);
      console.log('   - Payment URL:', manualData.paymentUrl);
      
      if (manualData.paymentUrl && manualData.paymentUrl.includes('/payment/manual/')) {
        console.log('✅ SUCCESS: Manual payment correctly uses manual page');
      } else {
        console.log('❌ WARNING: Manual payment not using expected manual flow');
      }
    } else {
      console.log('❌ Manual Payment failed:', manualData.error);
    }

    console.log('\n🎯 Payment Flow Migration Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure Next.js dev server is running:');
      console.log('   cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk');
      console.log('   npx next dev --port 3000');
    }
  }
}

// Run the test
testPaymentFlow();