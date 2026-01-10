/**
 * Test: Verify Xendit account validation fix
 * Check if the endpoint is truly non-existent
 */

const fetch = require('node-fetch');

async function testXenditEndpoint() {
  console.log('🧪 TESTING: Xendit Account Validation Endpoint\n');
  
  const baseURL = 'https://api.xendit.co';
  const endpoint = '/v1/account_validation';
  const fullURL = baseURL + endpoint;
  
  console.log(`Testing endpoint: ${fullURL}`);
  console.log('Method: POST');
  console.log('---\n');
  
  try {
    // Simulate call to non-existent endpoint with dummy auth
    const response = await fetch(fullURL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ZHVtbXk6',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel_category: 'EWALLET',
        channel_code: 'ID_DANA',
        account_holder: {
          phone_number: '+628118748177'
        }
      }),
      timeout: 5000
    });
    
    console.log(`Status Code: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    const body = await response.text();
    console.log(`Response Body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
    
    console.log('\n📊 ANALYSIS:');
    if (response.status === 404) {
      console.log('❌ CONFIRMED: Endpoint returns 404 (Not Found)');
      console.log('✅ This confirms /v1/account_validation does NOT exist');
      return 'NOT_FOUND';
    } else if (response.status === 400) {
      console.log('⚠️ Endpoint returns 400 (Bad Request)');
      console.log('→ Could mean endpoint exists but request is invalid');
      return 'BAD_REQUEST';
    } else if (response.status === 401) {
      console.log('⚠️ Endpoint returns 401 (Unauthorized)');
      console.log('→ Endpoint might exist but auth failed');
      return 'AUTH_FAILED';
    } else {
      console.log(`❓ Unexpected status: ${response.status}`);
      return 'UNKNOWN';
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\n📊 ANALYSIS:');
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('Network error - endpoint might not be accessible');
    } else if (error.message.includes('timeout')) {
      console.log('Timeout - endpoint might be down');
    } else {
      console.log('Other error');
    }
    return 'ERROR';
  }
}

async function checkRealPayoutEndpoint() {
  console.log('\n\n🧪 TESTING: Xendit Payout Endpoint (should exist)\n');
  
  const baseURL = 'https://api.xendit.co';
  const endpoint = '/v2/payouts';
  const fullURL = baseURL + endpoint;
  
  console.log(`Testing endpoint: ${fullURL}`);
  console.log('Method: POST');
  console.log('---\n');
  
  try {
    const response = await fetch(fullURL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ZHVtbXk6',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference_id: 'test',
        channel_code: 'ID_DANA',
        channel_properties: {
          account_number: '08118748177',
          account_holder_name: 'Test'
        },
        amount: 1000,
        currency: 'IDR'
      }),
      timeout: 5000
    });
    
    console.log(`Status Code: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    const body = await response.text();
    console.log(`Response Body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
    
    console.log('\n📊 ANALYSIS:');
    if (response.status === 404) {
      console.log('❌ ERROR: /v2/payouts also returns 404!');
      console.log('This is unexpected - /v2/payouts should exist');
      return 'NOT_FOUND';
    } else if (response.status === 400 || response.status === 401 || response.status === 422) {
      console.log('✅ CONFIRMED: Endpoint exists (returns validation error)');
      console.log('This is expected - endpoint exists but request is invalid');
      return 'EXISTS';
    } else {
      console.log(`Status ${response.status} - likely endpoint exists`);
      return 'EXISTS_OR_ERROR';
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return 'ERROR';
  }
}

async function main() {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║  Xendit API Endpoint Verification                          ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');
  
  const result1 = await testXenditEndpoint();
  const result2 = await checkRealPayoutEndpoint();
  
  console.log('\n\n╔═════════════════════════════════════════════════════════════╗');
  console.log('║  FINAL VERIFICATION                                        ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✓ /v1/account_validation: ${result1}`);
  console.log(`✓ /v2/payouts: ${result2}`);
  
  if (result1 === 'NOT_FOUND' && (result2 === 'EXISTS' || result2 === 'EXISTS_OR_ERROR')) {
    console.log('\n✅ CONCLUSION: FIX IS CORRECT');
    console.log('   - /v1/account_validation does NOT exist (404)');
    console.log('   - /v2/payouts DOES exist');
    console.log('   - Using mock service fallback is the right approach');
  } else {
    console.log('\n⚠️ UNEXPECTED RESULTS - Need to investigate further');
  }
}

main().catch(console.error);
