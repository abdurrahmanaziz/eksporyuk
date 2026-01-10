/**
 * Export Google OAuth environment variables from database
 * Usage: node export-google-env.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function exportGoogleEnv() {
  try {
    console.log('🔍 Fetching Google OAuth config from database...')
    
    const config = await prisma.integrationConfig.findUnique({
      where: { service: 'google_oauth' }
    })
    
    if (!config) {
      console.log('❌ Google OAuth config not found in database')
      console.log('💡 Please configure it in Admin > Integrations page first')
      return
    }
    
    if (!config.isActive) {
      console.log('⚠️  Google OAuth config exists but is not active')
    }
    
    const googleConfig = config.config
    
    console.log('\n✅ Google OAuth config found!')
    console.log('\n📋 Add these to your .env or export in terminal:\n')
    console.log(`GOOGLE_CLIENT_ID="${googleConfig.GOOGLE_CLIENT_ID}"`)
    console.log(`GOOGLE_CLIENT_SECRET="${googleConfig.GOOGLE_CLIENT_SECRET}"`)
    
    if (googleConfig.GOOGLE_CALLBACK_URL) {
      console.log(`GOOGLE_CALLBACK_URL="${googleConfig.GOOGLE_CALLBACK_URL}"`)
    }
    
    console.log('\n🔄 For VPS deployment, run:')
    console.log('\necho "GOOGLE_CLIENT_ID=\'%s\'" >> .env', googleConfig.GOOGLE_CLIENT_ID)
    console.log('echo "GOOGLE_CLIENT_SECRET=\'%s\'" >> .env', googleConfig.GOOGLE_CLIENT_SECRET)
    console.log('\n⚠️  After adding to .env, restart the application:')
    console.log('pm2 restart eksporyuk\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

exportGoogleEnv()
