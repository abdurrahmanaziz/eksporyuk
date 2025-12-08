/**
 * COMPREHENSIVE FEATURE TEST SCRIPT
 * Tests all major features and generates bug list
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const bugs = []
const passed = []

function logTest(feature, status, details) {
  const icon = status === 'PASS' ? '✅' : '❌'
  console.log(`${icon} ${feature}: ${details}`)
  if (status === 'PASS') {
    passed.push({ feature, details })
  } else {
    bugs.push({ feature, details, severity: 'HIGH' })
  }
}

async function testDatabase() {
  console.log('\n=== 1. DATABASE TESTS ===')
  try {
    const users = await prisma.user.count()
    logTest('Users', users > 0 ? 'PASS' : 'FAIL', `${users} users found`)
    
    const products = await prisma.product.count()
    logTest('Products', products > 0 ? 'PASS' : 'FAIL', `${products} products`)
    
    const courses = await prisma.course.count()
    logTest('Courses', courses > 0 ? 'PASS' : 'FAIL', `${courses} courses`)
    
    const memberships = await prisma.membershipPlan.count()
    logTest('Memberships', memberships > 0 ? 'PASS' : 'FAIL', `${memberships} plans`)
    
    const affiliates = await prisma.user.count({ where: { role: 'AFFILIATE' } })
    logTest('Affiliates', affiliates > 0 ? 'PASS' : 'FAIL', `${affiliates} affiliates`)
    
    return true
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message)
    return false
  }
}

async function testAuth() {
  console.log('\n=== 2. AUTHENTICATION TESTS ===')
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
    logTest('Admin Accounts', admins.length > 0 ? 'PASS' : 'FAIL', `${admins.length} admins`)
    
    const hashedPasswords = admins.filter(u => u.password?.startsWith('$2'))
    logTest('Password Encryption', hashedPasswords.length === admins.length ? 'PASS' : 'FAIL', 
      `${hashedPasswords.length}/${admins.length} encrypted`)
    
    return true
  } catch (error) {
    logTest('Auth System', 'FAIL', error.message)
    return false
  }
}

async function testMembership() {
  console.log('\n=== 3. MEMBERSHIP SYSTEM ===')
  try {
    const plans = await prisma.membershipPlan.findMany()
    logTest('Membership Plans', plans.length > 0 ? 'PASS' : 'FAIL', `${plans.length} plans`)
    
    const hasPricing = plans.filter(p => p.price > 0)
    logTest('Pricing Setup', hasPricing.length > 0 ? 'PASS' : 'FAIL', `${hasPricing.length} plans with price`)
    
    const activeMembers = await prisma.userMembership.count({
      where: { 
        isActive: true,
        expiresAt: { gte: new Date() }
      }
    })
    logTest('Active Memberships', true, `${activeMembers} active`)
    
    const lifetimePlan = plans.find(p => p.duration === 'LIFETIME')
    logTest('Lifetime Plan', lifetimePlan ? 'PASS' : 'FAIL', 
      lifetimePlan ? `Found: ${lifetimePlan.name}` : 'Missing')
    
    return true
  } catch (error) {
    logTest('Membership System', 'FAIL', error.message)
    return false
  }
}

async function testAffiliateSystem() {
  console.log('\n=== 4. AFFILIATE SYSTEM ===')
  try {
    const affiliateLinks = await prisma.affiliateLink.count()
    logTest('Affiliate Links', affiliateLinks > 0 ? 'PASS' : 'FAIL', `${affiliateLinks} links`)
    
    const affiliates = await prisma.user.findMany({ where: { role: 'AFFILIATE' } })
    const withCommission = affiliates.filter(a => a.commissionRate > 0)
    logTest('Commission Setup', withCommission.length > 0 ? 'PASS' : 'FAIL', 
      `${withCommission.length} affiliates with commission`)
    
    const coupons = await prisma.coupon.count({ where: { isActive: true } })
    logTest('Active Coupons', coupons > 0 ? 'PASS' : 'FAIL', `${coupons} active`)
    
    const commissions = await prisma.affiliateCommission.count()
    logTest('Commission Records', true, `${commissions} records`)
    
    return true
  } catch (error) {
    logTest('Affiliate System', 'FAIL', error.message)
    return false
  }
}

async function testProducts() {
  console.log('\n=== 5. PRODUCT SYSTEM ===')
  try {
    const products = await prisma.product.findMany()
    logTest('Products', products.length > 0 ? 'PASS' : 'FAIL', `${products.length} products`)
    
    const published = products.filter(p => p.isPublished)
    logTest('Published Products', published.length > 0 ? 'PASS' : 'FAIL', `${published.length} published`)
    
    const withPrice = products.filter(p => p.price > 0)
    logTest('Product Pricing', withPrice.length > 0 ? 'PASS' : 'FAIL', `${withPrice.length} priced`)
    
    const productTypes = [...new Set(products.map(p => p.productType))]
    logTest('Product Types', productTypes.length > 0 ? 'PASS' : 'FAIL', 
      `Types: ${productTypes.join(', ')}`)
    
    return true
  } catch (error) {
    logTest('Product System', 'FAIL', error.message)
    return false
  }
}

async function testCourses() {
  console.log('\n=== 6. COURSE SYSTEM ===')
  try {
    const courses = await prisma.course.findMany({ include: { _count: { select: { modules: true } } } })
    logTest('Courses', courses.length > 0 ? 'PASS' : 'FAIL', `${courses.length} courses`)
    
    const withModules = courses.filter(c => c._count.modules > 0)
    logTest('Course Content', withModules.length > 0 ? 'PASS' : 'FAIL', 
      `${withModules.length} courses with modules`)
    
    const lessons = await prisma.courseLesson.count()
    logTest('Lessons', lessons > 0 ? 'PASS' : 'FAIL', `${lessons} lessons`)
    
    const freeLessons = await prisma.courseLesson.count({ where: { isFree: true } })
    logTest('Free Previews', freeLessons > 0 ? 'PASS' : 'FAIL', `${freeLessons} free lessons`)
    
    return true
  } catch (error) {
    logTest('Course System', 'FAIL', error.message)
    return false
  }
}

async function testCommunity() {
  console.log('\n=== 7. COMMUNITY FEATURES ===')
  try {
    const groups = await prisma.group.count()
    logTest('Groups', true, `${groups} groups`)
    
    const posts = await prisma.post.count()
    logTest('Posts', true, `${posts} posts`)
    
    const comments = await prisma.comment.count()
    logTest('Comments', true, `${comments} comments`)
    
    const messages = await prisma.message.count()
    logTest('Messages', true, `${messages} messages`)
    
    return true
  } catch (error) {
    logTest('Community', 'FAIL', error.message)
    return false
  }
}

async function testTransactions() {
  console.log('\n=== 8. TRANSACTION SYSTEM ===')
  try {
    const transactions = await prisma.transaction.findMany()
    logTest('Transactions', true, `${transactions.length} transactions`)
    
    const successful = transactions.filter(t => t.status === 'SUCCESS')
    logTest('Successful Payments', true, `${successful.length} successful`)
    
    const byType = transactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1
      return acc
    }, {})
    logTest('Transaction Types', true, JSON.stringify(byType))
    
    return true
  } catch (error) {
    logTest('Transactions', 'FAIL', error.message)
    return false
  }
}

async function testIntegrations() {
  console.log('\n=== 9. INTEGRATIONS CHECK ===')
  
  const hasMailketing = process.env.MAILKETING_API_KEY
  logTest('Mailketing API', hasMailketing ? 'PASS' : 'FAIL', 
    hasMailketing ? 'Configured' : 'Missing API key')
  
  const hasStarsender = process.env.STARSENDER_API_KEY
  logTest('Starsender API', hasStarsender ? 'PASS' : 'FAIL', 
    hasStarsender ? 'Configured' : 'Missing API key')
  
  const hasPusher = process.env.NEXT_PUBLIC_PUSHER_KEY
  logTest('Pusher (Real-time)', hasPusher ? 'PASS' : 'FAIL', 
    hasPusher ? 'Configured' : 'Missing key')
  
  const hasOneSignal = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  logTest('OneSignal (Push)', hasOneSignal ? 'PASS' : 'FAIL', 
    hasOneSignal ? 'Configured' : 'Missing app ID')
}

async function generateBugReport() {
  console.log('\n\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  
  console.log(`\n✅ PASSED: ${passed.length}`)
  console.log(`❌ BUGS FOUND: ${bugs.length}`)
  
  if (bugs.length > 0) {
    console.log('\n' + '='.repeat(60))
    console.log('🐛 BUG LIST (Critical to fix)')
    console.log('='.repeat(60))
    bugs.forEach((bug, i) => {
      console.log(`\n${i + 1}. [${bug.severity}] ${bug.feature}`)
      console.log(`   Issue: ${bug.details}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📋 NEXT STEPS')
  console.log('='.repeat(60))
  
  if (bugs.length === 0) {
    console.log('✅ All tests passed! Ready for integrations.')
    console.log('\nNext: Setup external integrations')
    console.log('  - Mailketing (Email)')
    console.log('  - Starsender (WhatsApp)')
    console.log('  - Pusher (Real-time)')
    console.log('  - OneSignal (Push notifications)')
  } else {
    console.log('⚠️  Fix critical bugs first before integrations')
    console.log('\nPriority:')
    console.log('  1. Fix all database/auth issues')
    console.log('  2. Complete membership/affiliate setup')
    console.log('  3. Then proceed to integrations')
  }
}

async function main() {
  console.log('🚀 EKSPOR YUK - COMPREHENSIVE FEATURE TEST\n')
  
  try {
    await testDatabase()
    await testAuth()
    await testMembership()
    await testAffiliateSystem()
    await testProducts()
    await testCourses()
    await testCommunity()
    await testTransactions()
    await testIntegrations()
    
    await generateBugReport()
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
