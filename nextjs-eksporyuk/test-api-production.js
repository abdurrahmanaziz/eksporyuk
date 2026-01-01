// Test the actual API endpoint on production
const fetch = require('node-fetch')

async function testProductionAPI() {
  console.log('🌐 Testing production API: https://eksporyuk.com/api/affiliate/links/smart-generate\n')
  
  console.log('⚠️  NOTE: This will test WITHOUT authentication')
  console.log('   Expected: Should return 401 Unauthorized\n')
  
  try {
    const response = await fetch('https://eksporyuk.com/api/affiliate/links/smart-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetType: 'membership',
        targetItems: [],
        couponId: null
      })
    })
    
    const status = response.status
    const data = await response.json()
    
    console.log('📊 Response Status:', status)
    console.log('📦 Response Body:', JSON.stringify(data, null, 2))
    
    if (status === 401) {
      console.log('\n✅ API is working - correctly rejecting unauthenticated requests')
      console.log('\n💡 Next: User needs to test with actual login in browser')
      console.log('   Steps:')
      console.log('   1. Login ke https://eksporyuk.com/auth/login')
      console.log('   2. Email: azizbiasa@gmail.com')
      console.log('   3. Buka /affiliate/links')
      console.log('   4. Click tab "Generate Link"')
      console.log('   5. Select "Membership"')
      console.log('   6. Click "Generate Semua Link!"')
      console.log('   7. Buka browser DevTools Console (F12)')
      console.log('   8. Lihat error message yang muncul')
    } else {
      console.log('\n⚠️  Unexpected status code')
    }
    
  } catch (error) {
    console.error('❌ Error calling API:', error.message)
  }
}

testProductionAPI()
