#!/usr/bin/env node
/**
 * Check specific user role information
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserRole() {
  console.log('🔍 CHECKING USER ROLE INFORMATION')
  console.log('==================================\n')

  try {
    const email = 'azizbiasa@gmail.com'
    console.log(`📊 CHECKING USER: ${email}`)
    
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

    console.log(`\n✅ USER FOUND:`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   PRIMARY ROLE: ${user.role}`)
    console.log(`   Account Status: ${user.isActive ? 'Active' : 'Inactive'}`)
    console.log(`   Affiliate Menu Enabled: ${user.affiliateMenuEnabled}`)
    console.log(`   Created At: ${user.createdAt}`)

    console.log(`\n📋 ADDITIONAL ROLES (UserRole table):`)
    if (user.userRoles && user.userRoles.length > 0) {
      console.log(`   Total Additional Roles: ${user.userRoles.length}`)
      user.userRoles.forEach((userRole, index) => {
        console.log(`   ${index + 1}. Role: ${userRole.role}`)
        console.log(`      ID: ${userRole.id}`)
        console.log(`      Added: ${userRole.createdAt}`)
        console.log(`      ---`)
      })
    } else {
      console.log(`   No additional roles found`)
    }

    // Summary
    const allRoles = [user.role, ...user.userRoles.map(ur => ur.role)]
    console.log(`\n🎯 ROLE SUMMARY:`)
    console.log(`   Primary Role: ${user.role}`)
    console.log(`   All Roles: ${allRoles.join(', ')}`)
    console.log(`   Total Roles: ${allRoles.length}`)

    // Dashboard access
    console.log(`\n🎛️ DASHBOARD ACCESS:`)
    const dashboardAccess = []
    
    if (allRoles.includes('ADMIN')) {
      dashboardAccess.push('Admin Panel (/admin)')
    }
    if (allRoles.includes('MEMBER_FREE') || allRoles.includes('MEMBER_PREMIUM') || allRoles.length > 0) {
      dashboardAccess.push('Member Dashboard (/dashboard)')
    }
    if (allRoles.includes('AFFILIATE') || user.affiliateMenuEnabled) {
      dashboardAccess.push('Affiliate Dashboard (/affiliate)')
    }
    if (allRoles.includes('MENTOR')) {
      dashboardAccess.push('Mentor Hub (/mentor)')
    }

    dashboardAccess.forEach(access => {
      console.log(`   ✅ ${access}`)
    })

    // Check affiliate profile
    console.log(`\n🔗 AFFILIATE PROFILE:`)
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (affiliateProfile) {
      console.log(`   ✅ Has Affiliate Profile`)
      console.log(`   Code: ${affiliateProfile.affiliateCode}`)
      console.log(`   Status: ${affiliateProfile.status}`)
      console.log(`   Active: ${affiliateProfile.isActive}`)
    } else {
      console.log(`   ❌ No affiliate profile found`)
    }

    // Check wallet
    console.log(`\n💰 WALLET INFO:`)
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    })

    if (wallet) {
      console.log(`   ✅ Has Wallet`)
      console.log(`   Balance: Rp ${wallet.balance.toLocaleString()}`)
      console.log(`   Pending: Rp ${wallet.balancePending.toLocaleString()}`)
    } else {
      console.log(`   ❌ No wallet found`)
    }

    // Check affiliate links
    const affiliateLinksCount = await prisma.affiliateLink.count({
      where: { userId: user.id }
    })
    console.log(`\n🔗 AFFILIATE ACTIVITY:`)
    console.log(`   Affiliate Links: ${affiliateLinksCount}`)

    // Check transactions
    const affiliateTransactions = await prisma.transaction.count({
      where: { 
        affiliateId: user.id,
        status: 'SUCCESS'
      }
    })
    console.log(`   Successful Transactions: ${affiliateTransactions}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  await prisma.$disconnect()
}

checkUserRole().catch(console.error)