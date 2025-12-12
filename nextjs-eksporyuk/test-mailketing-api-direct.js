const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testMailketingAPI() {
  console.log('\n🧪 TESTING MAILKETING API DIRECTLY\n')
  
  try {
    // Get config from database
    const config = await prisma.integrationConfig.findUnique({
      where: { service: 'mailketing' }
    })
    
    if (!config) {
      console.log('❌ No Mailketing config found')
      return
    }
    
    const apiKey = config.config.MAILKETING_API_KEY
    const fromEmail = config.config.MAILKETING_SENDER_EMAIL || 'noreply@eksporyuk.com'
    const fromName = config.config.MAILKETING_SENDER_NAME || 'EksporYuk'
    
    console.log('📋 Configuration:')
    console.log('   API Key:', apiKey.substring(0, 20) + '...')
    console.log('   From Email:', fromEmail)
    console.log('   From Name:', fromName)
    
    // Test email
    const testEmail = 'test@example.com'
    const subject = 'Test Email dari EksporYuk'
    const content = '<h1>Test Email</h1><p>Ini adalah test email dari sistem EksporYuk.</p>'
    
    console.log('\n📤 Sending test email...')
    console.log('   To:', testEmail)
    console.log('   Subject:', subject)
    
    // Use correct Mailketing API format
    const params = new URLSearchParams()
    params.append('api_token', apiKey)
    params.append('recipient', testEmail)
    params.append('content', content)
    params.append('from_email', fromEmail)
    params.append('from_name', fromName)
    
    const apiUrl = 'https://api.mailketing.co.id/api/v1/send'
    
    console.log('\n🌐 API Request:')
    console.log('   URL:', apiUrl)
    console.log('   Method: POST')
    console.log('   Content-Type: application/x-www-form-urlencoded')
    console.log('   Body params:', ['api_token', 'recipient', 'content', 'from_email', 'from_name'])
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })
    
    console.log('\n📥 API Response:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   Content-Type:', response.headers.get('content-type'))
    
    const responseText = await response.text()
    console.log('   Body:', responseText.substring(0, 500))
    
    if (response.ok) {
      console.log('\n✅ EMAIL SENT SUCCESSFULLY!')
      try {
        const jsonResponse = JSON.parse(responseText)
        console.log('   Message ID:', jsonResponse.message_id || jsonResponse.id || 'N/A')
      } catch (e) {
        // Non-JSON response
      }
    } else {
      console.log('\n❌ EMAIL FAILED TO SEND')
      console.log('   Error:', responseText)
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  }
  
  await prisma.$disconnect()
}

testMailketingAPI().catch(console.error)
