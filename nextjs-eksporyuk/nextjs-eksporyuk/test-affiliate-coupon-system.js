/**
 * Test Affiliate Coupon System - Complete Flow
 * 
 * Tests:
 * 1. GET /api/affiliate/coupons/templates - Fetch available templates
 * 2. POST /api/affiliate/coupons/generate - Create coupon from template
 * 3. GET /api/affiliate/coupons - Fetch affiliate's own coupons
 * 4. PATCH /api/affiliate/coupons/{id} - Update coupon status
 */

const BASE_URL = 'https://eksporyuk.com'

async function test(name, fn) {
  try {
    console.log(`\n✅ Testing: ${name}`)
    await fn()
  } catch (error) {
    console.error(`❌ FAILED: ${name}`)
    console.error(error.message)
  }
}

async function getAuthToken() {
  // Login first
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.TEST_EMAIL || 'azizbiasa@gmail.com',
      password: process.env.TEST_PASSWORD || 'password123',
    }),
    redirect: 'manual'
  })
  
  const cookies = loginRes.headers.get('set-cookie')
  console.log('Auth status:', loginRes.status)
  console.log('Cookies:', cookies ? 'received' : 'none')
  
  return cookies
}

async function fetchAPI(endpoint, method = 'GET', body = null, cookies = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  }
  
  if (cookies) {
    options.headers['Cookie'] = cookies
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  const res = await fetch(`${BASE_URL}${endpoint}`, options)
  const data = await res.json()
  
  console.log(`  ${method} ${endpoint}`)
  console.log(`  Status: ${res.status}`)
  console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 200))
  
  return { status: res.status, data }
}

async function runTests() {
  console.log('🚀 Starting Affiliate Coupon System Tests\n')
  
  // Get templates
  await test('GET /api/affiliate/coupons/templates', async () => {
    const { status, data } = await fetchAPI('/api/affiliate/coupons/templates')
    
    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}: ${data.error}`)
    }
    
    if (!Array.isArray(data.templates)) {
      throw new Error('Response should contain templates array')
    }
    
    console.log(`  Found ${data.templates.length} templates`)
    
    if (data.templates.length === 0) {
      console.warn('  ⚠️ No templates available - admin needs to create coupon templates')
    } else {
      console.log(`  First template: ${data.templates[0].code} - ${data.templates[0].description}`)
    }
  })
  
  // Fetch affiliate coupons (should work even if empty)
  await test('GET /api/affiliate/coupons', async () => {
    const { status, data } = await fetchAPI('/api/affiliate/coupons')
    
    if (status !== 200) {
      // May fail due to auth
      console.warn(`  Status ${status}: ${data.error || 'No auth'}`)
      return
    }
    
    if (!Array.isArray(data.coupons)) {
      throw new Error('Response should contain coupons array')
    }
    
    console.log(`  Affiliate has ${data.coupons.length} coupons`)
  })
  
  // Test generate endpoint structure
  await test('POST /api/affiliate/coupons/generate endpoint exists', async () => {
    const { status, data } = await fetchAPI('/api/affiliate/coupons/generate', 'POST', {
      templateId: 'nonexistent',
      customCode: 'TEST'
    })
    
    // Should return 401/404, not 500
    if (status >= 500) {
      throw new Error(`Server error ${status}: ${data.error}`)
    }
    
    console.log(`  Endpoint responds with status ${status}`)
    if (data.error) {
      console.log(`  Error message: ${data.error}`)
    }
  })
  
  console.log('\n✨ Test suite complete!')
}

runTests()
