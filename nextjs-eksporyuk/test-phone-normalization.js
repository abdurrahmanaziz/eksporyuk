console.log('Testing normalization fix untuk nomor 08118748177...\n')

// Simulate the normalizePhoneNumber logic
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

console.log('=== TEST NORMALIZATION LOGIC ===')

const testCases = [
  '08118748177',    // Input asli - HARUS TETAP 08118748177
  '8118748177',     // Tanpa 0 - HARUS JADI 08118748177
  '628118748177',   // Format 62 - HARUS JADI 08118748177
  '+628118748177'   // Format international - HARUS JADI 08118748177
]

testCases.forEach(input => {
  const result = normalizePhoneNumber(input)
  console.log(`Input: ${input.padEnd(15)} → Output: ${result}`)
})

console.log('\n=== MOCK DATA TEST ===')

const mockAccounts = {
  'DANA': {
    '08118748177': 'Aziz Rahman',  // Ini yang dicari!
  }
}

const normalizedNumber = normalizePhoneNumber('08118748177')
const accountName = mockAccounts['DANA'][normalizedNumber]

console.log(`Normalized: ${normalizedNumber}`)
console.log(`DANA Account Found: ${accountName || 'TIDAK DITEMUKAN'}`)

if (accountName) {
  console.log('\n✅ SUCCESS! Nomor 08118748177 sekarang ditemukan di DANA!')
} else {
  console.log('\n❌ FAIL! Nomor masih tidak ditemukan.')
}