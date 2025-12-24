#!/usr/bin/env node

/**
 * Test Optin Form Builder API
 * Run: node test-optin-api.js
 */

const baseUrl = 'http://localhost:3000'

async function testAPI(endpoint, description) {
  console.log(`\n🧪 Testing: ${description}`)
  console.log(`   Endpoint: ${endpoint}`)
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`)
    const status = response.status
    
    if (status === 200) {
      const data = await response.json()
      console.log(`   ✅ Status: ${status}`)
      console.log(`   📊 Response:`, JSON.stringify(data).substring(0, 100) + '...')
      return true
    } else if (status === 401) {
      console.log(`   ⚠️  Status: ${status} (Unauthorized - expected, needs login)`)
      return true
    } else {
      const text = await response.text()
      console.log(`   ❌ Status: ${status}`)
      console.log(`   Error:`, text.substring(0, 200))
      return false
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting Optin Form Builder API Tests')
  console.log('⏰ Make sure dev server is running on port 3000\n')
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const tests = [
    { endpoint: '/api/health', desc: 'Health check' },
    { endpoint: '/api/affiliate/optin-forms', desc: 'Get optin forms (requires auth)' },
    { endpoint: '/api/affiliate/onboarding', desc: 'Get onboarding status (requires auth)' },
    { endpoint: '/api/affiliate/lead-magnets', desc: 'Get lead magnets (requires auth)' },
  ]
  
  const results = []
  
  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.desc)
    results.push({ ...test, passed: result })
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n\n📊 Test Results Summary:')
  console.log('========================')
  
  results.forEach(({ desc, passed }) => {
    const icon = passed ? '✅' : '❌'
    console.log(`${icon} ${desc}`)
  })
  
  const allPassed = results.every(r => r.passed)
  
  if (allPassed) {
    console.log('\n🎉 All tests passed!')
    console.log('✅ Ready for deployment')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed')
    console.log('❌ Fix issues before deployment')
    process.exit(1)
  }
}

// Check if server is running
fetch(`${baseUrl}/api/health`)
  .then(() => {
    console.log('✅ Server detected on port 3000\n')
    runTests()
  })
  .catch(() => {
    console.log('❌ Server not running on port 3000')
    console.log('💡 Start server first: npm run dev')
    process.exit(1)
  })
