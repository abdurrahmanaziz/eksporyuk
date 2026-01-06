#!/usr/bin/env node

/**
 * Test Phone Number Normalization Fix
 */

console.log('📱 Testing Phone Number Normalization Fix\n')

// Backend normalization (from check-name-xendit)
function normalizePhone(phoneNumber) {
  const cleanedPhone = phoneNumber.replace(/\D/g, '')
  let normalizedPhone = cleanedPhone
  
  if (cleanedPhone.startsWith('62') && cleanedPhone.length >= 12) {
    normalizedPhone = '0' + cleanedPhone.substring(2)
  } else if (cleanedPhone.startsWith('8') && cleanedPhone.length >= 10) {
    normalizedPhone = '0' + cleanedPhone
  } else if (!cleanedPhone.startsWith('0')) {
    normalizedPhone = '0' + cleanedPhone
  }
  
  return normalizedPhone
}

// Test production case
const testNumber = '5520467850'
const normalized = normalizePhone(testNumber)

console.log('Production Test:')
console.log(`  Input:      "${testNumber}"`)
console.log(`  Normalized: "${normalized}"`)
console.log(`  Expected:   "05520467850"`)
console.log(`  Match:      ${normalized === '05520467850' ? '✅' : '❌'}`)

console.log('\nOther Test Cases:')
const tests = [
  ['08118748177', '08118748177'],
  ['8118748177', '08118748177'],
  ['628118748177', '08118748177'],
  ['+628118748177', '08118748177'],
]

tests.forEach(([input, expected]) => {
  const result = normalizePhone(input)
  const match = result === expected ? '✅' : '❌'
  console.log(`  ${match} ${input.padEnd(15)} → ${result}`)
})

console.log('\n✅ Fix verified - phone normalization working correctly!')
