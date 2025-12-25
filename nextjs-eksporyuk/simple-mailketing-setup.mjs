import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Just setup IntegrationConfig
  const config = await prisma.integrationConfig.upsert({
    where: { id: 'mailketing-default' },
    create: {
      id: 'mailketing-default',
      service: 'mailketing',
      config: {
        MAILKETING_API_KEY: 'test-key',
        MAILKETING_API_URL: 'https://api.mailketing.co.id',
        MAILKETING_SENDER_NAME: 'EksporYuk',
        MAILKETING_SENDER_EMAIL: 'info@eksporyuk.com'
      },
      isActive: true
    },
    update: {
      service: 'mailketing',
      config: {
        MAILKETING_API_KEY: 'test-key',
        MAILKETING_API_URL: 'https://api.mailketing.co.id',
        MAILKETING_SENDER_NAME: 'EksporYuk',
        MAILKETING_SENDER_EMAIL: 'info@eksporyuk.com'
      },
      isActive: true
    }
  })
  
  console.log('✅ Mailketing config ready:', config.id)
}

main().catch(console.error).finally(() => prisma.$disconnect())
