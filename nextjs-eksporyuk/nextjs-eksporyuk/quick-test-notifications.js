#!/usr/bin/env node

/**
 * Quick Test: Notification System Configuration
 * 
 * Run: node quick-test-notifications.js
 */

require('dotenv').config({ path: '.env.local' })

console.log('🔔 NOTIFICATION SYSTEM - QUICK CHECK\n')
console.log('=' .repeat(60), '\n')

// Check Pusher
console.log('📡 PUSHER (Real-time Notifications):')
const pusherVars = {
  'PUSHER_APP_ID': process.env.PUSHER_APP_ID,
  'NEXT_PUBLIC_PUSHER_KEY': process.env.NEXT_PUBLIC_PUSHER_KEY,
  'PUSHER_SECRET': process.env.PUSHER_SECRET,
  'NEXT_PUBLIC_PUSHER_CLUSTER': process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1'
}

let pusherOk = true
for (const [key, value] of Object.entries(pusherVars)) {
  if (value && value.trim() !== '') {
    console.log(`   ✅ ${key}`)
  } else {
    console.log(`   ❌ ${key} - NOT SET`)
    pusherOk = false
  }
}

if (pusherOk) {
  console.log('   ✅ Pusher is configured!\n')
} else {
  console.log('   ⚠️  Pusher needs configuration\n')
  console.log('   Setup: https://pusher.com/channels\n')
}

// Check OneSignal
console.log('🔔 ONESIGNAL (Push Notifications):')
const oneSignalVars = {
  'ONESIGNAL_APP_ID': process.env.ONESIGNAL_APP_ID,
  'ONESIGNAL_API_KEY': process.env.ONESIGNAL_API_KEY
}

let oneSignalOk = true
for (const [key, value] of Object.entries(oneSignalVars)) {
  if (value && value.trim() !== '') {
    console.log(`   ✅ ${key}`)
  } else {
    console.log(`   ❌ ${key} - NOT SET`)
    oneSignalOk = false
  }
}

if (oneSignalOk) {
  console.log('   ✅ OneSignal is configured!\n')
} else {
  console.log('   ⚠️  OneSignal needs configuration\n')
  console.log('   Setup: https://onesignal.com\n')
}

// Summary
console.log('=' .repeat(60))
console.log('\n📊 SUMMARY:\n')

if (pusherOk && oneSignalOk) {
  console.log('✅ All notification systems are configured!')
  console.log('✅ You can now receive real-time and push notifications\n')
  console.log('🎯 Implemented Notifications:')
  console.log('   ✅ Post likes')
  console.log('   ✅ New posts in groups')
  console.log('   ✅ Comments and replies')
  console.log('   ✅ Mentions (@username)')
  console.log('   ✅ Post reactions (❤️, 😂, etc)')
  console.log('   ✅ Course completion')
  console.log('   ✅ New lesson unlocked\n')
  console.log('📚 Test by:')
  console.log('   1. Like a post → Author gets notified')
  console.log('   2. Create post in group → Members get notified')
  console.log('   3. Complete lesson → Get next lesson notification')
  console.log('   4. Complete course → Get certificate notification\n')
} else {
  console.log('⚠️  Notification system needs setup\n')
  console.log('📋 TODO:')
  
  if (!pusherOk) {
    console.log('\n1. Setup Pusher:')
    console.log('   - Go to: https://pusher.com/channels')
    console.log('   - Create app "EksporYuk"')
    console.log('   - Get credentials from "App Keys"')
    console.log('   - Add to .env.local')
  }
  
  if (!oneSignalOk) {
    console.log('\n2. Setup OneSignal:')
    console.log('   - Go to: https://onesignal.com')
    console.log('   - Create app "EksporYuk" (Web Push)')
    console.log('   - Get App ID and REST API Key')
    console.log('   - Add to .env.local')
  }
  
  console.log('\n📖 Full guide: NOTIFICATION_IMPLEMENTATION_GUIDE.md\n')
}
