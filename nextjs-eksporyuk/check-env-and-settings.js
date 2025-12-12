const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEnvAndSettings() {
  console.log('\n🔍 CHECKING MAILKETING CONFIGURATION\n')
  
  // Check .env
  console.log('📄 .env file:')
  console.log('   MAILKETING_API_KEY:', process.env.MAILKETING_API_KEY || '❌ NOT SET')
  console.log('   MAILKETING_API_URL:', process.env.MAILKETING_API_URL || '❌ NOT SET')
  
  // Check database settings
  console.log('\n💾 Database settings:')
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['mailketing_api_key', 'mailketing_api_url', 'email_from', 'email_from_name']
      }
    }
  })
  
  if (settings.length === 0) {
    console.log('   ❌ No Mailketing settings in database')
  } else {
    settings.forEach(s => {
      const value = s.key.includes('key') 
        ? (s.value ? s.value.substring(0, 20) + '...' : 'NULL')
        : s.value
      console.log(`   ${s.key}: ${value || 'NULL'}`)
    })
  }
  
  console.log('\n🔧 SOLUTION:')
  console.log('   Either add to .env file:')
  console.log('   MAILKETING_API_KEY="your-api-key-here"')
  console.log('   MAILKETING_API_URL="https://api.mailketing.co.id/api/v1"')
  console.log('')
  console.log('   OR insert into database:')
  console.log('   Run: node setup-mailketing-settings.js')
  
  await prisma.$disconnect()
}

checkEnvAndSettings().catch(console.error)
