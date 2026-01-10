console.log('=== CEK DETAIL PERBAIKAN E-WALLET ===\n')

// Test actual function behavior
function testNormalizePhoneNumber() {
  console.log('1. TEST NORMALISASI LANGSUNG:')
  
  // Simulate the exact function from ewallet-service.ts
  function normalizePhoneNumber(phone) {
    // Remove all non-digits first
    let normalized = phone.replace(/\D/g, '')
    
    // Handle empty or too short numbers
    if (!normalized || normalized.length < 10) {
      return normalized
    }
    
    // For Indonesian mobile numbers starting with 0, keep original format
    // E-wallets work with 08xxx format, not 62xxx
    if (normalized.startsWith('0') && normalized.length >= 11 && normalized.charAt(1) === '8') {
      return normalized  // Keep 08118748177 as is
    }
    
    // If starts with +62, convert to 08xxx format
    if (normalized.startsWith('62') && normalized.length >= 12 && normalized.charAt(2) === '8') {
      return '0' + normalized.substring(2)  // 628118748177 → 08118748177
    }
    
    // If it's just 8xxx format, add 0
    if (normalized.startsWith('8') && normalized.length >= 10) {
      return '0' + normalized  // 8118748177 → 08118748177
    }
    
    return normalized
  }

  const testCases = [
    '08118748177',    // Yang bermasalah
    '8118748177',     
    '628118748177',   
    '+628118748177',
    '0811-8748-177',  // Dengan tanda hubung
    '0811 8748 177'   // Dengan spasi
  ]

  testCases.forEach(input => {
    const result = normalizePhoneNumber(input)
    const status = result === '08118748177' ? '✅' : '❌'
    console.log(`   ${status} Input: "${input}" → Output: "${result}"`)
  })
}

function testMockData() {
  console.log('\n2. TEST MOCK DATA AVAILABILITY:')
  
  const mockAccounts = {
    'DANA': {
      '08123456789': 'Charlie Brown',
      '08987654321': 'Diana Prince',
      '08111222333': 'Erik Johnson',
      '08118748177': 'Aziz Rahman',  // HARUS ADA!
      '081187481771': 'Aziz Rahman',
      '081187481772': 'Rahman Aziz',
      '08112345678': 'Test User DANA',
      '08551234567': 'Demo DANA',
      '08811223344': 'Sample DANA',
      // Keep 62xxx for backward compatibility
      '628123456789': 'Charlie Brown',
      '628987654321': 'Diana Prince',
      '628111222333': 'Erik Johnson',
      '628118748177': 'Aziz Rahman',
      '6281187481771': 'Aziz Rahman',
      '6281187481772': 'Rahman Aziz'
    }
  }

  const targetNumber = '08118748177'
  const danaAccount = mockAccounts['DANA'][targetNumber]
  
  console.log(`   Cari: DANA["${targetNumber}"]`)
  console.log(`   Hasil: ${danaAccount || 'TIDAK DITEMUKAN'}`)
  
  if (danaAccount) {
    console.log(`   ✅ DANA account found: "${danaAccount}"`)
  } else {
    console.log(`   ❌ DANA account NOT FOUND!`)
    console.log('\n   Available DANA numbers:')
    Object.keys(mockAccounts['DANA']).forEach(num => {
      if (num.startsWith('08')) {
        console.log(`      - ${num}: ${mockAccounts['DANA'][num]}`)
      }
    })
  }
}

function testCompleteFlow() {
  console.log('\n3. TEST COMPLETE FLOW:')
  console.log('   Input: 08118748177 untuk DANA')
  
  // Step 1: Normalize
  const input = '08118748177'
  const normalized = input.replace(/\D/g, '') // Remove non-digits
  console.log(`   Step 1 - Clean: "${input}" → "${normalized}"`)
  
  // Step 2: Check normalization logic
  let finalNumber = normalized
  if (normalized.startsWith('0') && normalized.length >= 11 && normalized.charAt(1) === '8') {
    finalNumber = normalized  // Keep as is
  }
  console.log(`   Step 2 - Normalize: "${normalized}" → "${finalNumber}"`)
  
  // Step 3: Mock lookup
  const mockResult = {
    '08118748177': 'Aziz Rahman'
  }[finalNumber]
  
  console.log(`   Step 3 - Mock Lookup: DANA["${finalNumber}"] = "${mockResult || 'NOT FOUND'}"`)
  
  if (mockResult) {
    console.log(`   ✅ FINAL RESULT: Account found - "${mockResult}"`)
  } else {
    console.log(`   ❌ FINAL RESULT: Account NOT found!`)
  }
}

function checkPotentialIssues() {
  console.log('\n4. CEK POTENSI MASALAH:')
  
  // Cek apakah ada case yang terlewat
  const problematicInputs = [
    '08118748177',    // Original issue
    '8118748177',     // Missing 0
    '628118748177',   // Wrong format
    '+62 811 8748 177', // International with spaces
    '62-811-8748-177', // With dashes
  ]
  
  console.log('   Testing edge cases:')
  problematicInputs.forEach(input => {
    const cleaned = input.replace(/\D/g, '')
    const isValid = cleaned.length >= 10
    const startsWithZero = cleaned.startsWith('0')
    const startsWithEight = cleaned.charAt(1) === '8'
    
    console.log(`   - "${input}" → cleaned: "${cleaned}"`)
    console.log(`     Valid length: ${isValid}, Starts 0: ${startsWithZero}, Second digit 8: ${startsWithEight}`)
    
    if (startsWithZero && isValid && startsWithEight) {
      console.log(`     ✅ Would keep as: "${cleaned}"`)
    } else {
      console.log(`     ⚠️ Needs transformation`)
    }
  })
}

// Run all tests
testNormalizePhoneNumber()
testMockData()
testCompleteFlow()
checkPotentialIssues()

console.log('\n=== KESIMPULAN ===')
console.log('Mari cek apakah ada yang missed dari implementasi aktual...')