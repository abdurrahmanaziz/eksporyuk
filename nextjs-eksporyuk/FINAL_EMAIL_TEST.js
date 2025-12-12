const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function finalEmailTest() {
  console.log('\n' + '='.repeat(70))
  console.log('📧 FINAL COMPREHENSIVE EMAIL SYSTEM TEST')
  console.log('='.repeat(70) + '\n')
  
  try {
    // Step 1: Get Mailketing config
    console.log('1️⃣ Checking Mailketing Configuration...\n')
    const config = await prisma.integrationConfig.findUnique({
      where: { service: 'mailketing' }
    })
    
    if (!config) {
      console.log('❌ Mailketing config not found in database')
      return
    }
    
    const apiKey = config.config.MAILKETING_API_KEY
    const fromEmail = config.config.MAILKETING_SENDER_EMAIL
    const fromName = config.config.MAILKETING_SENDER_NAME
    
    console.log('✅ Configuration loaded:')
    console.log('   API Key:', apiKey ? apiKey.substring(0, 25) + '...' : '❌ EMPTY')
    console.log('   From Email:', fromEmail)
    console.log('   From Name:', fromName)
    console.log('   Active:', config.isActive)
    
    if (!apiKey) {
      console.log('\n❌ MAILKETING_API_KEY is empty!')
      console.log('   Action: Set API key in Admin > Integrations')
      return
    }
    
    // Step 2: Get admin email
    console.log('\n2️⃣ Getting Admin User...\n')
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!admin) {
      console.log('❌ No admin user found')
      return
    }
    
    console.log('✅ Admin found:')
    console.log('   Email:', admin.email)
    console.log('   Name:', admin.name)
    
    // Step 3: Test Mailketing API directly
    console.log('\n3️⃣ Testing Mailketing API Connection...\n')
    
    const testContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981;">✅ Test Email Berhasil!</h1>
        <p>Halo <strong>${admin.name}</strong>,</p>
        <p>Ini adalah test email dari sistem EksporYuk untuk memverifikasi integrasi Mailketing.</p>
        <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;"><strong>✅ Konfigurasi Email Berhasil!</strong></p>
          <p style="margin: 5px 0 0 0; color: #047857;">Sistem email sudah siap digunakan untuk forgot password dan notifikasi lainnya.</p>
        </div>
        <p>Timestamp: ${new Date().toLocaleString('id-ID')}</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">Email ini dikirim via Mailketing API</p>
      </div>
    `
    
    const params = new URLSearchParams()
    params.append('api_token', apiKey)
    params.append('recipient', admin.email)
    params.append('content', testContent)
    params.append('from_email', fromEmail)
    params.append('from_name', fromName)
    
    console.log('📤 Sending test email to:', admin.email)
    console.log('   API: https://api.mailketing.co.id/api/v1/send')
    console.log('   Method: POST (application/x-www-form-urlencoded)')
    
    const response = await fetch('https://api.mailketing.co.id/api/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })
    
    console.log('\n📥 API Response:')
    console.log('   Status:', response.status, response.statusText)
    
    const responseText = await response.text()
    console.log('   Body:', responseText)
    
    if (response.ok) {
      console.log('\n' + '='.repeat(70))
      console.log('✅ EMAIL SENT SUCCESSFULLY!')
      console.log('='.repeat(70))
      console.log('\n📬 Check email inbox:', admin.email)
      console.log('\n✅ Forgot password feature should work now!')
      console.log('\nTest forgot password:')
      console.log('   1. Visit: http://localhost:3000/forgot-password')
      console.log('   2. Enter email:', admin.email)
      console.log('   3. Check inbox for reset link')
    } else {
      console.log('\n' + '='.repeat(70))
      console.log('❌ EMAIL FAILED TO SEND')
      console.log('='.repeat(70))
      console.log('\nPossible issues:')
      console.log('   - Invalid API key')
      console.log('   - Mailketing account not active')
      console.log('   - Network/firewall blocking request')
      console.log('   - Invalid sender email')
      console.log('\nTroubleshooting:')
      console.log('   1. Check Mailketing dashboard: https://mailketing.co.id')
      console.log('   2. Verify API key is correct')
      console.log('   3. Check account balance/credits')
      console.log('   4. Test API via Postman/curl')
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

finalEmailTest().catch(console.error)
