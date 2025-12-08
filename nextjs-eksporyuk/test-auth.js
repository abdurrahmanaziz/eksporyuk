// Test authentication flow
console.log('Testing authentication at:', new Date().toISOString())

async function testAuth() {
  try {
    // Test 1: Check if login page is accessible
    console.log('\n=== Test 1: Login page accessibility ===')
    const loginRes = await fetch('http://localhost:3000/auth/login')
    console.log('Login page status:', loginRes.status)
    
    // Test 2: Try to access admin without auth
    console.log('\n=== Test 2: Admin page without auth ===')
    const adminRes = await fetch('http://localhost:3000/admin/short-links', {
      redirect: 'manual'
    })
    console.log('Admin page status:', adminRes.status)
    console.log('Redirect location:', adminRes.headers.get('location'))
    
    // Test 3: Check auth API
    console.log('\n=== Test 3: Auth API health ===')
    const authRes = await fetch('http://localhost:3000/api/auth/providers')
    const authData = await authRes.json()
    console.log('Auth providers:', Object.keys(authData))
    
    // Test 4: Try login
    console.log('\n=== Test 4: Attempt login ===')
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf')
    const csrfData = await csrfRes.json()
    console.log('CSRF token obtained:', !!csrfData.csrfToken)
    
    console.log('\n=== All tests complete ===')
  } catch (error) {
    console.error('Test error:', error.message)
  }
}

testAuth()
