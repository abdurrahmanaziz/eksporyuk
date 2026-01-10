/**
 * TEST ROLE SWITCHER FUNCTIONALITY
 * Test apakah user premium + affiliate mendapat 2 role dan role switcher aktif
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testRoleSwitcher() {
  try {
    console.log('🔍 Testing Role Switcher Functionality...')
    
    // Find premium users
    const premiumUsers = await prisma.user.findMany({
      where: {
        role: 'MEMBER_PREMIUM',
        affiliateMenuEnabled: true
      },
      include: {
        userRoles: true,
        affiliateProfile: true
      },
      take: 5
    })
    
    console.log(`\n📊 Found ${premiumUsers.length} premium users with affiliate access:\n`)
    
    for (const user of premiumUsers) {
      console.log(`👤 User: ${user.name} (${user.email})`)
      console.log(`   Primary Role: ${user.role}`)
      console.log(`   Affiliate Menu: ${user.affiliateMenuEnabled ? '✅ Enabled' : '❌ Disabled'}`)
      console.log(`   Additional Roles: ${user.userRoles.map(ur => ur.role).join(', ') || 'None'}`)
      console.log(`   Affiliate Profile: ${user.affiliateProfile ? 
        `✅ Active (${user.affiliateProfile.affiliateCode})` : '❌ Not found'
      }`)
      
      // Check dashboard options this user would get
      const allRoles = new Set()
      allRoles.add(user.role)
      user.userRoles.forEach(ur => allRoles.add(ur.role))
      
      const dashboardOptions = []
      const hasMemberRole = allRoles.has('MEMBER_FREE') || allRoles.has('MEMBER_PREMIUM')
      const hasAffiliateRole = allRoles.has('AFFILIATE')
      const hasAffiliateAccess = hasAffiliateRole || (user.affiliateMenuEnabled && user.affiliateProfile?.isActive)
      
      if (hasMemberRole || hasAffiliateRole) {
        dashboardOptions.push('Member Dashboard')
      }
      
      if (hasAffiliateAccess) {
        dashboardOptions.push('Affiliate Dashboard')
      }
      
      console.log(`   Dashboard Options: ${dashboardOptions.join(', ')}`)
      console.log(`   Role Switcher: ${dashboardOptions.length > 1 ? '✅ Will Show' : '❌ Hidden'}`)
      console.log()
    }
    
    // Check users without affiliate access
    const memberOnlyUsers = await prisma.user.findMany({
      where: {
        role: 'MEMBER_PREMIUM',
        affiliateMenuEnabled: false
      },
      take: 3
    })
    
    if (memberOnlyUsers.length > 0) {
      console.log(`\n📝 Premium users WITHOUT affiliate access (${memberOnlyUsers.length}):\n`)
      for (const user of memberOnlyUsers) {
        console.log(`👤 ${user.name} - Role Switcher: ❌ Hidden (single role only)`)
      }
    }
    
    // Check if any user needs auto-upgrade
    console.log('\n🔧 Checking for users that need auto-upgrade...')
    const needsUpgrade = await prisma.user.findMany({
      where: {
        role: 'MEMBER_PREMIUM',
        affiliateMenuEnabled: false
      }
    })
    
    console.log(`Found ${needsUpgrade.length} premium users without affiliate access`)
    
    if (needsUpgrade.length > 0) {
      console.log('\n⚡ You can run this to auto-upgrade them:')
      console.log('node auto-enable-affiliate-for-premium.js')
    }
    
    console.log('\n✅ Role Switcher test completed!')
    
  } catch (error) {
    console.error('❌ Test error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testRoleSwitcher()