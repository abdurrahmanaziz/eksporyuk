/**
 * CHECK INTEGRATION STATUS
 * Verify all external services are configured
 */

require('dotenv').config({ path: '.env.local' })

console.log('🔍 CHECKING INTEGRATION CONFIGURATION\n')
console.log('='.repeat(60))

// Check Mailketing
const mailketingConfigured = !!(
  process.env.MAILKETING_API_KEY &&
  process.env.MAILKETING_SENDER_EMAIL
)
console.log(`\n📧 Mailketing: ${mailketingConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`)
if (mailketingConfigured) {
  console.log(`   API Key: ${process.env.MAILKETING_API_KEY?.substring(0, 10)}...`)
  console.log(`   From: ${process.env.MAILKETING_SENDER_EMAIL}`)
}

// Check Starsender
const starsenderConfigured = !!(
  process.env.STARSENDER_API_KEY &&
  process.env.STARSENDER_DEVICE_ID
)
console.log(`\n📱 Starsender: ${starsenderConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`)
if (starsenderConfigured) {
  console.log(`   API Key: ${process.env.STARSENDER_API_KEY?.substring(0, 10)}...`)
  console.log(`   Device ID: ${process.env.STARSENDER_DEVICE_ID}`)
}

// Check OneSignal
const onesignalConfigured = !!(
  process.env.ONESIGNAL_APP_ID &&
  process.env.ONESIGNAL_API_KEY
)
console.log(`\n🔔 OneSignal: ${onesignalConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`)
if (onesignalConfigured) {
  console.log(`   App ID: ${process.env.ONESIGNAL_APP_ID?.substring(0, 15)}...`)
  console.log(`   API Key: ${process.env.ONESIGNAL_API_KEY?.substring(0, 15)}...`)
}

// Check Pusher
const pusherConfigured = !!(
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET
)
console.log(`\n⚡ Pusher: ${pusherConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`)
if (pusherConfigured) {
  console.log(`   App ID: ${process.env.PUSHER_APP_ID}`)
  console.log(`   Key: ${process.env.PUSHER_KEY}`)
  console.log(`   Cluster: ${process.env.PUSHER_CLUSTER}`)
}

// Summary
console.log('\n' + '='.repeat(60))
const allConfigured = mailketingConfigured && starsenderConfigured && onesignalConfigured && pusherConfigured
if (allConfigured) {
  console.log('\n✅ ALL INTEGRATIONS CONFIGURED!')
  console.log('\nNext: Start the dev server and run test-integrations.js')
} else {
  console.log('\n⚠️  SOME INTEGRATIONS NOT CONFIGURED')
  console.log('\nCheck your .env.local file and add missing API keys')
}
