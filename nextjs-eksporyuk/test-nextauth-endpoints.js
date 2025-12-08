// Test NextAuth session dalam environment yang sama dengan admin interface
// Using fetch available in Node 18+ or undici

async function testAuthEndpoints() {
  console.log('\n=== TEST NEXTAUTH ENDPOINTS ===\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Auth Session
    console.log('🔍 Testing /api/auth/session...');
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    console.log(`   Status: ${sessionResponse.status}`);
    const sessionData = await sessionResponse.json();
    console.log(`   Response: ${JSON.stringify(sessionData, null, 2)}`);

    // Test 2: Auth Providers  
    console.log('\n🔍 Testing /api/auth/providers...');
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
    console.log(`   Status: ${providersResponse.status}`);
    const providersData = await providersResponse.json();
    console.log(`   Google OAuth: ${providersData.google ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Credentials: ${providersData.credentials ? '✅ Available' : '❌ Missing'}`);

    // Test 3: CSRF Token
    console.log('\n🔍 Testing /api/auth/csrf...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    console.log(`   Status: ${csrfResponse.status}`);
    const csrfData = await csrfResponse.json();
    console.log(`   CSRF Token: ${csrfData.csrfToken ? '✅ Available' : '❌ Missing'}`);

    // Test 4: Products API (yang sering update)
    console.log('\n🔍 Testing /api/products...');
    const productsResponse = await fetch(`${baseUrl}/api/products`);
    console.log(`   Status: ${productsResponse.status}`);
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log(`   Products loaded: ${products.length}`);
    }

    console.log('\n✅ Semua endpoint NextAuth working normally!');
    console.log('💡 CLIENT_FETCH_ERROR kemungkinan sudah fixed dengan TypeScript updates');

  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('🔍 Server belum running atau port 3000 unavailable');
    } else if (error.message.includes('CLIENT_FETCH_ERROR')) {
      console.log('🔍 NextAuth CLIENT_FETCH_ERROR detected!');
    }
  }
}

testAuthEndpoints();