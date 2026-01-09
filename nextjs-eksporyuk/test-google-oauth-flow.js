#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

console.log('🔍 COMPREHENSIVE GOOGLE OAUTH DEBUG\n');
console.log('=' .repeat(60));

// Step 1: Get CSRF token
console.log('\n📝 STEP 1: Getting CSRF token...');
https.get('https://eksporyuk.com/api/auth/csrf', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const csrfData = JSON.parse(data);
    console.log(`   ✅ CSRF Token: ${csrfData.csrfToken.substring(0, 30)}...`);
    
    // Step 2: Try to initiate Google OAuth with CSRF token
    console.log('\n📝 STEP 2: Initiating Google OAuth...');
    
    const cookie = `__Host-next-auth.csrf-token=${csrfData.csrfToken}`;
    
    const options = {
      hostname: 'eksporyuk.com',
      path: '/api/auth/signin/google',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie,
      }
    };
    
    const req = https.request(options, (res2) => {
      console.log(`   Status: ${res2.statusCode}`);
      console.log(`   Location: ${res2.headers.location}`);
      
      if (res2.headers.location && res2.headers.location.includes('accounts.google.com')) {
        console.log('\n   ✅ SUCCESS! Redirecting to Google OAuth');
        
        const url = new URL(res2.headers.location);
        console.log(`\n   📋 OAuth Parameters:`);
        console.log(`      client_id: ${url.searchParams.get('client_id')}`);
        console.log(`      redirect_uri: ${url.searchParams.get('redirect_uri')}`);
        console.log(`      scope: ${url.searchParams.get('scope')}`);
      } else {
        console.log(`\n   ❌ FAILED! Not redirecting to Google`);
        console.log(`   Error location: ${res2.headers.location}`);
        
        if (res2.headers.location && res2.headers.location.includes('error=')) {
          const errorMatch = res2.headers.location.match(/error=([^&]+)/);
          if (errorMatch) {
            console.log(`   ❌ Error code: ${errorMatch[1]}`);
            
            console.log(`\n   🔍 Possible causes:`);
            console.log(`      1. Google provider not initialized at build time`);
            console.log(`      2. GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing`);
            console.log(`      3. Provider disabled in NextAuth config`);
          }
        }
      }
    });
    
    req.write(`csrfToken=${encodeURIComponent(csrfData.csrfToken)}&callbackUrl=${encodeURIComponent('https://eksporyuk.com')}&json=true`);
    req.end();
  });
}).on('error', (err) => {
  console.error('   ❌ Error:', err.message);
});

// Step 3: Check what providers are actually available
setTimeout(() => {
  console.log('\n📝 STEP 3: Checking available providers...');
  https.get('https://eksporyuk.com/api/auth/providers', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const providers = JSON.parse(data);
      console.log('   Available providers:', JSON.stringify(providers, null, 2));
    });
  });
}, 2000);
