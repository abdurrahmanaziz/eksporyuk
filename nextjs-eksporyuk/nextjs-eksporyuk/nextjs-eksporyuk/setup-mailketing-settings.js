const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupMailketingSettings() {
  console.log('\n🔧 MAILKETING API CONFIGURATION SETUP\n')
  console.log('This will save your Mailketing API credentials to the database.')
  console.log('Settings can be managed from Admin > Integrations page.\n')
  
  try {
    // Ask for API Key
    const apiKey = await question('Enter MAILKETING_API_KEY (or press Enter to skip): ')
    
    if (!apiKey || apiKey.trim() === '') {
      console.log('\n⚠️  No API key provided. Email sending will be simulated.')
      console.log('   You can add it later via Admin > Integrations page.\n')
      rl.close()
      await prisma.$disconnect()
      return
    }
    
    // Default API URL
    const apiUrl = 'https://api.mailketing.co.id/api/v1'
    
    console.log('\n💾 Saving to database...')
    
    // Upsert API Key
    await prisma.setting.upsert({
      where: { key: 'mailketing_api_key' },
      create: {
        key: 'mailketing_api_key',
        value: apiKey.trim(),
        type: 'INTEGRATION',
        category: 'EMAIL'
      },
      update: {
        value: apiKey.trim()
      }
    })
    
    // Upsert API URL
    await prisma.setting.upsert({
      where: { key: 'mailketing_api_url' },
      create: {
        key: 'mailketing_api_url',
        value: apiUrl,
        type: 'INTEGRATION',
        category: 'EMAIL'
      },
      update: {
        value: apiUrl
      }
    })
    
    // Upsert default from email
    await prisma.setting.upsert({
      where: { key: 'email_from' },
      create: {
        key: 'email_from',
        value: 'noreply@eksporyuk.com',
        type: 'SYSTEM',
        category: 'EMAIL'
      },
      update: {}
    })
    
    // Upsert default from name
    await prisma.setting.upsert({
      where: { key: 'email_from_name' },
      create: {
        key: 'email_from_name',
        value: 'EksporYuk',
        type: 'SYSTEM',
        category: 'EMAIL'
      },
      update: {}
    })
    
    console.log('✅ Settings saved successfully!\n')
    console.log('📋 Saved settings:')
    console.log(`   mailketing_api_key: ${apiKey.substring(0, 20)}...`)
    console.log(`   mailketing_api_url: ${apiUrl}`)
    console.log(`   email_from: noreply@eksporyuk.com`)
    console.log(`   email_from_name: EksporYuk`)
    
    console.log('\n🧪 Testing API connection...')
    
    // Test API connection
    const params = new URLSearchParams()
    params.append('api_token', apiKey.trim())
    params.append('recipient', 'test@example.com')
    params.append('content', '<h1>Test Connection</h1><p>This is a test email from EksporYuk setup.</p>')
    params.append('from_email', 'noreply@eksporyuk.com')
    params.append('from_name', 'EksporYuk')
    
    try {
      const response = await fetch(`${apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })
      
      console.log(`   Response: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('   ✅ API connection successful!')
        console.log(`   Message ID: ${result.message_id || result.id || 'N/A'}`)
      } else {
        const text = await response.text()
        console.log('   ⚠️  API responded with error:')
        console.log(`   ${text.substring(0, 200)}`)
      }
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`)
    }
    
    console.log('\n📝 Next steps:')
    console.log('   1. Test forgot password: node test-forgot-password.js')
    console.log('   2. Visit: http://localhost:3000/forgot-password')
    console.log('   3. Check Admin > Integrations to manage settings\n')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
  }
  
  rl.close()
  await prisma.$disconnect()
}

setupMailketingSettings().catch(console.error)
