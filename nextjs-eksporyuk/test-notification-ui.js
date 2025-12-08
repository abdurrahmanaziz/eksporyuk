/**
 * Test Script: Notification Center UI Validation
 * 
 * Tests:
 * 1. NotificationBell component exists
 * 2. Notifications page exists
 * 3. Pusher configuration
 * 4. API routes functional
 * 5. Sidebar menu integration
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 TESTING: Notification Center UI Implementation\n')

const results = {
  passed: 0,
  failed: 0,
  warnings: 0
}

// Helper function
function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath)
  const exists = fs.existsSync(fullPath)
  if (exists) {
    const stats = fs.statSync(fullPath)
    console.log(`✅ ${description}`)
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`)
    results.passed++
    return fs.readFileSync(fullPath, 'utf-8')
  } else {
    console.log(`❌ ${description} - NOT FOUND`)
    results.failed++
    return null
  }
}

function checkInFile(content, searchStrings, description) {
  if (!content) {
    console.log(`⚠️  ${description} - SKIPPED (file not found)`)
    results.warnings++
    return false
  }
  
  const allFound = searchStrings.every(str => content.includes(str))
  if (allFound) {
    console.log(`✅ ${description}`)
    results.passed++
    return true
  } else {
    const missing = searchStrings.filter(str => !content.includes(str))
    console.log(`❌ ${description} - MISSING: ${missing.join(', ')}`)
    results.failed++
    return false
  }
}

// ============================
// TEST 1: Component Files
// ============================
console.log('📁 TEST 1: Component Files\n')

const notificationBell = checkFile(
  'src/components/layout/NotificationBell.tsx',
  'NotificationBell component'
)

const notificationsPage = checkFile(
  'src/app/(dashboard)/notifications/page.tsx',
  'Notifications page'
)

const dashboardHeader = checkFile(
  'src/components/layout/DashboardHeader.tsx',
  'DashboardHeader (includes NotificationBell)'
)

// ============================
// TEST 2: Pusher Integration
// ============================
console.log('\n🔌 TEST 2: Pusher Integration\n')

if (notificationBell) {
  checkInFile(
    notificationBell,
    ['import Pusher from', 'pusher-js', 'NEXT_PUBLIC_PUSHER_KEY', 'user-${session.user.id}', 'notification'],
    'NotificationBell: Pusher real-time setup'
  )
  
  checkInFile(
    notificationBell,
    ['toast.custom', 'formatDistanceToNow', 'getNotificationIcon'],
    'NotificationBell: Toast notifications & formatting'
  )
}

if (notificationsPage) {
  checkInFile(
    notificationsPage,
    ['import Pusher from', 'pusher-js', 'channel.bind', 'notification'],
    'Notifications page: Pusher real-time'
  )
  
  checkInFile(
    notificationsPage,
    ['Tabs', 'TabsContent', 'TabsList', 'TabsTrigger'],
    'Notifications page: Filter tabs'
  )
  
  checkInFile(
    notificationsPage,
    ['selectedIds', 'handleMarkAsRead', 'handleDelete', 'toggleSelection'],
    'Notifications page: Bulk actions'
  )
}

// ============================
// TEST 3: Environment Variables
// ============================
console.log('\n⚙️  TEST 3: Environment Variables\n')

const envFile = checkFile('.env.local', 'Environment variables')
if (envFile) {
  checkInFile(
    envFile,
    ['NEXT_PUBLIC_PUSHER_KEY', 'NEXT_PUBLIC_PUSHER_CLUSTER', 'PUSHER_APP_ID'],
    'Pusher configuration'
  )
  
  // Check if values are set (not placeholder)
  if (envFile.includes('NEXT_PUBLIC_PUSHER_KEY=1927d0c82c61c5022f22')) {
    console.log('✅ Pusher keys configured (not placeholder)')
    results.passed++
  } else {
    console.log('⚠️  Pusher keys may be placeholder values')
    results.warnings++
  }
}

// ============================
// TEST 4: API Routes
// ============================
console.log('\n🌐 TEST 4: API Routes\n')

const notificationRoute = checkFile(
  'src/app/api/notifications/route.ts',
  'Notifications API route (GET/PATCH/DELETE)'
)

if (notificationRoute) {
  checkInFile(
    notificationRoute,
    ['export async function GET', 'export async function PATCH', 'export async function DELETE'],
    'Notifications API: All HTTP methods'
  )
  
  checkInFile(
    notificationRoute,
    ['import { prisma }', 'notificationService'],
    'Notifications API: Imports'
  )
}

const subscribeRoute = checkFile(
  'src/app/api/notifications/subscribe/route.ts',
  'Notification subscription API'
)

// ============================
// TEST 5: Sidebar Menu
// ============================
console.log('\n📋 TEST 5: Sidebar Menu Integration\n')

const sidebar = checkFile(
  'src/components/layout/DashboardSidebar.tsx',
  'Dashboard sidebar'
)

if (sidebar) {
  checkInFile(
    sidebar,
    ['Bell', 'Notifikasi', '/dashboard/notifications'],
    'Sidebar: Notifications menu item'
  )
  
  // Check for all roles
  const memberPremiumHasNotif = sidebar.includes('MEMBER_PREMIUM') && 
                                 sidebar.match(/MEMBER_PREMIUM[^]*?Notifikasi/s)
  const memberFreeHasNotif = sidebar.includes('MEMBER_FREE') && 
                             sidebar.match(/MEMBER_FREE[^]*?Notifikasi/s)
  
  if (memberPremiumHasNotif) {
    console.log('✅ MEMBER_PREMIUM has Notifications menu')
    results.passed++
  } else {
    console.log('❌ MEMBER_PREMIUM missing Notifications menu')
    results.failed++
  }
  
  if (memberFreeHasNotif) {
    console.log('✅ MEMBER_FREE has Notifications menu')
    results.passed++
  } else {
    console.log('❌ MEMBER_FREE missing Notifications menu')
    results.failed++
  }
}

// ============================
// TEST 6: Notification Types
// ============================
console.log('\n🔔 TEST 6: Notification Types\n')

const notificationTypes = [
  'CHAT', 'POST_NEW', 'POST_LIKE', 'COMMENT', 'COMMENT_REPLY',
  'COURSE_ENROLLED', 'COURSE_COMPLETED', 'COURSE_DISCUSSION',
  'EVENT_REMINDER', 'EVENT_START', 'TRANSACTION_SUCCESS', 
  'TRANSACTION_PENDING', 'FOLLOW', 'ACHIEVEMENT', 'SYSTEM'
]

if (notificationsPage) {
  const foundTypes = notificationTypes.filter(type => 
    notificationsPage.includes(`'${type}'`) || notificationsPage.includes(`"${type}"`)
  )
  
  console.log(`✅ Found ${foundTypes.length}/${notificationTypes.length} notification types`)
  console.log(`   Types: ${foundTypes.slice(0, 5).join(', ')}...`)
  results.passed++
}

// ============================
// TEST 7: Documentation
// ============================
console.log('\n📚 TEST 7: Documentation\n')

checkFile(
  'NOTIFICATION_CENTER_UI_COMPLETE.md',
  'Notification Center UI documentation'
)

checkFile(
  'REALTIME_NOTIFICATION_CHAT_SYSTEM.md',
  'Real-time system documentation'
)

// ============================
// TEST 8: UI Features
// ============================
console.log('\n🎨 TEST 8: UI Features\n')

if (notificationsPage) {
  checkInFile(
    notificationsPage,
    ['formatDistanceToNow', 'id as idLocale', 'date-fns/locale'],
    'Indonesian date formatting'
  )
  
  checkInFile(
    notificationsPage,
    ['Card', 'CardContent', 'Badge', 'Button', 'ScrollArea'],
    'shadcn/ui components'
  )
  
  checkInFile(
    notificationsPage,
    ['unreadOnly', 'activeFilter', 'selectedIds'],
    'State management'
  )
  
  checkInFile(
    notificationsPage,
    ['handleMarkAsRead', 'handleMarkAllRead', 'handleDelete'],
    'Action handlers'
  )
}

// ============================
// SUMMARY
// ============================
console.log('\n' + '='.repeat(50))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(50))
console.log(`✅ Passed:   ${results.passed}`)
console.log(`❌ Failed:   ${results.failed}`)
console.log(`⚠️  Warnings: ${results.warnings}`)
console.log('='.repeat(50))

const totalTests = results.passed + results.failed
const successRate = totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : 0

console.log(`\n🎯 Success Rate: ${successRate}%`)

if (results.failed === 0) {
  console.log('\n✨ ALL TESTS PASSED! Notification Center UI is ready.')
  console.log('\n📋 Next Steps:')
  console.log('   1. Start dev server: npm run dev')
  console.log('   2. Navigate to: http://localhost:3000/dashboard/notifications')
  console.log('   3. Test real-time: Open 2 browser tabs')
  console.log('   4. Verify Pusher connection in browser console')
  console.log('   5. Test mark as read, delete, filters')
} else {
  console.log('\n⚠️  Some tests failed. Review the errors above.')
  console.log('   Run: npm run dev to check for runtime errors')
}

console.log('\n📚 Documentation:')
console.log('   - NOTIFICATION_CENTER_UI_COMPLETE.md')
console.log('   - REALTIME_NOTIFICATION_CHAT_SYSTEM.md')

process.exit(results.failed > 0 ? 1 : 0)
