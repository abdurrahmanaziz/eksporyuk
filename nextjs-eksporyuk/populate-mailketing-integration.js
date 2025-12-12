const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function populateMailketingIntegration() {
  console.log('\n🔧 POPULATING MAILKETING INTEGRATION CONFIG\n')
  
  try {
    // Check if already exists
    const existing = await prisma.integrationConfig.findUnique({
      where: { service: 'mailketing' }
    })
    
    const defaultConfig = {
      MAILKETING_API_KEY: '',
      MAILKETING_SENDER_EMAIL: 'noreply@eksporyuk.com',
      MAILKETING_SENDER_NAME: 'EksporYuk',
      MAILKETING_REPLY_TO_EMAIL: 'support@eksporyuk.com',
      MAILKETING_FORWARD_EMAIL: 'admin@eksporyuk.com'
    }
    
    if (existing) {
      console.log('✅ Mailketing integration already exists')
      console.log('   Service ID:', existing.id)
      console.log('   Active:', existing.isActive)
      console.log('   Config:', JSON.stringify(existing.config, null, 2))
      
      // Check if API key is set
      const config = existing.config
      if (!config.MAILKETING_API_KEY || config.MAILKETING_API_KEY === '') {
        console.log('\n⚠️  MAILKETING_API_KEY is empty!')
        console.log('   Visit: http://localhost:3000/admin/integrations')
        console.log('   Click Mailketing card → Add API Key')
      } else {
        console.log('\n✅ MAILKETING_API_KEY is configured')
        console.log('   Key:', config.MAILKETING_API_KEY.substring(0, 20) + '...')
        console.log('\n🧪 Testing email system...')
        console.log('   Run: node test-forgot-password.js')
      }
    } else {
      console.log('📝 Creating new Mailketing integration config...')
      
      const created = await prisma.integrationConfig.create({
        data: {
          service: 'mailketing',
          config: defaultConfig,
          isActive: true,
          testStatus: 'pending',
          lastTestedAt: null
        }
      })
      
      console.log('✅ Created Mailketing integration config')
      console.log('   Service ID:', created.id)
      console.log('   Config:', JSON.stringify(created.config, null, 2))
      console.log('\n⚠️  NEXT STEP:')
      console.log('   1. Visit: http://localhost:3000/admin/integrations')
      console.log('   2. Click "Mailketing" card')
      console.log('   3. Add your MAILKETING_API_KEY')
      console.log('   4. Click "Save Configuration"')
      console.log('   5. Test forgot password feature')
    }
    
    console.log('\n📋 Integration Config Table Schema:')
    console.log('   - service: mailketing')
    console.log('   - config: JSON object with API keys')
    console.log('   - isActive: true/false')
    console.log('   - testStatus: pending/success/failed')
    
  } catch (error) {
    console.error('\n❌ Failed:', error.message)
  }
  
  await prisma.$disconnect()
}

populateMailketingIntegration().catch(console.error)
