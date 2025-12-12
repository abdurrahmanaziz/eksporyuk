const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const mailketingConfig = await prisma.integrationConfig.findUnique({
    where: { service: 'mailketing' }
  })
  
  console.log('\n=== Mailketing Integration Config ===')
  if (mailketingConfig) {
    console.log('Service:', mailketingConfig.service)
    console.log('Is Active:', mailketingConfig.isActive)
    console.log('Config:', JSON.stringify(mailketingConfig.config, null, 2))
  } else {
    console.log('❌ No Mailketing config found in database')
    console.log('\n💡 You need to add config via Admin > Integrations page')
  }
  
  await prisma.$disconnect()
}

main().catch(console.error)
