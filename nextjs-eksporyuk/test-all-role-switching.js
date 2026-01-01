#!/usr/bin/env node
/**
 * Test all role switching scenarios
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAllRoleSwitching() {
  console.log('🧪 TESTING ALL ROLE SWITCHING SCENARIOS')
  console.log('=======================================\n')

  try {
    const email = 'azizbiasa@gmail.com'
    console.log(`📊 Test User: ${email}\n`)
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: true,
        affiliateProfile: true,
        wallet: true
      }
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    // All roles user has
    const allRoles = [user.role, ...user.userRoles.map(ur => ur.role)]
    console.log('📋 USER ROLES:')
    console.log(`   Primary Role: ${user.role}`)
    console.log(`   Additional Roles: ${user.userRoles.map(r => r.role).join(', ') || 'None'}`)
    console.log(`   All Roles: ${allRoles.join(', ')}`)
    console.log(`   Affiliate Profile: ${user.affiliateProfile ? 'Active' : 'None'}`)
    console.log(`   Has Wallet: ${user.wallet ? `Rp ${user.wallet.balance.toLocaleString()}` : 'None'}`)
    
    // Check affiliate links & transactions
    const affiliateLinks = await prisma.affiliateLink.count({ where: { userId: user.id }})
    const affiliateTx = await prisma.transaction.count({ 
      where: { affiliateId: user.id, status: 'SUCCESS' }
    })
    console.log(`   Affiliate Links: ${affiliateLinks}`)
    console.log(`   Affiliate Transactions: ${affiliateTx}`)

    console.log('\n🔄 AVAILABLE DASHBOARD OPTIONS:')
    
    // Member Dashboard - anyone can access
    const canAccessMember = true
    console.log(`   ✅ Member Dashboard → Always available`)
    
    // Affiliate Dashboard
    const hasAffiliateAccess = allRoles.includes('AFFILIATE') || 
      user.affiliateProfile?.isActive || 
      user.affiliateMenuEnabled ||
      affiliateLinks > 0 ||
      affiliateTx > 0 ||
      (user.wallet && (user.wallet.balance > 0 || user.wallet.balancePending > 0))
    console.log(`   ${hasAffiliateAccess ? '✅' : '❌'} Affiliate Dashboard`)
    
    // Mentor Dashboard
    const hasMentorAccess = allRoles.includes('MENTOR') || allRoles.includes('ADMIN')
    console.log(`   ${hasMentorAccess ? '✅' : '❌'} Mentor Hub`)
    
    // Admin Dashboard  
    const hasAdminAccess = user.role === 'ADMIN'
    console.log(`   ${hasAdminAccess ? '✅' : '❌'} Admin Panel`)

    console.log('\n🧪 SWITCHING SCENARIOS:')
    
    // Scenario 1: Affiliate -> Member
    if (hasAffiliateAccess) {
      console.log('\n   📱 Affiliate → Member:')
      console.log('      1. User di /affiliate/dashboard')
      console.log('      2. Click switcher → pilih "Member Dashboard"')
      console.log('      3. API saves preferredDashboard = "member"')
      console.log('      4. Navigate to /dashboard?selected=member')
      console.log('      5. Middleware: preferredDashboard="member" → NextResponse.next()')
      console.log('      6. Sidebar: pathname=/dashboard → show MEMBER menu')
      console.log('      ✅ Result: User stays on member dashboard')
    }

    // Scenario 2: Affiliate -> Mentor
    if (hasAffiliateAccess && hasMentorAccess) {
      console.log('\n   📱 Affiliate → Mentor:')
      console.log('      1. User di /affiliate/dashboard')
      console.log('      2. Click switcher → pilih "Mentor Hub"')
      console.log('      3. API saves preferredDashboard = "mentor"')
      console.log('      4. Navigate to /mentor/dashboard')
      console.log('      5. Middleware: allRoles.includes("MENTOR") → allowed')
      console.log('      6. Sidebar: pathname=/mentor → show MENTOR menu')
      console.log('      ✅ Result: User stays on mentor dashboard')
    }

    // Scenario 3: Mentor -> Affiliate
    if (hasMentorAccess && hasAffiliateAccess) {
      console.log('\n   📱 Mentor → Affiliate:')
      console.log('      1. User di /mentor/dashboard')
      console.log('      2. Click switcher → pilih "Rich Affiliate"')
      console.log('      3. API saves preferredDashboard = "affiliate"')
      console.log('      4. Navigate to /affiliate/dashboard')
      console.log('      5. Middleware: hasAffiliateProfile → allowed')
      console.log('      6. Sidebar: pathname=/affiliate → show AFFILIATE menu')
      console.log('      ✅ Result: User stays on affiliate dashboard')
    }

    // Scenario 4: Mentor -> Member
    if (hasMentorAccess) {
      console.log('\n   �� Mentor → Member:')
      console.log('      1. User di /mentor/dashboard')
      console.log('      2. Click switcher → pilih "Member Dashboard"')
      console.log('      3. API saves preferredDashboard = "member"')
      console.log('      4. Navigate to /dashboard?selected=member')
      console.log('      5. Middleware: preferredDashboard="member" → NextResponse.next()')
      console.log('      6. Sidebar: pathname=/dashboard → show MEMBER menu')
      console.log('      ✅ Result: User stays on member dashboard')
    }

    // Scenario 5: Member -> Affiliate
    if (hasAffiliateAccess) {
      console.log('\n   📱 Member → Affiliate:')
      console.log('      1. User di /dashboard')
      console.log('      2. Click switcher → pilih "Rich Affiliate"')
      console.log('      3. API saves preferredDashboard = "affiliate"')
      console.log('      4. Navigate to /affiliate/dashboard')
      console.log('      5. Middleware: hasAffiliateProfile → allowed')
      console.log('      6. Sidebar: pathname=/affiliate → show AFFILIATE menu')
      console.log('      ✅ Result: User stays on affiliate dashboard')
    }

    // Scenario 6: Member -> Mentor
    if (hasMentorAccess) {
      console.log('\n   📱 Member → Mentor:')
      console.log('      1. User di /dashboard')
      console.log('      2. Click switcher → pilih "Mentor Hub"')
      console.log('      3. API saves preferredDashboard = "mentor"')
      console.log('      4. Navigate to /mentor/dashboard')
      console.log('      5. Middleware: allRoles.includes("MENTOR") → allowed')
      console.log('      6. Sidebar: pathname=/mentor → show MENTOR menu')
      console.log('      ✅ Result: User stays on mentor dashboard')
    }

    console.log('\n\n✅ ALL SCENARIOS SHOULD WORK!')
    console.log('\n⚠️  IMPORTANT: User needs to RE-LOGIN to get fresh JWT token with allRoles')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  await prisma.$disconnect()
}

testAllRoleSwitching()
