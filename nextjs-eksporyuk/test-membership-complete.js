// Test suite untuk membership system
// Menggunakan built-in fetch (Node 18+)

async function testMembershipSystem() {
  console.log('🧪 TESTING MEMBERSHIP SYSTEM\n')
  console.log('=' .repeat(80))
  
  const tests = []
  
  // Test 1: API Memberships User
  console.log('\n📍 Test 1: GET /api/memberships/user')
  try {
    const res = await fetch('http://localhost:3000/api/memberships/user')
    const status = res.status
    const data = await res.json()
    
    if (status === 401) {
      console.log('✅ PASS - Unauthorized (expected, no session)')
      tests.push({ name: 'API /memberships/user', status: 'PASS', note: 'Auth working' })
    } else if (status === 200) {
      console.log(`✅ PASS - Status: ${status}`)
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`)
      tests.push({ name: 'API /memberships/user', status: 'PASS', note: 'API working' })
    } else {
      console.log(`⚠️  WARNING - Unexpected status: ${status}`)
      tests.push({ name: 'API /memberships/user', status: 'WARNING', note: `Status ${status}` })
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    tests.push({ name: 'API /memberships/user', status: 'FAIL', note: error.message })
  }
  
  // Test 2: Page My Dashboard
  console.log('\n📍 Test 2: GET /my-dashboard')
  try {
    const res = await fetch('http://localhost:3000/my-dashboard')
    const status = res.status
    const text = await res.text()
    
    if (status === 200) {
      console.log(`✅ PASS - Status: ${status}`)
      console.log(`   Page size: ${text.length} bytes`)
      
      // Check for key elements
      if (text.includes('My Membership') || text.includes('my-dashboard')) {
        console.log('   ✓ Contains membership content')
        tests.push({ name: 'Page /my-dashboard', status: 'PASS', note: 'Page renders' })
      } else {
        console.log('   ⚠️  Missing expected content')
        tests.push({ name: 'Page /my-dashboard', status: 'WARNING', note: 'Content missing' })
      }
    } else {
      console.log(`⚠️  WARNING - Status: ${status}`)
      tests.push({ name: 'Page /my-dashboard', status: 'WARNING', note: `Status ${status}` })
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    tests.push({ name: 'Page /my-dashboard', status: 'FAIL', note: error.message })
  }
  
  // Test 3: Page Upgrade
  console.log('\n📍 Test 3: GET /dashboard/upgrade')
  try {
    const res = await fetch('http://localhost:3000/dashboard/upgrade')
    const status = res.status
    const text = await res.text()
    
    if (status === 200) {
      console.log(`✅ PASS - Status: ${status}`)
      console.log(`   Page size: ${text.length} bytes`)
      
      // Check for key elements
      if (text.includes('Upgrade') || text.includes('Membership')) {
        console.log('   ✓ Contains upgrade content')
        tests.push({ name: 'Page /dashboard/upgrade', status: 'PASS', note: 'Page renders' })
      } else {
        console.log('   ⚠️  Missing expected content')
        tests.push({ name: 'Page /dashboard/upgrade', status: 'WARNING', note: 'Content missing' })
      }
    } else {
      console.log(`⚠️  WARNING - Status: ${status}`)
      tests.push({ name: 'Page /dashboard/upgrade', status: 'WARNING', note: `Status ${status}` })
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    tests.push({ name: 'Page /dashboard/upgrade', status: 'FAIL', note: error.message })
  }
  
  // Test 4: API Memberships Packages
  console.log('\n📍 Test 4: GET /api/memberships/packages')
  try {
    const res = await fetch('http://localhost:3000/api/memberships/packages')
    const status = res.status
    const data = await res.json()
    
    if (status === 200) {
      console.log(`✅ PASS - Status: ${status}`)
      console.log(`   Packages found: ${data.packages?.length || 0}`)
      
      if (data.packages && data.packages.length > 0) {
        console.log(`   First package: ${data.packages[0].name}`)
        tests.push({ name: 'API /memberships/packages', status: 'PASS', note: `${data.packages.length} packages` })
      } else {
        tests.push({ name: 'API /memberships/packages', status: 'WARNING', note: 'No packages found' })
      }
    } else {
      console.log(`❌ FAIL - Status: ${status}`)
      tests.push({ name: 'API /memberships/packages', status: 'FAIL', note: `Status ${status}` })
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    tests.push({ name: 'API /memberships/packages', status: 'FAIL', note: error.message })
  }
  
  // Test 5: Admin Membership Page
  console.log('\n📍 Test 5: GET /admin/membership')
  try {
    const res = await fetch('http://localhost:3000/admin/membership')
    const status = res.status
    const text = await res.text()
    
    if (status === 200) {
      console.log(`✅ PASS - Status: ${status}`)
      console.log(`   Page size: ${text.length} bytes`)
      tests.push({ name: 'Page /admin/membership', status: 'PASS', note: 'Page accessible' })
    } else {
      console.log(`⚠️  WARNING - Status: ${status}`)
      tests.push({ name: 'Page /admin/membership', status: 'WARNING', note: `Status ${status}` })
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    tests.push({ name: 'Page /admin/membership', status: 'FAIL', note: error.message })
  }
  
  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 TEST SUMMARY')
  console.log('-'.repeat(80))
  
  const passed = tests.filter(t => t.status === 'PASS').length
  const warned = tests.filter(t => t.status === 'WARNING').length
  const failed = tests.filter(t => t.status === 'FAIL').length
  
  tests.forEach((test, idx) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️ ' : '❌'
    console.log(`${icon} ${idx + 1}. ${test.name.padEnd(35)} - ${test.status.padEnd(10)} (${test.note})`)
  })
  
  console.log('\n' + '-'.repeat(80))
  console.log(`Total Tests: ${tests.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`⚠️  Warnings: ${warned}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${Math.round((passed / tests.length) * 100)}%`)
  
  if (failed === 0 && warned === 0) {
    console.log('\n🎉 ALL TESTS PASSED!')
  } else if (failed === 0) {
    console.log('\n✅ All critical tests passed (some warnings)')
  } else {
    console.log('\n⚠️  Some tests failed - review above')
  }
  
  console.log('\n' + '='.repeat(80))
}

testMembershipSystem().catch(console.error)
