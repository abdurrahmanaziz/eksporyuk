/**
 * Test Mailketing API Direct
 * Test langsung ke Mailketing API tanpa melalui wrapper
 */

const MAILKETING_API_KEY = '4e6b07c547b3de9981dfe432569995ab'
const MAILKETING_API_URL = 'https://api.mailketing.co.id/api/v1/send'

async function testMailketingDirect() {
  console.log('🧪 Testing Mailketing API Direct...\n')

  const testEmail = 'azizbiasa@gmail.com'
  const testSubject = '🧪 Test Email dari EksporYuk - ' + new Date().toLocaleTimeString()
  const testContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>🧪 Test Email</h2>
      <p>Ini adalah test email dari sistem EksporYuk.</p>
      <p>Waktu: ${new Date().toLocaleString('id-ID')}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        Email ini dikirim untuk testing integrasi Mailketing.
      </p>
    </div>
  `

  console.log('📧 Sending test email...')
  console.log('   To:', testEmail)
  console.log('   Subject:', testSubject)
  console.log('   API Key:', MAILKETING_API_KEY.substring(0, 8) + '...')
  console.log('')

  try {
    const formData = new URLSearchParams({
      api_token: MAILKETING_API_KEY,
      from_email: 'noreply@eksporyuk.com',
      from_name: 'EksporYuk Test',
      recipient: testEmail,
      subject: testSubject,
      content: testContent
    })

    console.log('📤 Making request to:', MAILKETING_API_URL)
    
    const response = await fetch(MAILKETING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    })

    console.log('📥 Response status:', response.status, response.statusText)
    
    const contentType = response.headers.get('content-type')
    console.log('📥 Content-Type:', contentType)
    console.log('')

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log('📦 Response data:', JSON.stringify(data, null, 2))
      
      if (data.status === 'success') {
        console.log('\n✅ EMAIL SENT SUCCESSFULLY!')
        console.log('   Check inbox:', testEmail)
      } else if (data.status === 'failed' || data.status === 'error') {
        console.log('\n❌ EMAIL FAILED!')
        console.log('   Error:', data.response || data.message)
        
        if (data.response && data.response.includes('Invalid Token')) {
          console.log('\n💡 SOLUTION:')
          console.log('   1. Login ke Mailketing dashboard: https://mailketing.co.id')
          console.log('   2. Pergi ke Settings → API')
          console.log('   3. Copy API token yang valid')
          console.log('   4. Update MAILKETING_API_KEY di .env.local')
        }
      }
    } else {
      const text = await response.text()
      console.log('📄 Response (HTML/Text):', text.substring(0, 500))
      console.log('\n⚠️  API returned non-JSON response (likely HTML page)')
      console.log('    This usually means:')
      console.log('    - API endpoint is wrong')
      console.log('    - API key is invalid')
      console.log('    - Request format is incorrect')
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('   Stack:', error.stack)
  }
}

// Run test
testMailketingDirect()
