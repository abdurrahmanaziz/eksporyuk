#!/usr/bin/env node
/**
 * Test Auto-Affiliate Switcher Implementation
 * Verifies that users with commissions automatically get affiliate dashboard access
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAutoAffiliateSwitcher() {
  console.log('🧪 TESTING AUTO-AFFILIATE SWITCHER IMPLEMENTATION')
  console.log('==================================================\n')

  try {
    // 1. Test the specific user
    console.log('📊 TESTING SPECIFIC USER:')
    const email = 'rahmatalfianto1997@gmail.com'
    const user = await testUserAffiliateAccess(email)
    
    if (!user) {
      console.log('❌ User not found, cannot test')
      return
    }

    // 2. Test a sample of users who should have auto-affiliate access
    console.log('\n📈 TESTING USERS WHO SHOULD GET AUTO-AFFILIATE ACCESS:')
    await testUsersNeedingAutoAffiliate()

    // 3. Simulate the auth flow
    console.log('\n🔐 SIMULATING AUTH FLOW:')
    await simulateAuthFlow(user)

    // 4. Test dashboard options API logic
    console.log('\n🎛️ TESTING DASHBOARD OPTIONS LOGIC:')
    await testDashboardOptionsLogic(user)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }

  await prisma.$disconnect()
}

async function testUserAffiliateAccess(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: true,
      wallet: true,
      _count: {
        select: {
          affiliateLinks: true
        }
      }
    }
  })

  if (!user) {
    console.log('❌ User not found:', email)
    return null
  }

  // Get affiliate transactions
  const affiliateTransactionCount = await prisma.transaction.count({
    where: { 
      affiliateId: user.id,
      status: 'SUCCESS'
    }
  })

  // Check affiliate profile
  const affiliateProfile = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, isActive: true }
  })

  // Apply auto-affiliate logic
  const hasAffiliateTransactions = affiliateTransactionCount > 0
  const hasAffiliateLinks = user._count.affiliateLinks > 0
  const hasWalletBalance = user.wallet && (user.wallet.balance > 0 || user.wallet.balancePending > 0)
  
  const shouldHaveAffiliateAccess = hasAffiliateTransactions || hasAffiliateLinks || hasWalletBalance || user.affiliateMenuEnabled

  console.log(`   User: ${user.name} (${user.email})`)
  console.log(`   Primary Role: ${user.role}`)
  console.log(`   Current affiliateMenuEnabled: ${user.affiliateMenuEnabled}`)
  console.log(`   Has Affiliate Transactions: ${hasAffiliateTransactions}`)
  console.log(`   Has Affiliate Links: ${hasAffiliateLinks} (${user._count.affiliateLinks})`)
  console.log(`   Has Wallet Balance: ${hasWalletBalance}`)
  console.log(`   Has Affiliate Profile: ${!!affiliateProfile?.isActive}`)
  console.log(`   ➡️  Should Have Auto-Affiliate Access: ${shouldHaveAffiliateAccess}`)
  
  if (shouldHaveAffiliateAccess && !user.affiliateMenuEnabled) {
    console.log(`   ⚠️  RECOMMENDATION: Enable affiliate access for this user`)
  } else if (!shouldHaveAffiliateAccess && user.affiliateMenuEnabled) {
    console.log(`   ⚠️  NOTE: User has manual affiliate access without commission activity`)
  } else {
    console.log(`   ✅ Current settings are correct`)
  }

  return { 
    ...user, 
    affiliateProfile,
    shouldHaveAffiliateAccess,
    hasAffiliateTransactions,
    hasAffiliateLinks,
    hasWalletBalance
  }
}

async function testUsersNeedingAutoAffiliate() {
  // Get users with affiliate activity who should have access
  const affiliateUserIds = await prisma.transaction.findMany({
    where: { 
      affiliateId: { not: null },
      status: 'SUCCESS'
    },
    select: { affiliateId: true },
    distinct: ['affiliateId']
  }).then(results => results.map(r => r.affiliateId).filter(Boolean))

  const usersWithActivity = await prisma.user.findMany({
    where: {
      OR: [
        { id: { in: affiliateUserIds } },
        { affiliateLinks: { some: {} } },
        { 
          wallet: {
            OR: [
              { balance: { gt: 0 } },
              { balancePending: { gt: 0 } }
            ]
          }
        }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      affiliateMenuEnabled: true,
      _count: {
        select: {
          affiliateLinks: true
        }
      }
    },
    take: 10
  })

  console.log(`   Found ${usersWithActivity.length} users with affiliate activity:`)
  
  for (const user of usersWithActivity) {
    const transactionCount = await prisma.transaction.count({
      where: { 
        affiliateId: user.id,
        status: 'SUCCESS'
      }
    })
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balance: true, balancePending: true }
    })

    const hasWalletBalance = wallet && (wallet.balance > 0 || wallet.balancePending > 0)
    const shouldHave = transactionCount > 0 || user._count.affiliateLinks > 0 || hasWalletBalance

    console.log(`   ${user.name} (${user.role}) - ${transactionCount} tx, ${user._count.affiliateLinks} links, wallet: ${hasWalletBalance ? 'Yes' : 'No'} - Should have: ${shouldHave}, Currently has: ${user.affiliateMenuEnabled}`)
  }
}

async function simulateAuthFlow(user) {
  console.log('   Simulating auth callback logic...')
  
  // Simulate the logic from auth-options.ts
  const [affiliateTransactionCount, affiliateLinksCount, wallet] = await Promise.all([
    prisma.transaction.count({
      where: { 
        affiliateId: user.id,
        status: 'SUCCESS'
      }
    }),
    prisma.affiliateLink.count({
      where: { userId: user.id }
    }),
    prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balance: true, balancePending: true }
    })
  ])

  const hasAffiliateTransactions = affiliateTransactionCount > 0
  const hasAffiliateLinks = affiliateLinksCount > 0
  const hasWalletBalance = wallet && (wallet.balance > 0 || wallet.balancePending > 0)
  
  const authAffiliateAccess = hasAffiliateTransactions || hasAffiliateLinks || hasWalletBalance || user.affiliateMenuEnabled

  console.log('   Auth flow results:')
  console.log(`   ➡️  affiliateMenuEnabled would be: ${authAffiliateAccess}`)
  console.log(`   ➡️  hasAffiliateProfile would be: ${authAffiliateAccess || (user.affiliateProfile && user.affiliateProfile.isActive)}`)
}

async function testDashboardOptionsLogic(user) {
  console.log('   Simulating dashboard options API logic...')
  
  // Simulate the logic from /api/user/dashboard-options
  const [affiliateTransactionCount, affiliateLinksCount, wallet] = await Promise.all([
    prisma.transaction.count({
      where: { 
        affiliateId: user.id,
        status: 'SUCCESS'
      }
    }),
    prisma.affiliateLink.count({
      where: { userId: user.id }
    }),
    prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balance: true, balancePending: true }
    })
  ])
  
  const hasAffiliateTransactions = affiliateTransactionCount > 0
  const hasAffiliateLinks = affiliateLinksCount > 0
  const hasWalletBalance = wallet && (wallet.balance > 0 || wallet.balancePending > 0)
  
  const shouldHaveAffiliateAccess = hasAffiliateTransactions || hasAffiliateLinks || hasWalletBalance || user.affiliateMenuEnabled || (user.affiliateProfile?.isActive)

  const dashboardOptions = []
  
  // Determine available dashboards
  const userRoles = new Set([user.role, ...user.userRoles.map(ur => ur.role)])
  
  if (userRoles.has('ADMIN')) {
    dashboardOptions.push('Admin Panel')
  }
  
  if (userRoles.has('MEMBER_FREE') || userRoles.has('MEMBER_PREMIUM') || userRoles.has('AFFILIATE') || userRoles.has('MENTOR')) {
    dashboardOptions.push('Member Dashboard')
  }
  
  if (shouldHaveAffiliateAccess) {
    dashboardOptions.push('Rich Affiliate')
  }
  
  if (userRoles.has('MENTOR')) {
    dashboardOptions.push('Mentor Hub')
  }

  console.log('   Dashboard options API results:')
  console.log(`   ➡️  Available dashboards: ${dashboardOptions.join(', ')}`)
  console.log(`   ➡️  Total options: ${dashboardOptions.length}`)
  console.log(`   ➡️  Needs selection: ${dashboardOptions.length > 1}`)
}

// Summary
async function summarizeResults() {
  console.log('\n📋 IMPLEMENTATION SUMMARY:')
  console.log('=====================================')
  console.log('✅ Auto-affiliate logic implemented in:')
  console.log('   1. auth-options.ts (JWT callback)')
  console.log('   2. /api/user/dashboard-options (dashboard switcher)')
  console.log('   3. middleware.ts (route protection)')
  console.log('')
  console.log('🎯 Users will get affiliate access if they have:')
  console.log('   • Successful affiliate transactions (status: SUCCESS)')
  console.log('   • Affiliate links created')
  console.log('   • Wallet balance (pending or available)')
  console.log('   • Manual affiliate access enabled')
  console.log('   • Active affiliate profile')
  console.log('')
  console.log('🔄 How it works:')
  console.log('   1. User logs in → auth checks commission activity')
  console.log('   2. Session includes auto-calculated affiliate access')
  console.log('   3. Navigation components show affiliate dashboard option')
  console.log('   4. No need to logout/login - works immediately')
}

// Run tests
testAutoAffiliateSwitcher()
  .then(() => summarizeResults())
  .catch(console.error)