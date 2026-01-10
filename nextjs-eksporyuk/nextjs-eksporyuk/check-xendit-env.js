#!/usr/bin/env node

/**
 * Check environment variables for Xendit integration
 */

console.log('🔍 Checking Xendit Environment Variables...\n')

const requiredVars = [
  'XENDIT_SECRET_KEY',
  'XENDIT_WEBHOOK_TOKEN'
]

const optionalVars = [
  'XENDIT_API_KEY'
]

let hasErrors = false

console.log('Required Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ***${value.slice(-4)} (${value.length} chars)`)
  } else {
    console.log(`❌ ${varName}: NOT SET`)
    hasErrors = true
  }
})

console.log('\nOptional Variables:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ***${value.slice(-4)} (${value.length} chars)`)
  } else {
    console.log(`⚠️  ${varName}: NOT SET (optional)`)
  }
})

if (hasErrors) {
  console.log('\n❌ Missing required environment variables!')
  console.log('\nPlease add to your .env.local:')
  console.log('XENDIT_SECRET_KEY=your_xendit_secret_key')
  console.log('XENDIT_WEBHOOK_TOKEN=your_webhook_token')
  console.log('\nGet these from: https://dashboard.xendit.co/')
  process.exit(1)
} else {
  console.log('\n✅ All required Xendit environment variables are set!')
  console.log('\n📝 Test the integration:')
  console.log('1. Set up webhook URL: https://yourdomain.com/api/webhooks/xendit/disbursement')
  console.log('2. Test withdrawal with instant method')
  console.log('3. Monitor webhook responses')
}