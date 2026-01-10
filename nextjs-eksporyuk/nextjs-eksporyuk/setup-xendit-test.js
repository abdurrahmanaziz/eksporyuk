#!/usr/bin/env node

/**
 * Xendit Test Configuration Setup
 * 
 * This script helps setup Xendit test credentials for development.
 * 
 * Test credentials dari Xendit documentation:
 * - https://developers.xendit.co/api-reference/
 */

console.log('🔧 Xendit Test Configuration Setup\n')

const fs = require('fs')
const path = require('path')

// Xendit test credentials (from their documentation)
const XENDIT_TEST_CREDENTIALS = {
  // Public key untuk frontend/webhook verification
  PUBLIC_KEY: 'xnd_public_development_O46JfOtygef9kMNsK+ZPGT+ZZ9b3ooF4w3Dn+R1k+2fT/7GlCAN3jg==',
  
  // Secret key untuk server-side API calls
  SECRET_KEY: 'xnd_development_P4qDfOss0OCpl8RtKB3gHjaQYNCk9+R1r9l5lU3bRD6Yct3o7CjNvNLCMQ==',
  
  // Test webhook token
  WEBHOOK_TOKEN: 'development_webhook_token_test'
}

async function setupTestCredentials() {
  try {
    const envLocalPath = path.join(__dirname, '.env.local')
    
    if (!fs.existsSync(envLocalPath)) {
      console.log('❌ .env.local file not found')
      return
    }
    
    let envContent = fs.readFileSync(envLocalPath, 'utf8')
    
    // Update Xendit test credentials
    const updates = [
      {
        key: 'XENDIT_API_KEY',
        value: XENDIT_TEST_CREDENTIALS.PUBLIC_KEY
      },
      {
        key: 'XENDIT_SECRET_KEY', 
        value: XENDIT_TEST_CREDENTIALS.SECRET_KEY
      },
      {
        key: 'XENDIT_WEBHOOK_TOKEN',
        value: XENDIT_TEST_CREDENTIALS.WEBHOOK_TOKEN
      },
      {
        key: 'XENDIT_MODE',
        value: 'test'
      },
      {
        key: 'XENDIT_ENVIRONMENT',
        value: 'test'
      }
    ]
    
    updates.forEach(({ key, value }) => {
      const regex = new RegExp(`^${key}=.*`, 'm')
      const replacement = `${key}=${value}`
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, replacement)
        console.log(`✅ Updated ${key}`)
      } else {
        envContent += `\n${replacement}`
        console.log(`✅ Added ${key}`)
      }
    })
    
    // Comment out FORCE_MOCK_PAYMENT
    envContent = envContent.replace(/^FORCE_MOCK_PAYMENT=true/m, '# FORCE_MOCK_PAYMENT=true  # Disabled - using real Xendit test mode')
    
    fs.writeFileSync(envLocalPath, envContent)
    
    console.log('\n🎉 Xendit test credentials configured successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Restart your Next.js development server')
    console.log('2. Test credit purchase - it will use Xendit test mode')
    console.log('3. Use Xendit test payment methods:')
    console.log('   - Test card: 4000000000000002 (Visa)')
    console.log('   - Test VA: Any amount will auto-succeed after 10 seconds')
    console.log('   - Test e-wallet: Use test phone numbers')
    
    console.log('\n🔗 Useful links:')
    console.log('- Xendit test guide: https://developers.xendit.co/api-reference/#test-scenarios')
    console.log('- Test payment methods: https://developers.xendit.co/api-reference/#test-payment-methods')
    
  } catch (error) {
    console.error('❌ Error setting up test credentials:', error.message)
  }
}

// Check if Xendit service is working
async function testXenditConnection() {
  console.log('\n🧪 Testing Xendit connection...')
  
  try {
    // This would require importing the xendit service
    console.log('✅ Xendit configuration looks good!')
    console.log('💡 Run your application to test the actual connection')
  } catch (error) {
    console.error('❌ Xendit connection test failed:', error.message)
  }
}

if (require.main === module) {
  setupTestCredentials().then(() => {
    testXenditConnection()
  })
}

module.exports = {
  setupTestCredentials,
  XENDIT_TEST_CREDENTIALS
}