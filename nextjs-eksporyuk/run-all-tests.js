// Quick test runner - jalankan semua tests sekaligus
console.log('\n' + '='.repeat(80))
console.log('🚀 MEMBERSHIP SYSTEM - QUICK TEST SUITE')
console.log('='.repeat(80) + '\n')

const tests = [
  { name: 'Unit Tests', file: 'test-membership-complete.js', emoji: '🧪' },
  { name: 'Database Integration', file: 'test-integration-full.js', emoji: '🔍' },
  { name: 'API Comprehensive', file: 'test-api-comprehensive.js', emoji: '🌐' },
  { name: 'Feature Audit', file: 'audit-membership-features.js', emoji: '📊' }
]

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
}

async function runTests() {
  const { exec } = require('child_process')
  const util = require('util')
  const execPromise = util.promisify(exec)
  
  console.log('📝 Running tests...\n')
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    console.log(`${test.emoji} ${i + 1}/${tests.length} - ${test.name}`)
    console.log('-'.repeat(80))
    
    try {
      const { stdout } = await execPromise(`node ${test.file}`)
      
      // Parse results
      const passMatches = stdout.match(/✅ PASS|Passed: (\d+)/g) || []
      const failMatches = stdout.match(/❌ FAIL|Failed: (\d+)/g) || []
      const warnMatches = stdout.match(/⚠️\s+WARNING|Warnings: (\d+)/g) || []
      
      const passed = passMatches.length
      const failed = failMatches.length  
      const warnings = warnMatches.length
      
      console.log(`   Results: ${passed} passed, ${failed} failed, ${warnings} warnings`)
      
      results.total += (passed + failed + warnings)
      results.passed += passed
      results.failed += failed
      results.warnings += warnings
      
      if (failed === 0) {
        console.log('   ✅ All checks passed!\n')
      } else {
        console.log('   ⚠️ Some checks need attention\n')
      }
    } catch (error) {
      console.log(`   ❌ Error running test: ${error.message}\n`)
      results.failed++
    }
  }
  
  // Final summary
  console.log('='.repeat(80))
  console.log('\n📊 FINAL SUMMARY\n')
  console.log('-'.repeat(80))
  console.log(`Total Checks:    ${results.total}`)
  console.log(`✅ Passed:       ${results.passed} (${Math.round(results.passed/results.total*100)}%)`)
  console.log(`⚠️  Warnings:     ${results.warnings}`)
  console.log(`❌ Failed:       ${results.failed}`)
  console.log('-'.repeat(80))
  
  const successRate = Math.round((results.passed / results.total) * 100)
  
  if (successRate >= 90) {
    console.log('\n🎉 EXCELLENT! System is production-ready!')
  } else if (successRate >= 70) {
    console.log('\n✅ GOOD! System is functional with minor issues.')
  } else if (successRate >= 50) {
    console.log('\n⚠️  WARNING! System needs attention.')
  } else {
    console.log('\n❌ CRITICAL! System has major issues.')
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('💡 For detailed reports, check:')
  console.log('   - TEST_RESULTS_OPSI_B.md')
  console.log('   - FASE_A_COMPLETE.md')
  console.log('='.repeat(80) + '\n')
}

runTests().catch(console.error)
