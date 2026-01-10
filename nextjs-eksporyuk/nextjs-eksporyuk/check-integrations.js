const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkIntegrations() {
  console.log('🔍 Checking Integration Configurations\n')
  console.log('='.repeat(80))
  
  const services = ['xendit', 'mailketing', 'starsender', 'onesignal', 'pusher', 'resend']
  
  for (const service of services) {
    const config = await prisma.integrationConfig.findUnique({
      where: { service }
    })
    
    if (config) {
      console.log(`\n✅ ${service.toUpperCase()}:`)
      console.log(`   Active: ${config.isActive ? '✅' : '❌'}`)
      console.log(`   Config keys: ${Object.keys(config.config || {}).join(', ')}`)
      
      if (service === 'xendit' && config.config) {
        const xen = config.config
        console.log(`   Environment: ${xen.XENDIT_ENVIRONMENT || 'not set'}`)
        console.log(`   Secret Key: ${xen.XENDIT_SECRET_KEY ? '***configured***' : '❌ missing'}`)
        console.log(`   Webhook Token: ${xen.XENDIT_WEBHOOK_TOKEN ? '***configured***' : '❌ missing'}`)
      }
      
      if (service === 'resend' && config.config) {
        console.log(`   API Key: ${config.config.RESEND_API_KEY ? '***configured***' : '❌ missing'}`)
      }
    } else {
      console.log(`\n❌ ${service.toUpperCase()}: Not configured in database`)
    }
  }
  
  console.log('\n' + '='.repeat(80))
  await prisma.$disconnect()
}

checkIntegrations().catch(console.error)
