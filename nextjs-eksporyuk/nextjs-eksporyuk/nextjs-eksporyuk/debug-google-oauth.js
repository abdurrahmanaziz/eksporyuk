const https = require('https');

console.log('🔍 DEBUG GOOGLE OAUTH CONFIGURATION\n');

// Test 1: Check if Google OAuth endpoint is accessible
console.log('1️⃣ Testing Google OAuth Sign In Endpoint...');
https.get('https://eksporyuk.com/api/auth/signin/google', (res) => {
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Headers:`, res.headers);
  
  if (res.statusCode === 302) {
    console.log(`   ✅ Redirect to: ${res.headers.location}`);
    
    // Check if redirect is to Google
    if (res.headers.location && res.headers.location.includes('accounts.google.com')) {
      console.log('   ✅ Correctly redirects to Google OAuth');
      
      // Extract client_id from redirect URL
      const url = new URL(res.headers.location);
      const clientId = url.searchParams.get('client_id');
      const redirectUri = url.searchParams.get('redirect_uri');
      
      console.log(`\n2️⃣ OAuth Parameters:`);
      console.log(`   Client ID: ${clientId}`);
      console.log(`   Redirect URI: ${redirectUri}`);
      console.log(`   Scope: ${url.searchParams.get('scope')}`);
      console.log(`   Response Type: ${url.searchParams.get('response_type')}`);
      console.log(`   State: ${url.searchParams.get('state')?.substring(0, 20)}...`);
      
      console.log(`\n3️⃣ Verification Checklist:`);
      console.log(`   ✓ Check Google Console (https://console.cloud.google.com/apis/credentials)`);
      console.log(`   ✓ Verify Client ID matches: ${clientId}`);
      console.log(`   ✓ Authorized redirect URIs must include: ${redirectUri}`);
      console.log(`   ✓ Authorized JavaScript origins must include: https://eksporyuk.com`);
      
    } else {
      console.log(`   ❌ Does not redirect to Google!`);
      console.log(`   Redirect location: ${res.headers.location}`);
    }
  } else if (res.statusCode === 400) {
    console.log('   ❌ Bad Request - Possible configuration error');
  } else {
    console.log(`   ⚠️ Unexpected status code`);
  }
}).on('error', (err) => {
  console.error('   ❌ Error:', err.message);
});

// Test 2: Check callback endpoint
console.log('\n4️⃣ Testing Google OAuth Callback Endpoint...');
https.get('https://eksporyuk.com/api/auth/callback/google', (res) => {
  console.log(`   Status: ${res.statusCode}`);
  if (res.statusCode === 400 || res.statusCode === 302) {
    console.log('   ✅ Endpoint exists (400/302 expected without code)');
  } else {
    console.log(`   ⚠️ Unexpected status: ${res.statusCode}`);
  }
}).on('error', (err) => {
  console.error('   ❌ Error:', err.message);
});

// Test 3: Check error page
setTimeout(() => {
  console.log('\n5️⃣ Testing Error Page...');
  https.get('https://eksporyuk.com/auth/error?error=AccessDenied', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);
      if (data.includes('AccessDenied') || data.includes('Gagal Login')) {
        console.log('   ✅ Error page shows AccessDenied message');
      }
    });
  }).on('error', (err) => {
    console.error('   ❌ Error:', err.message);
  });
}, 1000);
