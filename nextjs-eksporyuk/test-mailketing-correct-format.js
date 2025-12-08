/**
 * Test Mailketing API with CORRECT format
 * Based on working getLists() implementation
 */

const API_KEY = '4e6b07c547b3de9981dfe432569995ab'

async function testMailketingSend() {
  console.log('🚀 Testing Mailketing Send Email API')
  console.log('=' .repeat(60))
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`)
  console.log('Format: application/x-www-form-urlencoded')
  console.log('Parameter: api_token (not x-api-key or Authorization)')
  console.log('=' .repeat(60))

  const url = 'https://api.mailketing.co.id/api/v1/send'
  
  const formData = new URLSearchParams({
    api_token: API_KEY,
    from_email: 'admin@eksporyuk.com',
    from_name: 'EksporYuk Test',
    to: 'abdurrahmanaziz.92@gmail.com',
    subject: 'Test Email dari EksporYuk - Real Test',
    html: '<h1>Test Email</h1><p>Ini adalah test email REAL dari sistem EksporYuk.</p><p>Jika kamu menerima email ini, berarti API Mailketing berfungsi!</p>'
  })

  console.log('\n📧 Sending email...')
  console.log('   To: abdurrahmanaziz.92@gmail.com')
  console.log('   From: admin@eksporyuk.com')
  console.log('   Subject: Test Email dari EksporYuk - Real Test')

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    const contentType = response.headers.get('content-type')
    console.log('\n📥 Response:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   Content-Type:', contentType)

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log('   Data:', JSON.stringify(data, null, 2))

      if (data.status === 'success') {
        console.log('\n✅ SUCCESS! Email terkirim!')
        console.log('   Message ID:', data.message_id || data.id)
        console.log('   📬 Cek inbox: abdurrahmanaziz.92@gmail.com')
        return { success: true, data }
      } else if (data.status === 'failed') {
        console.log('\n❌ FAILED:', data.response || data.message)
        
        if (data.response?.includes('Invalid Token')) {
          console.log('\n💡 API Key invalid atau expired!')
          console.log('   Solusi:')
          console.log('   1. Login ke https://mailketing.co.id')
          console.log('   2. Generate API key baru')
          console.log('   3. Update MAILKETING_API_KEY di .env.local')
        }
        return { success: false, data }
      }
    } else {
      const text = await response.text()
      console.log('   ⚠️ Non-JSON response:', text.substring(0, 200))
      return { success: false, error: 'Non-JSON response' }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    return { success: false, error: error.message }
  }
}

// Run test
testMailketingSend().then(result => {
  console.log('\n' + '=' .repeat(60))
  if (result.success) {
    console.log('🎉 EMAIL TERKIRIM!')
    console.log('✅ Mailketing API berfungsi sempurna')
    console.log('📧 Gmail/Yahoo/email apapun bisa menerima')
  } else {
    console.log('⚠️ Email tidak terkirim')
    console.log('🔧 Perlu update API key')
  }
  console.log('=' .repeat(60))
}).catch(console.error)
