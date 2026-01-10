const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testWithSubject() {
  console.log('\n📧 TESTING EMAIL WITH SUBJECT\n')
  
  try {
    const config = await prisma.integrationConfig.findUnique({
      where: { service: 'mailketing' }
    })
    
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    const apiKey = config.config.MAILKETING_API_KEY
    const fromEmail = config.config.MAILKETING_SENDER_EMAIL
    const fromName = config.config.MAILKETING_SENDER_NAME
    
    console.log('📤 Sending email to:', admin.email)
    
    const params = new URLSearchParams()
    params.append('api_token', apiKey)
    params.append('recipient', admin.email)
    params.append('subject', '✅ Test Email - EksporYuk')  // ADDED SUBJECT
    params.append('content', '<h1>Test Email Berhasil!</h1><p>Email system siap digunakan.</p>')
    params.append('from_email', fromEmail)
    params.append('from_name', fromName)
    
    const response = await fetch('https://api.mailketing.co.id/api/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })
    
    const responseText = await response.text()
    console.log('📥 Status:', response.status)
    console.log('📥 Response:', responseText)
    
    if (response.ok) {
      const json = JSON.parse(responseText)
      if (json.status === 'success' || json.response === 'success') {
        console.log('\n✅ EMAIL SENT SUCCESSFULLY!')
        console.log('�� Check inbox:', admin.email)
      } else {
        console.log('\n⚠️  API returned:', json)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
  
  await prisma.$disconnect()
}

testWithSubject().catch(console.error)
