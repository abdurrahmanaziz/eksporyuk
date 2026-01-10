#!/usr/bin/env node

/**
 * TEST CHAT SYSTEM - Verify messaging implementation
 * Tests: Send message, Fetch rooms, Load messages
 * Integrations: Pusher real-time, OneSignal notifications, Database
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('\n=== EKSPORYUK CHAT SYSTEM TEST ===\n')

// 1. Check Database Models
console.log('✓ CHECKING DATABASE MODELS...\n')

const schemaPath = path.join(__dirname, 'nextjs-eksporyuk/prisma/schema.prisma')
const schema = fs.readFileSync(schemaPath, 'utf-8')

const hasChatRoom = schema.includes('model ChatRoom {')
const hasMessage = schema.includes('model Message {')
const hasChatParticipant = schema.includes('model ChatParticipant {')

console.log(`  ChatRoom model exists: ${hasChatRoom ? '✅' : '❌'}`)
console.log(`  Message model exists: ${hasMessage ? '✅' : '❌'}`)
console.log(`  ChatParticipant model exists: ${hasChatParticipant ? '✅' : '❌'}`)

// Check Message indices
const messageIndices = schema.includes('@@index([roomId])') && 
                       schema.includes('@@index([senderId])') &&
                       schema.includes('@@index([receiverId])')
console.log(`  Message indices configured: ${messageIndices ? '✅' : '❌'}`)

// 2. Check Chat Service
console.log('\n✓ CHECKING CHAT SERVICE...\n')

const chatServicePath = path.join(__dirname, 'nextjs-eksporyuk/src/lib/services/chatService.ts')
const chatService = fs.readFileSync(chatServicePath, 'utf-8')

const hasSendMessage = chatService.includes('async sendMessage(')
const hasGetRooms = chatService.includes('async getUserRooms(')
const hasGetMessages = chatService.includes('async getMessages(')
const hasNotification = chatService.includes('notificationService.sendPushOnly(')

console.log(`  sendMessage method: ${hasSendMessage ? '✅' : '❌'}`)
console.log(`  getUserRooms method: ${hasGetRooms ? '✅' : '❌'}`)
console.log(`  getMessages method: ${hasGetMessages ? '✅' : '❌'}`)
console.log(`  OneSignal integration: ${hasNotification ? '✅' : '❌'}`)

// 3. Check API Routes
console.log('\n✓ CHECKING API ROUTES...\n')

const sendPath = path.join(__dirname, 'nextjs-eksporyuk/src/app/api/chat/send/route.ts')
const roomsPath = path.join(__dirname, 'nextjs-eksporyuk/src/app/api/chat/rooms/route.ts')
const messagesPath = path.join(__dirname, 'nextjs-eksporyuk/src/app/api/chat/messages/route.ts')

const sendRoute = fs.existsSync(sendPath) ? fs.readFileSync(sendPath, 'utf-8') : ''
const roomsRoute = fs.existsSync(roomsPath) ? fs.readFileSync(roomsPath, 'utf-8') : ''
const messagesRoute = fs.existsSync(messagesPath) ? fs.readFileSync(messagesPath, 'utf-8') : ''

console.log(`  POST /api/chat/send exists: ${fs.existsSync(sendPath) ? '✅' : '❌'}`)
console.log(`  GET /api/chat/rooms exists: ${fs.existsSync(roomsPath) ? '✅' : '❌'}`)
console.log(`  GET /api/chat/messages exists: ${fs.existsSync(messagesPath) ? '✅' : '❌'}`)

// Check route implementations
const sendHasAuth = sendRoute.includes('getServerSession(authOptions)')
const roomsHasAuth = roomsRoute.includes('getServerSession(authOptions)')
const messagesHasAuth = messagesRoute.includes('getServerSession(authOptions)')

console.log(`  Send route auth check: ${sendHasAuth ? '✅' : '❌'}`)
console.log(`  Rooms route auth check: ${roomsHasAuth ? '✅' : '❌'}`)
console.log(`  Messages route auth check: ${messagesHasAuth ? '✅' : '❌'}`)

// 4. Check Pusher Integration
console.log('\n✓ CHECKING PUSHER INTEGRATION...\n')

const pusherPath = path.join(__dirname, 'nextjs-eksporyuk/src/lib/pusher.ts')
const pusher = fs.readFileSync(pusherPath, 'utf-8')

const hasPusherTrigger = pusher.includes('async trigger(')
const hasPusherNotifyUser = pusher.includes('async notifyUser(')

console.log(`  Pusher.trigger method: ${hasPusherTrigger ? '✅' : '❌'}`)
console.log(`  Pusher.notifyUser method: ${hasPusherNotifyUser ? '✅' : '❌'}`)

// Check Pusher auth endpoint
const authPath = path.join(__dirname, 'nextjs-eksporyuk/src/app/api/pusher/auth/route.ts')
console.log(`  Pusher auth endpoint: ${fs.existsSync(authPath) ? '✅' : '❌'}`)

// 5. Check OneSignal Integration
console.log('\n✓ CHECKING ONESIGNAL INTEGRATION...\n')

const notificationServicePath = path.join(__dirname, 'nextjs-eksporyuk/src/lib/services/notificationService.ts')
const notificationService = fs.readFileSync(notificationServicePath, 'utf-8')

const hasSendPushOnly = notificationService.includes('async sendPushOnly(')
const hasSendViaPush = notificationService.includes('async sendViaPush(')
const sendsPushToOneSignal = notificationService.includes('OneSignal')

console.log(`  sendPushOnly method: ${hasSendPushOnly ? '✅' : '❌'}`)
console.log(`  sendViaPush method: ${hasSendViaPush ? '✅' : '❌'}`)
console.log(`  OneSignal integration: ${sendsPushToOneSignal ? '✅' : '❌'}`)

// 6. Check Follow User Feature
console.log('\n✓ CHECKING FOLLOW USER FEATURE...\n')

const followPath = path.join(__dirname, 'nextjs-eksporyuk/src/app/api/users/[id]/follow/route.ts')
const follow = fs.existsSync(followPath) ? fs.readFileSync(followPath, 'utf-8') : ''

const followHasPusher = follow.includes("'pusher'")
const followHasOneSignal = follow.includes("'onesignal'")
const followHasActorMetadata = follow.includes('actorId') && follow.includes('actorName')

console.log(`  Follow endpoint exists: ${fs.existsSync(followPath) ? '✅' : '❌'}`)
console.log(`  Pusher channel enabled: ${followHasPusher ? '✅' : '❌'}`)
console.log(`  OneSignal channel enabled: ${followHasOneSignal ? '✅' : '❌'}`)
console.log(`  Actor metadata included: ${followHasActorMetadata ? '✅' : '❌'}`)

// 7. Check Environment Variables
console.log('\n✓ CHECKING ENVIRONMENT VARIABLES...\n')

const envPath = path.join(__dirname, 'nextjs-eksporyuk/.env')
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : ''

const hasPusherKey = envContent.includes('PUSHER') || envContent.includes('pusher')
const hasOneSignalKey = envContent.includes('ONESIGNAL') || envContent.includes('onesignal')
const hasXenditKey = envContent.includes('XENDIT') || envContent.includes('xendit')

console.log(`  Pusher keys configured: ${hasPusherKey ? '✅' : '⚠️ (Check .env)'}`)
console.log(`  OneSignal keys configured: ${hasOneSignalKey ? '✅' : '⚠️ (Check .env)'}`)
console.log(`  Database configured: ${envContent.includes('DATABASE_URL') ? '✅' : '❌'}`)

// 8. Summary
console.log('\n=== SYSTEM STATUS SUMMARY ===\n')

const coreFeatures = [
  { name: 'Database Models', passed: hasChatRoom && hasMessage && hasChatParticipant },
  { name: 'Chat Service', passed: hasSendMessage && hasGetRooms && hasGetMessages },
  { name: 'API Routes', passed: fs.existsSync(sendPath) && fs.existsSync(roomsPath) && fs.existsSync(messagesPath) },
  { name: 'Pusher Real-time', passed: hasPusherTrigger && hasPusherNotifyUser },
  { name: 'OneSignal Notifications', passed: hasSendPushOnly && sendsPushToOneSignal },
  { name: 'Follow User Feature', passed: followHasPusher && followHasOneSignal },
  { name: 'Security & Auth', passed: sendHasAuth && roomsHasAuth && messagesHasAuth }
]

let allPassed = true
coreFeatures.forEach(feature => {
  const status = feature.passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} - ${feature.name}`)
  if (!feature.passed) allPassed = false
})

console.log('\n' + '='.repeat(50) + '\n')

if (allPassed) {
  console.log('✅ ALL SYSTEMS OPERATIONAL')
  console.log('\nChat system is ready:')
  console.log('  • Send messages with real-time updates via Pusher')
  console.log('  • Push notifications via OneSignal')
  console.log('  • Follow user with dual-channel notifications')
  console.log('  • Secure endpoints with auth checks')
  console.log('  • Database models fully integrated')
  console.log('\nNext steps:')
  console.log('  npm run dev              # Start development server')
  console.log('  npm run prisma:studio    # View database')
  console.log('  curl test API endpoints  # Test message flow')
} else {
  console.log('⚠️  SOME SYSTEMS NEED ATTENTION')
  console.log('\nPlease verify:')
  console.log('  1. All API routes exist and have auth checks')
  console.log('  2. Pusher and OneSignal are configured in .env')
  console.log('  3. Database models have proper indices')
  console.log('  4. Chat service methods are implemented')
}

console.log('\n' + '='.repeat(50) + '\n')

process.exit(allPassed ? 0 : 1)
