/**
 * Get Google OAuth config from Neon production database
 * Usage: DATABASE_URL="postgres://..." node get-google-config-neon.js
 */

const { PrismaClient } = require('@prisma/client')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

async function getGoogleConfig() {
  try {
    console.log('🔍 Connecting to Neon database...')
    console.log('📡 URL:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'))
    
    const config = await prisma.integrationConfig.findUnique({
      where: { service: 'google_oauth' }
    })
    
    if (!config) {
      console.log('\n❌ Google OAuth config not found in database')
      return
    }
    
    console.log('\n✅ Google OAuth config found!')
    console.log('📊 Status:', config.isActive ? '✅ Active' : '⚠️ Inactive')
    console.log('\n📋 Configuration:')
    console.log(JSON.stringify(config.config, null, 2))
    
    const googleConfig = config.config
    
    console.log('\n🔑 Environment Variables to add to VPS .env:')
    console.log('─'.repeat(60))
    console.log(`GOOGLE_CLIENT_ID="${googleConfig.GOOGLE_CLIENT_ID}"`)
    console.log(`GOOGLE_CLIENT_SECRET="${googleConfig.GOOGLE_CLIENT_SECRET}"`)
    if (googleConfig.GOOGLE_CALLBACK_URL) {
      console.log(`GOOGLE_CALLBACK_URL="${googleConfig.GOOGLE_CALLBACK_URL}"`)
    }
    console.log('─'.repeat(60))
    
    console.log('\n📝 Copy-paste commands for VPS:')
    console.log('─'.repeat(60))
    console.log(`echo 'GOOGLE_CLIENT_ID="${googleConfig.GOOGLE_CLIENT_ID}"' >> /var/www/eksporyuk/nextjs-eksporyuk/.env`)
    console.log(`echo 'GOOGLE_CLIENT_SECRET="${googleConfig.GOOGLE_CLIENT_SECRET}"' >> /var/www/eksporyuk/nextjs-eksporyuk/.env`)
    console.log('pm2 restart eksporyuk')
    console.log('─'.repeat(60))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

getGoogleConfig()
