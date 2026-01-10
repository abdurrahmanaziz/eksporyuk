/**
 * Test checkout API to see detailed error
 */

async function testCheckout() {
  console.log('🧪 Testing Checkout API with detailed logging...\n');

  const testData = {
    planId: 'mem_lifetime_ekspor',
    name: 'Test User',
    email: 'test@example.com',
    phone: '081234567890',
    whatsapp: '081234567890',
    paymentMethod: 'bank_transfer',
    paymentChannel: 'BCA',
    priceOption: {
      price: 1998000,
      label: 'Lifetime',
      duration: 'lifetime'
    },
    finalPrice: 1998000
  };

  console.log('📤 Sending request to production API...');
  console.log('URL: https://eksporyuk.com/api/checkout/simple');
  console.log('Data:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('https://eksporyuk.com/api/checkout/simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail with 401 because no session
        // But we should see more details in error
      },
      body: JSON.stringify(testData)
    });

    console.log('\n📥 Response Status:', response.status, response.statusText);
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);

    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('\n📦 Response Data:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('\n📄 Response Text:');
      console.log(text.substring(0, 500));
    }

    if (response.status === 500) {
      console.log('\n❌ 500 ERROR DETECTED');
      console.log('Error details:', data);
      
      if (data.details) {
        console.log('\nStack trace:');
        console.log(data.details);
      }
    }

  } catch (error) {
    console.error('\n❌ Fetch Error:', error.message);
  }
}

testCheckout();
