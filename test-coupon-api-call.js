/**
 * Test affiliate coupon generation API directly
 * Tests the exact request that the UI form sends
 */

const https = require('https');

// Get session token from environment or user
const NEXTAUTH_SESSION_TOKEN = process.env.NEXTAUTH_SESSION_TOKEN || 'YOUR_SESSION_TOKEN_HERE';
const API_URL = 'https://eksporyuk.com/api/affiliate/coupons/generate';

// Template ID from database (EKSPORYUK template)
const TEMPLATE_ID = '4aa8da9681fe25fe637d44e1a46a7145';
const CUSTOM_CODE = 'TESTAPI' + Math.random().toString(36).substring(7);

async function testCouponGeneration() {
  console.log('\n🚀 Testing Coupon Generation API...\n');
  console.log(`URL: ${API_URL}`);
  console.log(`Template ID: ${TEMPLATE_ID}`);
  console.log(`Custom Code: ${CUSTOM_CODE}`);
  console.log(`Session Token: ${NEXTAUTH_SESSION_TOKEN.substring(0, 20)}...`);

  const requestBody = {
    templateId: TEMPLATE_ID,
    customCode: CUSTOM_CODE,
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestBody);

    const options = {
      hostname: 'eksporyuk.com',
      port: 443,
      path: '/api/affiliate/coupons/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': `next-auth.session-token=${NEXTAUTH_SESSION_TOKEN}`,
      },
    };

    console.log('\n📤 Request Headers:');
    console.log(JSON.stringify(options.headers, null, 2));
    console.log('\n📦 Request Body:');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('\n⏳ Sending request...\n');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n✅ Response Status: ${res.statusCode}`);
        console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
        console.log('\nResponse Body:');
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(data);
        }

        if (res.statusCode === 201) {
          console.log('\n✅ SUCCESS! Coupon created.');
          resolve(data);
        } else if (res.statusCode === 500) {
          console.log('\n❌ ERROR 500! Check Vercel logs for details.');
          reject(new Error(`API returned 500: ${data}`));
        } else {
          console.log(`\n⚠️ Unexpected status: ${res.statusCode}`);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ Request failed:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
testCouponGeneration()
  .then(() => {
    console.log('\n✅ Test completed. Check response above.');
    console.log('\nNext step: If 500 error, check Vercel dashboard → Settings → Functions → /api/affiliate/coupons/generate → Logs');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nEnsure:');
    console.log('1. NEXTAUTH_SESSION_TOKEN environment variable is set');
    console.log('2. Session is valid (not expired)');
    console.log('3. User role is AFFILIATE, ADMIN, FOUNDER, or CO_FOUNDER');
    process.exit(1);
  });
