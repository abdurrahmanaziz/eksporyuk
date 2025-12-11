const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
})

async function checkGoogleOAuth() {
  try {
    console.log('🔍 Checking Google OAuth config in Neon database...\n')
    
    // Query IntegrationConfig untuk Google OAuth
    const configs = await prisma.integrationConfig.findMany({
      where: {
        OR: [
          { service: 'google' },
          { service: 'google_oauth' }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    if (configs.length === 0) {
      console.log('❌ No Google OAuth config found in database!')
      return
    }
    
    console.log(`✅ Found ${configs.length} Google OAuth config(s):\n`)
    
    configs.forEach((config, index) => {
      console.log(`Config #${index + 1}:`)
      console.log(`  Service: ${config.service}`)
      console.log(`  Is Active: ${config.isActive ? '✅ YES' : '❌ NO'}`)
      console.log(`  Config Keys: ${Object.keys(config.config || {}).join(', ')}`)
      
      // Check if config has CLIENT_ID and CLIENT_SECRET
      const cfg = config.config || {}
      const hasClientId = !!(cfg.CLIENT_ID || cfg.GOOGLE_CLIENT_ID)
      const hasClientSecret = !!(cfg.CLIENT_SECRET || cfg.GOOGLE_CLIENT_SECRET)
      
      console.log(`  Has CLIENT_ID: ${hasClientId ? '✅ YES' : '❌ NO'}`)
      console.log(`  Has CLIENT_SECRET: ${hasClientSecret ? '✅ YES' : '❌ NO'}`)
      
      if (hasClientId) {
        const clientId = cfg.CLIENT_ID || cfg.GOOGLE_CLIENT_ID
        console.log(`  CLIENT_ID prefix: ${clientId.substring(0, 20)}...`)
      }
      
      console.log(`  Created: ${config.createdAt}`)
      console.log(`  Updated: ${config.updatedAt}`)
      console.log('')
    })
    
    // Check active config
    const activeConfig = configs.find(c => c.isActive)
    if (!activeConfig) {
      console.log('⚠️  WARNING: No active Google OAuth config found!')
    } else {
      console.log('✅ Active config found:', activeConfig.service)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkGoogleOAuth()
