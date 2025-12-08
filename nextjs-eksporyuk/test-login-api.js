// Test login directly via API
async function testDirectLogin() {
  const email = 'admin@eksporyuk.com'
  const password = 'password123'
  
  console.log('🔍 Testing direct login POST...\n')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}\n`)
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email,
        password,
        callbackUrl: '/dashboard',
        json: 'true'
      }).toString(),
    })
    
    console.log(`Status: ${response.status}`)
    console.log(`Status Text: ${response.statusText}\n`)
    
    const text = await response.text()
    console.log('Response:')
    console.log(text.substring(0, 500))
    
    if (response.ok) {
      console.log('\n✅ Login API works!')
    } else {
      console.log('\n❌ Login failed!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testDirectLogin()
