#!/usr/bin/env node
/**
 * Test dashboard switcher fix
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDashboardSwitcher() {
  console.log('🧪 TESTING DASHBOARD SWITCHER FIX')
  console.log('=================================\n')

  try {
    const email = 'azizbiasa@gmail.com'
    console.log(`🔍 Testing user: ${email}`)
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    // Simulate JWT token creation logic
    const userRoles = user.userRoles
    const allRoles = [user.role, ...userRoles.map(ur => ur.role)]
    
    console.log(`\n📊 ROLE ANALYSIS:`)
    console.log(`   Primary Role: ${user.role}`)
    console.log(`   Additional Roles: ${userRoles.map(ur => ur.role).join(', ') || 'None'}`)
    console.log(`   All Roles Array: [${allRoles.join(', ')}]`)

    console.log(`\n🎛️ MIDDLEWARE ACCESS TEST:`)
    
    // Test mentor access
    const hasMentorAccess = allRoles.includes('MENTOR') || allRoles.includes('ADMIN')
    console.log(`   /mentor/* → ${hasMentorAccess ? '✅ ALLOWED' : '❌ BLOCKED'}`)
    console.log(`     Logic: allRoles.includes('MENTOR') = ${allRoles.includes('MENTOR')}`)
    console.log(`     Logic: allRoles.includes('ADMIN') = ${allRoles.includes('ADMIN')}`)
    
    // Test affiliate access
    const hasAffiliateAccess = allRoles.includes('AFFILIATE') || allRoles.includes('ADMIN') || user.affiliateMenuEnabled
    console.log(`   /affiliate/* → ${hasAffiliateAccess ? '✅ ALLOWED' : '❌ BLOCKED'}`)
    console.log(`     Logic: allRoles.includes('AFFILIATE') = ${allRoles.includes('AFFILIATE')}`)
    console.log(`     Logic: user.affiliateMenuEnabled = ${user.affiliateMenuEnabled}`)

    console.log(`\n🔄 EXPECTED SWITCHER BEHAVIOR:`)
    const availableDashboards = []
    
    if (allRoles.includes('MEMBER_FREE') || allRoles.includes('MEMBER_PREMIUM') || allRoles.length > 1) {
      availableDashboards.push('Member Dashboard')
    }
    
    if (hasAffiliateAccess) {
      availableDashboards.push('Affiliate Dashboard')
    }
    
    if (hasMentorAccess) {
      availableDashboards.push('Mentor Hub')
    }
    
    if (allRoles.includes('ADMIN')) {
      availableDashboards.push('Admin Panel')
    }
    
    console.log(`   Available Dashboards: ${availableDashboards.join(', ')}`)
    console.log(`   Should show switcher: ${availableDashboards.length > 1 ? 'YES' : 'NO'} (${availableDashboards.length} dashboards)`)

    console.log(`\n✨ CONCLUSION:`)
    if (hasMentorAccess) {
      console.log(`   🎉 User can now access /mentor/dashboard!`)
      console.log(`   🔄 Dashboard switcher should work properly`)
      console.log(`   📍 From affiliate dashboard → mentor dashboard should work`)
    } else {
      console.log(`   ❌ User still cannot access mentor dashboard`)
      console.log(`   📝 Check if MENTOR role exists in UserRole table`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  await prisma.$disconnect()
}

testDashboardSwitcher().catch(console.error)