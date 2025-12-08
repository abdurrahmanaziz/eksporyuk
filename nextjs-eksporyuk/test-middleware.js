const fetch = require('node-fetch')

async function testMiddleware() {
  console.log('=== Testing Middleware Protection ===\n')
  
  try {
    // Test 1: Access admin without auth (should redirect to login)
    console.log('Test 1: Accessing /admin/short-links without authentication...')
    const response = await fetch('http://localhost:3000/admin/short-links', {
      redirect: 'manual' // Don't follow redirects
    })
    
    console.log('Status:', response.status)
    console.log('Redirect to:', response.headers.get('location') || 'None')
    
    if (response.status === 307 || response.status === 302) {
      const location = response.headers.get('location')
      if (location && location.includes('/auth/login')) {
        console.log('✅ PASS: Properly redirected to login\n')
      } else {
        console.log('❌ FAIL: Redirected to wrong location\n')
      }
    } else if (response.status === 200) {
      console.log('❌ FAIL: Admin page accessible without auth!\n')
    } else {
      console.log('⚠️  Unknown status:', response.status, '\n')
    }
    
    // Test 2: Login page should be accessible
    console.log('Test 2: Accessing /auth/login...')
    const loginResponse = await fetch('http://localhost:3000/auth/login')
    console.log('Status:', loginResponse.status)
    
    if (loginResponse.status === 200) {
      console.log('✅ PASS: Login page accessible\n')
    } else {
      console.log('❌ FAIL: Login page not accessible\n')
    }
    
  } catch (error) {
    console.error('Test error:', error.message)
  }
}

testMiddleware()
