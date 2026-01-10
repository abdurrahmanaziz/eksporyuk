/**
 * Insert Google OAuth config directly to Neon database
 */

const { PrismaClient } = require('@prisma/client')

const DATABASE_URL = 'postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

async function insertGoogleOAuth() {
  try {
    console.log('📝 Inserting Google OAuth config to Neon database...')
    
    const config = {
      GOOGLE_CLIENT_ID: '805480551537-b89th9psujgarmr8atcj140j9q353eb.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: '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',
      GOOGLE_CALLBACK_URL: 'https://app.eksporyuk.com/api/auth/callback/google'
    }
    
    const result = await prisma.integrationConfig.upsert({
      where: { service: 'google_oauth' },
      create: {
        service: 'google_oauth',
        config: config,
        isActive: true,
        testStatus: 'success',
        lastTestedAt: new Date()
      },
      update: {
        config: config,
        isActive: true,
        testStatus: 'success',
        lastTestedAt: new Date()
      }
    })
    
    console.log('✅ Google OAuth config saved successfully!')
    console.log('📊 Record:', result)
    
    console.log('\n🔑 Environment variables for VPS:')
    console.log('─'.repeat(70))
    console.log(`GOOGLE_CLIENT_ID="${config.GOOGLE_CLIENT_ID}"`)
    console.log(`GOOGLE_CLIENT_SECRET="${config.GOOGLE_CLIENT_SECRET}"`)
    console.log('─'.repeat(70))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

insertGoogleOAuth()
