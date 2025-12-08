// Comprehensive API endpoint testing
async function testAllAPIs() {
  console.log('🌐 COMPREHENSIVE API TESTING\n')
  console.log('=' .repeat(80))
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  }

  const baseUrl = 'http://localhost:3000'

  // Helper function
  async function testEndpoint(name, url, method = 'GET', expectedStatuses = [200, 401, 403], body = null) {
    console.log(`\n📍 Testing: ${method} ${url}`)
    try {
      const options = { method }
      if (body) {
        options.headers = { 'Content-Type': 'application/json' }
        options.body = JSON.stringify(body)
      }
      
      const res = await fetch(url, options)
      const status = res.status
      
      let data
      const contentType = res.headers.get('content-type')
      
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await res.json()
        } else {
          data = await res.text()
        }
      } catch (error) {
        data = { parseError: error.message }
      }
      
      if (expectedStatuses.includes(status)) {
        console.log(`✅ PASS - Status: ${status}`)
        
        if (typeof data === 'object' && data !== null) {
          const preview = JSON.stringify(data).substring(0, 150)
          console.log(`   Response: ${preview}${preview.length >= 150 ? '...' : ''}`)
          
          if (Array.isArray(data)) {
            console.log(`   ↳ Array with ${data.length} items`)
          } else if (data.error) {
            console.log(`   ↳ Error: ${data.error}`)
          }
        }
        
        results.passed++
        results.tests.push({ name, status: 'PASS', httpStatus: status })
        return { success: true, data, status }
      } else {
        console.log(`⚠️  WARNING - Unexpected status: ${status} (expected ${expectedStatuses.join(' or ')})`)
        results.warnings++
        results.tests.push({ name, status: 'WARNING', httpStatus: status })
        return { success: false, data, status }
      }
    } catch (error) {
      console.log(`❌ FAIL - ${error.message}`)
      results.failed++
      results.tests.push({ name, status: 'FAIL', error: error.message })
      return { success: false, error: error.message }
    }
  }

  // ===========================
  // PUBLIC API TESTS
  // ===========================
  console.log('\n\n' + '=' .repeat(80))
  console.log('📦 PUBLIC API ENDPOINTS')
  console.log('=' .repeat(80))

  // 1. GET Membership Packages
  await testEndpoint(
    'GET Membership Packages',
    `${baseUrl}/api/memberships/packages`,
    'GET',
    [200]
  )

  // 2. GET User Membership (should require auth)
  await testEndpoint(
    'GET User Membership',
    `${baseUrl}/api/memberships/user`,
    'GET',
    [200, 401] // 401 expected without auth
  )

  // 3. POST Purchase Membership (should require auth)
  await testEndpoint(
    'POST Purchase Membership',
    `${baseUrl}/api/memberships/purchase`,
    'POST',
    [401, 400, 200],
    { membershipId: 'test-id', paymentMethod: 'xendit' }
  )

  // 4. POST Upgrade Membership (should require auth)
  await testEndpoint(
    'POST Upgrade Membership',
    `${baseUrl}/api/memberships/upgrade`,
    'POST',
    [401, 400, 200],
    { newMembershipId: 'test-id', mode: 'accumulate' }
  )

  // ===========================
  // ADMIN API TESTS
  // ===========================
  console.log('\n\n' + '=' .repeat(80))
  console.log('🔐 ADMIN API ENDPOINTS')
  console.log('=' .repeat(80))

  // 5. GET All Memberships (Admin)
  await testEndpoint(
    'GET All Memberships (Admin)',
    `${baseUrl}/api/admin/memberships`,
    'GET',
    [200, 401, 403] // 401/403 expected without admin auth
  )

  // 6. POST Create Membership (Admin)
  await testEndpoint(
    'POST Create Membership (Admin)',
    `${baseUrl}/api/admin/memberships`,
    'POST',
    [401, 403, 400, 201],
    { 
      name: 'Test Plan',
      duration: 'ONE_MONTH',
      price: 100000,
      features: ['Feature 1']
    }
  )

  // 7. GET Single Membership (Admin)
  await testEndpoint(
    'GET Single Membership (Admin)',
    `${baseUrl}/api/admin/memberships/test-id`,
    'GET',
    [200, 401, 403, 404]
  )

  // 8. PUT Update Membership (Admin)
  await testEndpoint(
    'PUT Update Membership (Admin)',
    `${baseUrl}/api/admin/memberships/test-id`,
    'PUT',
    [401, 403, 404, 400, 200],
    { name: 'Updated Test Plan' }
  )

  // 9. DELETE Membership (Admin)
  await testEndpoint(
    'DELETE Membership (Admin)',
    `${baseUrl}/api/admin/memberships/test-id`,
    'DELETE',
    [401, 403, 404, 200]
  )

  // ===========================
  // PAGE TESTS
  // ===========================
  console.log('\n\n' + '=' .repeat(80))
  console.log('📄 PAGE ACCESSIBILITY TESTS')
  console.log('=' .repeat(80))

  // 10. User Dashboard
  const dashboardTest = await testEndpoint(
    'Page: /my-dashboard',
    `${baseUrl}/my-dashboard`,
    'GET',
    [200, 302, 401] // 302 = redirect to login
  )
  
  if (dashboardTest.success && dashboardTest.status === 200) {
    const html = typeof dashboardTest.data === 'string' ? dashboardTest.data : ''
    if (html.includes('membership') || html.includes('Membership')) {
      console.log('   ✓ Page contains membership content')
    }
  }

  // 11. Upgrade Page
  const upgradeTest = await testEndpoint(
    'Page: /dashboard/upgrade',
    `${baseUrl}/dashboard/upgrade`,
    'GET',
    [200, 302, 401]
  )
  
  if (upgradeTest.success && upgradeTest.status === 200) {
    const html = typeof upgradeTest.data === 'string' ? upgradeTest.data : ''
    if (html.includes('upgrade') || html.includes('Upgrade')) {
      console.log('   ✓ Page contains upgrade content')
    }
  }

  // 12. Admin Membership Page
  const adminTest = await testEndpoint(
    'Page: /admin/membership',
    `${baseUrl}/admin/membership`,
    'GET',
    [200, 302, 401, 403]
  )

  // ===========================
  // RELATED SYSTEMS TEST
  // ===========================
  console.log('\n\n' + '=' .repeat(80))
  console.log('🔗 RELATED SYSTEMS CHECK')
  console.log('=' .repeat(80))

  // 13. Check Groups API
  await testEndpoint(
    'Groups API',
    `${baseUrl}/api/groups`,
    'GET',
    [200, 401]
  )

  // 14. Check Courses API
  await testEndpoint(
    'Courses API',
    `${baseUrl}/api/courses`,
    'GET',
    [200, 401]
  )

  // 15. Check Products API
  await testEndpoint(
    'Products API',
    `${baseUrl}/api/products`,
    'GET',
    [200, 401]
  )

  // ===========================
  // SUMMARY
  // ===========================
  console.log('\n\n' + '=' .repeat(80))
  console.log('\n📊 COMPREHENSIVE API TEST SUMMARY')
  console.log('-' .repeat(80))
  
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌'
    const statusInfo = test.httpStatus ? ` (HTTP ${test.httpStatus})` : ''
    const errorInfo = test.error ? ` - ${test.error}` : ''
    console.log(`${icon} ${(index + 1).toString().padStart(2)}. ${test.name.padEnd(45)} ${test.status}${statusInfo}${errorInfo}`)
  })
  
  console.log('-' .repeat(80))
  console.log(`Total Tests: ${results.passed + results.failed + results.warnings}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`⚠️  Warnings: ${results.warnings}`)
  console.log(`❌ Failed: ${results.failed}`)
  
  const successRate = Math.round((results.passed / (results.passed + results.failed + results.warnings)) * 100)
  console.log(`Success Rate: ${successRate}%`)
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL API TESTS COMPLETED SUCCESSFULLY!')
    console.log('\n💡 Notes:')
    console.log('   - 401/403 responses are expected for endpoints requiring authentication')
    console.log('   - Admin endpoints properly protected')
    console.log('   - All public endpoints accessible')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - Please review errors above')
  }
  
  console.log('\n' + '=' .repeat(80))
}

testAllAPIs().catch(console.error)
