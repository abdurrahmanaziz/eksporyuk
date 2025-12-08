const API_KEY = '4e6b07c547b3de9981dfe432569995ab'

async function testFinalFormat() {
  console.log('🚀 FINAL TEST - Mailketing Email Send')
  console.log('=' .repeat(60))

  const formData = new URLSearchParams({
    api_token: API_KEY,
    from_email: 'admin@eksporyuk.com',
    from_name: 'EksporYuk',
    recipient: 'abdurrahmanaziz.92@gmail.com',
    subject: 'Test Email REAL dari EksporYuk',
    content: '<h1>Test Berhasil!</h1><p>Email ini dikirim dari sistem EksporYuk.</p><p>Jika kamu menerima ini, API Mailketing berfungsi!</p>'
  })

  console.log('\n📧 Sending to:', 'abdurrahmanaziz.92@gmail.com')
  console.log('📝 Parameters:')
  console.log('   - api_token: ✅')
  console.log('   - from_email: admin@eksporyuk.com')  
  console.log('   - from_name: EksporYuk')
  console.log('   - recipient: abdurrahmanaziz.92@gmail.com')
  console.log('   - subject: Test Email REAL dari EksporYuk')
  console.log('   - content: HTML content')

  try {
    const response = await fetch('https://api.mailketing.co.id/api/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    })

    const data = await response.json()
    
    console.log('\n📥 Response:')
    console.log(JSON.stringify(data, null, 2))

    if (data.status === 'success') {
      console.log('\n✅✅✅ EMAIL TERKIRIM! ✅✅✅')
      console.log('🎉 Mailketing API berfungsi sempurna!')
      console.log('📬 Cek inbox: abdurrahmanaziz.92@gmail.com')
      console.log('📧 Gmail, Yahoo, email apapun bisa menerima!')
      return true
    } else {
      console.log('\n❌ Failed:', data.response || data.message)
      return false
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    return false
  }
}

testFinalFormat()
