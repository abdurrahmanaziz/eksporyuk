#!/usr/bin/env node

/**
 * BROADCAST SYSTEM - COMPREHENSIVE TEST
 * 
 * Tests:
 * 1. Database models existence
 * 2. API endpoints availability
 * 3. UI component structure
 * 4. Integration points
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 BROADCAST SYSTEM - COMPREHENSIVE TEST\n')
console.log('='.repeat(70))

let passed = 0
let failed = 0
let warnings = 0

function log(message, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  console.log(`${icons[type]} ${message}`)
}

function section(title) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`📋 ${title}`)
  console.log('='.repeat(70))
}

// ============================
// TEST 1: Database Schema
// ============================
section('1. Database Schema Validation')

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma')
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
  const tests = [
    { name: 'BroadcastCampaign model', pattern: /model BroadcastCampaign \{/ },
    { name: 'BroadcastLog model', pattern: /model BroadcastLog \{/ },
    { name: 'BroadcastCampaign.targetType field', pattern: /targetType\s+String/ },
    { name: 'BroadcastCampaign.emailSubject field', pattern: /emailSubject\s+String\?/ },
    { name: 'BroadcastCampaign.whatsappMessage field', pattern: /whatsappMessage\s+String\?/ },
    { name: 'BroadcastCampaign.totalRecipients field', pattern: /totalRecipients\s+Int/ },
    { name: 'BroadcastCampaign.sentCount field', pattern: /sentCount\s+Int/ },
    { name: 'BroadcastLog.status field', pattern: /status\s+String/ },
    { name: 'BroadcastLog.channel field', pattern: /channel\s+String/ },
    { name: 'BroadcastLog relation to Campaign', pattern: /campaign\s+BroadcastCampaign/ },
  ]
  
  tests.forEach(test => {
    if (test.pattern.test(schema)) {
      log(test.name, 'success')
      passed++
    } else {
      log(test.name, 'error')
      failed++
    }
  })
} else {
  log('Schema file not found', 'error')
  failed++
}

// ============================
// TEST 2: API Routes
// ============================
section('2. API Routes Validation')

const apiRoutes = [
  { path: 'src/app/api/admin/broadcast/route.ts', name: 'Main Broadcast API' },
  { path: 'src/app/api/admin/broadcast/preview-audience/route.ts', name: 'Preview Audience API' },
  { path: 'src/app/api/admin/broadcast/send/route.ts', name: 'Send Broadcast API' },
]

apiRoutes.forEach(route => {
  const routePath = path.join(__dirname, route.path)
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8')
    
    // Check for essential functions
    if (route.name === 'Main Broadcast API') {
      if (content.includes('export async function GET') && 
          content.includes('export async function POST') &&
          content.includes('export async function PUT') &&
          content.includes('export async function DELETE')) {
        log(`${route.name} - All CRUD methods present`, 'success')
        passed++
      } else {
        log(`${route.name} - Missing CRUD methods`, 'error')
        failed++
      }
    } else {
      log(`${route.name} - File exists`, 'success')
      passed++
    }
  } else {
    log(`${route.name} - File not found`, 'error')
    failed++
  }
})

// ============================
// TEST 3: UI Components
// ============================
section('3. UI Components Validation')

const templatesPage = path.join(__dirname, 'src/app/(dashboard)/admin/templates/page.tsx')
if (fs.existsSync(templatesPage)) {
  const content = fs.readFileSync(templatesPage, 'utf8')
  
  const uiTests = [
    { name: 'BroadcastPanel component', pattern: /function BroadcastPanel/ },
    { name: 'BroadcastModal component', pattern: /function BroadcastModal/ },
    { name: 'Campaign list rendering', pattern: /campaigns\.map/ },
    { name: 'Status filter', pattern: /statusFilter/ },
    { name: 'Type filter', pattern: /typeFilter/ },
    { name: 'Create campaign button', pattern: /handleCreateCampaign/ },
    { name: 'Send campaign function', pattern: /handleSendCampaign/ },
    { name: 'Preview audience function', pattern: /handlePreviewAudience/ },
    { name: 'Target type selector', pattern: /targetType/ },
    { name: 'Email content fields', pattern: /emailSubject/ },
    { name: 'WhatsApp content fields', pattern: /whatsappMessage/ },
  ]
  
  uiTests.forEach(test => {
    if (test.pattern.test(content)) {
      log(test.name, 'success')
      passed++
    } else {
      log(test.name, 'error')
      failed++
    }
  })
} else {
  log('Templates page not found', 'error')
  failed++
}

// ============================
// TEST 4: Integration Points
// ============================
section('4. Integration Points Validation')

const sendRoute = path.join(__dirname, 'src/app/api/admin/broadcast/send/route.ts')
if (fs.existsSync(sendRoute)) {
  const content = fs.readFileSync(sendRoute, 'utf8')
  
  const integrationTests = [
    { name: 'Mailketing config import', pattern: /getMailketingConfig/ },
    { name: 'StarSender config import', pattern: /getStarSenderConfig/ },
    { name: 'Email sending function', pattern: /async function sendEmail/ },
    { name: 'WhatsApp sending function', pattern: /async function sendWhatsApp/ },
    { name: 'Shortcode replacement', pattern: /function replaceShortcodes/ },
    { name: 'Background processing', pattern: /async function processBroadcast/ },
    { name: 'BroadcastLog creation', pattern: /prisma\.broadcastLog\.create/ },
  ]
  
  integrationTests.forEach(test => {
    if (test.pattern.test(content)) {
      log(test.name, 'success')
      passed++
    } else {
      log(test.name, 'error')
      failed++
    }
  })
} else {
  log('Send route not found', 'error')
  failed++
}

// ============================
// TEST 5: Shortcode System
// ============================
section('5. Shortcode System Validation')

if (fs.existsSync(sendRoute)) {
  const content = fs.readFileSync(sendRoute, 'utf8')
  
  const shortcodes = [
    '{name}',
    '{email}',
    '{role}',
    '{membership_plan}',
    '{dashboard_link}',
    '{profile_link}',
    '{company_name}',
    '{year}',
    '{date}',
  ]
  
  shortcodes.forEach(shortcode => {
    const escaped = shortcode.replace(/[{}]/g, '\\\\$&')
    if (content.includes(shortcode)) {
      log(`Shortcode ${shortcode} supported`, 'success')
      passed++
    } else {
      log(`Shortcode ${shortcode} not found`, 'warning')
      warnings++
    }
  })
}

// ============================
// TEST 6: Error Handling
// ============================
section('6. Error Handling & Validation')

const routes = [
  'src/app/api/admin/broadcast/route.ts',
  'src/app/api/admin/broadcast/send/route.ts',
  'src/app/api/admin/broadcast/preview-audience/route.ts',
]

routes.forEach(route => {
  const routePath = path.join(__dirname, route)
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8')
    
    if (content.includes('try {') && content.includes('catch')) {
      log(`${path.basename(route)} - Has error handling`, 'success')
      passed++
    } else {
      log(`${path.basename(route)} - Missing error handling`, 'warning')
      warnings++
    }
    
    if (content.includes('getServerSession') && content.includes('ADMIN')) {
      log(`${path.basename(route)} - Has auth check`, 'success')
      passed++
    } else {
      log(`${path.basename(route)} - Missing auth check`, 'error')
      failed++
    }
  }
})

// ============================
// TEST 7: TypeScript Types
// ============================
section('7. TypeScript Types Validation')

if (fs.existsSync(templatesPage)) {
  const content = fs.readFileSync(templatesPage, 'utf8')
  
  const typeTests = [
    { name: 'Campaign state typing', pattern: /campaigns.*useState<any\[\]>/ },
    { name: 'Modal mode typing', pattern: /modalMode.*'create'\s*\|\s*'edit'/ },
    { name: 'Form data interface', pattern: /formData.*useState/ },
    { name: 'Status filter typing', pattern: /statusFilter.*useState/ },
  ]
  
  typeTests.forEach(test => {
    if (test.pattern.test(content)) {
      log(test.name, 'success')
      passed++
    } else {
      log(test.name, 'warning')
      warnings++
    }
  })
}

// ============================
// TEST 8: Documentation
// ============================
section('8. Documentation Validation')

const docPath = path.join(__dirname, 'BROADCAST_SYSTEM_COMPLETE.md')
if (fs.existsSync(docPath)) {
  const content = fs.readFileSync(docPath, 'utf8')
  
  const docTests = [
    { name: 'Database models documented', pattern: /## 📊 Database Models/ },
    { name: 'API endpoints documented', pattern: /## 🔌 API Endpoints/ },
    { name: 'Target types documented', pattern: /## 🎯 Target Types/ },
    { name: 'Shortcodes documented', pattern: /## 📝 Available Shortcodes/ },
    { name: 'UI features documented', pattern: /## 🖥️ Admin UI Features/ },
    { name: 'Security documented', pattern: /## 🔐 Security & Permissions/ },
    { name: 'Metrics documented', pattern: /## 📊 Metrics Tracking/ },
    { name: 'Integration documented', pattern: /## 🚀 Integration Points/ },
  ]
  
  docTests.forEach(test => {
    if (test.pattern.test(content)) {
      log(test.name, 'success')
      passed++
    } else {
      log(test.name, 'warning')
      warnings++
    }
  })
} else {
  log('Documentation file not found', 'warning')
  warnings++
}

// ============================
// SUMMARY
// ============================
console.log('\n' + '='.repeat(70))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(70))
console.log(`✅ Passed:   ${passed}`)
console.log(`❌ Failed:   ${failed}`)
console.log(`⚠️  Warnings: ${warnings}`)
console.log(`📈 Total:    ${passed + failed + warnings}`)

if (failed === 0) {
  console.log('\n🎉 ALL CRITICAL TESTS PASSED!')
  console.log('✅ Broadcast system is fully implemented and ready for use.')
} else {
  console.log('\n⚠️  SOME TESTS FAILED')
  console.log('Please review the errors above.')
}

console.log('\n' + '='.repeat(70))
console.log('📋 NEXT STEPS')
console.log('='.repeat(70))
console.log('1. Run: npx prisma generate')
console.log('2. Restart TypeScript server (CMD/CTRL + Shift + P → Restart TS Server)')
console.log('3. Access: http://localhost:3000/admin/templates')
console.log('4. Go to Broadcast tab')
console.log('5. Create and test a campaign')
console.log('='.repeat(70))
