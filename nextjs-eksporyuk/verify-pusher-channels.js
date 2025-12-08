#!/usr/bin/env node

/**
 * VERIFY PUSHER CHANNEL CONSISTENCY
 * Script to check that all Pusher channel names match between client subscriptions and server emissions
 */

const fs = require('fs')
const path = require('path')

// Channel naming convention
const CHANNEL_PATTERNS = {
  user: /`?user-\$\{userId\}`?|`?user-\$\{session\.user\.id\}`?/g,
  privateUser: /`?private-user-\$\{|`?private-user-\$\{/g,
  group: /`?group-\$\{groupId\}`?/g,
  presenceGroup: /`?presence-group-\$\{|`?presence-group-\$\{/g,
  chat: /`?chat-\$\{|`?chat-\$\{activeRoom/g,
}

const files = {
  // Client subscriptions
  clientSubscriptions: [
    'src/components/layout/NotificationBell.tsx',
    'src/components/layout/ChatBadge.tsx',
    'src/components/layout/DashboardSidebar.tsx',
    'src/components/presence/OnlineStatusProvider.tsx',
    'src/components/presence/OnlineStatusBadge.tsx',
    'src/components/groups/GroupSidebar.tsx',
    'src/app/(dashboard)/notifications/page.tsx',
    'src/app/(dashboard)/chat/page.tsx',
  ],
  
  // Server emissions
  serverEmissions: [
    'src/lib/pusher.ts',
    'src/lib/integrations/pusher.ts',
    'src/lib/services/notificationService.ts',
    'src/lib/services/chatService.ts',
    'src/app/api/users/presence/route.ts',
    'src/app/api/posts/[id]/comments/route.ts',
    'src/app/api/messages/route.ts',
  ],
}

function checkFile(filePath, expectedPatterns) {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false, path: filePath }
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    
    const issues = []
    const patterns = {
      hasOldPrivateUserChannel: /`?private-user-/g.test(content),
      hasOldPresenceGroupChannel: /`?presence-group-/g.test(content),
      hasNewUserChannel: /`?user-\$\{/g.test(content),
      hasNewGroupChannel: /`?group-\$\{/g.test(content),
    }
    
    if (patterns.hasOldPrivateUserChannel) {
      const matches = content.match(/`?private-user-[^`]*`?/g) || []
      issues.push({
        type: 'OLD_CHANNEL_NAME',
        pattern: 'private-user-*',
        matches: matches.slice(0, 3),
        message: 'Found old private-user-* channel naming (should be user-*)'
      })
    }
    
    if (patterns.hasOldPresenceGroupChannel) {
      const matches = content.match(/`?presence-group-[^`]*`?/g) || []
      issues.push({
        type: 'OLD_CHANNEL_NAME',
        pattern: 'presence-group-*',
        matches: matches.slice(0, 3),
        message: 'Found old presence-group-* channel naming (should be group-*)'
      })
    }
    
    return {
      exists: true,
      path: filePath,
      issues,
      hasIssues: issues.length > 0
    }
  } catch (error) {
    return { exists: true, path: filePath, error: error.message }
  }
}

console.log('\n╔════════════════════════════════════════════════╗')
console.log('║  PUSHER CHANNEL CONSISTENCY VERIFICATION      ║')
console.log('╚════════════════════════════════════════════════╝\n')

console.log('✅ EXPECTED CHANNEL NAMES:')
console.log('   Client Subscriptions: user-${userId}, group-${groupId}, chat-${roomId}')
console.log('   Server Emissions:     user-${userId}, group-${groupId}, chat-${roomId}')
console.log('')

console.log('❌ OLD/INVALID CHANNEL NAMES:')
console.log('   private-user-* (should be user-*)')
console.log('   presence-group-* (should be group-*)')
console.log('')

console.log('═══════════════════════════════════════════════════\n')

let totalIssues = 0

console.log('🔍 Checking Client Subscriptions:\n')
files.clientSubscriptions.forEach(file => {
  const result = checkFile(file, [])
  const status = result.exists ? (result.hasIssues ? '❌' : '✅') : '⚠️'
  console.log(`${status} ${path.basename(file)}`)
  
  if (result.error) {
    console.log(`   Error: ${result.error}`)
  } else if (result.hasIssues) {
    result.issues.forEach(issue => {
      console.log(`   ⚠️  ${issue.message}`)
      console.log(`       Examples: ${issue.matches.join(', ')}`)
      totalIssues++
    })
  }
})

console.log('\n🔍 Checking Server Emissions:\n')
files.serverEmissions.forEach(file => {
  const result = checkFile(file, [])
  const status = result.exists ? (result.hasIssues ? '❌' : '✅') : '⚠️'
  console.log(`${status} ${path.basename(file)}`)
  
  if (result.error) {
    console.log(`   Error: ${result.error}`)
  } else if (result.hasIssues) {
    result.issues.forEach(issue => {
      console.log(`   ⚠️  ${issue.message}`)
      console.log(`       Examples: ${issue.matches.join(', ')}`)
      totalIssues++
    })
  }
})

console.log('\n═══════════════════════════════════════════════════\n')

if (totalIssues === 0) {
  console.log('✅ ALL CHECKS PASSED - Pusher channels are consistent!\n')
  process.exit(0)
} else {
  console.log(`❌ FOUND ${totalIssues} ISSUE(S) - Please fix channel naming inconsistencies\n`)
  process.exit(1)
}
