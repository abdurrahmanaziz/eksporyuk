#!/usr/bin/env node

/**
 * Deactivate Member Free Membership
 * 
 * Member Free is a default USER ROLE, not a sellable membership package.
 * This script sets isActive=false so it won't appear in any checkout or listing.
 * 
 * Usage: node deactivate-member-free.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deactivateMemberFree() {
  console.log('🔧 Starting Member Free deactivation...\n')

  try {
    // Find Member Free membership
    const memberFree = await prisma.membership.findFirst({
      where: {
        OR: [
          { slug: 'member-free' },
          { name: { contains: 'Member Free', mode: 'insensitive' } }
        ]
      }
    })

    if (!memberFree) {
      console.log('✅ Member Free membership not found - already removed or never existed')
      return
    }

    console.log('📦 Found Member Free:')
    console.log(`   ID: ${memberFree.id}`)
    console.log(`   Name: ${memberFree.name}`)
    console.log(`   Slug: ${memberFree.slug}`)
    console.log(`   Current Status: ${memberFree.isActive ? 'ACTIVE' : 'INACTIVE'}`)
    console.log('')

    if (!memberFree.isActive) {
      console.log('✅ Member Free is already inactive - no action needed')
      return
    }

    // Update to inactive and hide from general checkout
    const updated = await prisma.membership.update({
      where: { id: memberFree.id },
      data: {
        isActive: false,
        showInGeneralCheckout: false,
        status: 'ARCHIVED'
      }
    })

    console.log('✅ Member Free has been deactivated!')
    console.log(`   New Status: ${updated.isActive ? 'ACTIVE' : 'INACTIVE'}`)
    console.log(`   Show in Checkout: ${updated.showInGeneralCheckout ? 'YES' : 'NO'}`)
    console.log(`   Status: ${updated.status}`)
    console.log('')
    console.log('📝 Summary:')
    console.log('   - Member Free will NOT appear in /checkout/pro')
    console.log('   - Member Free will NOT appear in admin list (filtered by client)')
    console.log('   - Users still get MEMBER_FREE role on registration')
    console.log('   - Existing users with role MEMBER_FREE are unaffected')
    console.log('')
    console.log('🎯 User Flow:')
    console.log('   Register → role: MEMBER_FREE (automatic)')
    console.log('   Buy Membership → role: MEMBER_PREMIUM (automatic upgrade)')

  } catch (error) {
    console.error('❌ Error deactivating Member Free:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
deactivateMemberFree()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
