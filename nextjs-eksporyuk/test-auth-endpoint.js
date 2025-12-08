async function testAuthEndpoint() {
  console.log('🔧 Testing NextAuth endpoint...\n')
  
  try {
    // Test GET /api/auth/providers
    console.log('1️⃣ Testing GET /api/auth/providers')
    const providersRes = await fetch('http://localhost:3000/api/auth/providers')
    const providers = await providersRes.json()
    console.log('✅ Providers:', JSON.stringify(providers, null, 2))
    
    // Test GET /api/auth/csrf
    console.log('\n2️⃣ Testing GET /api/auth/csrf')
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf')
    const csrfData = await csrfRes.json()
    console.log('✅ CSRF Token:', csrfData.csrfToken)
    
    // Test POST /api/auth/callback/credentials
    console.log('\n3️⃣ Testing POST /api/auth/callback/credentials')
    const loginRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@eksporyuk.com',
        password: 'password123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3000/dashboard',
        json: true,
      }),
    })
    
    console.log('Response status:', loginRes.status)
    console.log('Response headers:', loginRes.headers.raw())
    
    const loginData = await loginRes.text()
    console.log('Response body:', loginData)
    
    if (loginRes.ok) {
      console.log('✅ Login endpoint works!')
    } else {
      console.log('❌ Login failed')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testAuthEndpoint()
