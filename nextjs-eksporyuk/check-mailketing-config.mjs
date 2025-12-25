import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Mailketing configuration...\n')
  
  // Check IntegrationConfig
  const configs = await prisma.integrationConfig.findMany({
    where: { service: 'mailketing' }
  })
  
  console.log(`Found ${configs.length} Mailketing config(s) in IntegrationConfig:`)
  configs.forEach(c => {
    console.log(`  - ID: ${c.id}`)
    console.log(`    Active: ${c.isActive}`)
    console.log(`    Config:`, c.config)
  })
  
  // Check Settings
  const settings = await prisma.settings.findFirst()
  console.log('\n📧 Email settings from Settings table:')
  console.log(`  - emailSenderName: ${settings?.emailSenderName}`)
  console.log(`  - emailSenderAddress: ${settings?.emailSenderAddress}`)
  console.log(`  - siteLogo: ${settings?.siteLogo?.substring(0, 60)}...`)
  
  // Check .env
  console.log('\n🔑 Environment variables:')
  console.log(`  - MAILKETING_API_KEY: ${process.env.MAILKETING_API_KEY ? '✅ Set' : '❌ Not set'}`)
  console.log(`  - MAILKETING_SENDER_NAME: ${process.env.MAILKETING_SENDER_NAME || '(not set)'}`)
  console.log(`  - MAILKETING_SENDER_EMAIL: ${process.env.MAILKETING_SENDER_EMAIL || '(not set)'}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
