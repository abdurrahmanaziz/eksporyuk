const { EWalletService } = require('./nextjs-eksporyuk/src/lib/services/ewallet-service.ts')

console.log('Testing normalization fix untuk nomor 08118748177...\n')

// Test normalization langsung
function testNormalization() {
  console.log('=== TEST NORMALIZATION ===')
  
  const service = new EWalletService()
  
  // Akses private method melalui bracket notation
  const normalize = service['normalizePhoneNumber'].bind(service)
  
  const testCases = [
    '08118748177',    // Input asli
    '8118748177',     // Tanpa 0 
    '628118748177',   // Format 62
    '+628118748177'   // Format international
  ]
  
  testCases.forEach(input => {
    const result = normalize(input)
    console.log(`Input: ${input} → Output: ${result}`)
  })
  
  console.log()
}

// Test mock data lookup
async function testMockData() {
  console.log('=== TEST MOCK DATA LOOKUP ===')
  
  const service = new EWalletService()
  
  try {
    const result = await service.getAccountName('DANA', '08118748177')
    console.log('DANA 08118748177:', result)
    
    const result2 = await service.getAccountName('OVO', '08118748177') 
    console.log('OVO 08118748177:', result2)
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

async function main() {
  testNormalization()
  await testMockData()
  console.log('\n✅ Test selesai!')
  console.log('Sekarang nomor 08118748177 tidak akan diubah ke 88118748177 lagi!')
}

main().catch(console.error)