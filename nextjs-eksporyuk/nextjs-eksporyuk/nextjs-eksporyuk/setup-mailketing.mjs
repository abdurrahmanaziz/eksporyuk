import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📧 Setting up Mailketing configuration...\n')
  
  // Setup IntegrationConfig
  const mailketingConfig = await prisma.integrationConfig.upsert({
    where: { id: 'mailketing-default' },
    create: {
      id: 'mailketing-default',
      service: 'mailketing',
      config: {
        MAILKETING_API_KEY: 'test-api-key-for-dev',
        MAILKETING_API_URL: 'https://api.mailketing.co.id',
        MAILKETING_SENDER_NAME: 'EksporYuk',
        MAILKETING_SENDER_EMAIL: 'info@eksporyuk.com'
      },
      isActive: true
    },
    update: {
      config: {
        MAILKETING_API_KEY: 'test-api-key-for-dev',
        MAILKETING_API_URL: 'https://api.mailketing.co.id',
        MAILKETING_SENDER_NAME: 'EksporYuk',
        MAILKETING_SENDER_EMAIL: 'info@eksporyuk.com'
      },
      isActive: true
    }
  })
  
  console.log('✅ IntegrationConfig created/updated:')
  console.log('   ID:', mailketingConfig.id)
  console.log('   Service:', mailketingConfig.service)
  console.log('   Active:', mailketingConfig.isActive)
  
  // Update Settings
  const settings = await prisma.settings.upsert({
    where: { id: 'default-settings' },
    create: {
      id: 'default-settings',
      siteName: 'EksporYuk',
      emailSenderName: 'EksporYuk',
      emailSenderAddress: 'info@eksporyuk.com'
    },
    update: {
      emailSenderName: 'EksporYuk',
      emailSenderAddress: 'info@eksporyuk.com'
    }
  })
  
  console.log('\n✅ Settings updated:')
  console.log('   Email Sender:', settings.emailSenderName)
  console.log('   Email Address:', settings.emailSenderAddress)
  console.log('\n🎉 Mailketing setup complete! Try sending test email now.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
