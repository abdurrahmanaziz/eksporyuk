async function testForgotPasswordAPI() {
  console.log('\n🔐 TESTING FORGOT PASSWORD API ENDPOINT\n')
  
  const email = 'founder@eksporyuk.com' // Admin email from database
  
  console.log('📧 Testing with email:', email)
  console.log('�� Calling API: POST /api/auth/forgot-password-v2')
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/forgot-password-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    })
    
    const contentType = response.headers.get('content-type')
    console.log('\n📥 Response:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   Content-Type:', contentType)
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log('   Body:', JSON.stringify(data, null, 2))
      
      if (response.ok) {
        console.log('\n✅ API CALL SUCCESSFUL!')
        console.log('   Message:', data.message)
        console.log('\n📬 Check email inbox:', email)
      } else {
        console.log('\n❌ API RETURNED ERROR')
      }
    } else {
      const text = await response.text()
      console.log('   Body (text):', text.substring(0, 500))
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message)
    console.error('\n⚠️  Make sure dev server is running:')
    console.error('   cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk')
    console.error('   npm run dev')
  }
}

testForgotPasswordAPI().catch(console.error)
