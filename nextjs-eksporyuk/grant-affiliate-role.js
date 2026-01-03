#!/usr/bin/env node

/**
 * Grant AFFILIATE role to members who have APPROVED affiliate profiles
 * Usage: node grant-affiliate-role.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function grantAffiliateRoles() {
  try {
    console.log('🔍 Finding members with APPROVED affiliate status but no AFFILIATE role...\n')

    // Find all users with APPROVED affiliate status
    const affiliates = await prisma.user.findMany({
      where: {
        affiliateProfile: {
          applicationStatus: 'APPROVED',
          isActive: true,
        },
      },
      include: {
        affiliateProfile: true,
      },
    })

    // Filter those who don't have AFFILIATE role
    const needsRole = affiliates.filter(
      user => user.role !== 'AFFILIATE' && user.role !== 'ADMIN'
    )

    console.log(`📊 Summary:`)
    console.log(`  Total with APPROVED affiliate profile: ${affiliates.length}`)
    console.log(`  Need AFFILIATE role granted: ${needsRole.length}\n`)

    if (needsRole.length === 0) {
      console.log('✅ All approved affiliates already have AFFILIATE role!')
      return
    }

    // Show details
    console.log('👥 Users that will get AFFILIATE role:')
    needsRole.forEach(user => {
      console.log(`  - ${user.email} (Current role: ${user.role}) → AFFILIATE`)
    })
    console.log()

    // Grant role
    console.log('⏳ Granting AFFILIATE role...')
    let successCount = 0
    let errorCount = 0

    for (const user of needsRole) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'AFFILIATE' },
        })
        console.log(`  ✓ ${user.email}`)
        successCount++
      } catch (error) {
        console.error(`  ✗ ${user.email}: ${error.message}`)
        errorCount++
      }
    }

    console.log()
    console.log('✅ Role grant complete!')
    console.log(`  Successfully updated: ${successCount}`)
    if (errorCount > 0) {
      console.log(`  Errors: ${errorCount}`)
    }
    console.log()

    // Show final summary
    const finalCount = await prisma.user.count({
      where: {
        role: 'AFFILIATE',
        affiliateProfile: {
          applicationStatus: 'APPROVED',
        },
      },
    })

    console.log(`📈 Final: ${finalCount} approved affiliates now have AFFILIATE role`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

grantAffiliateRoles()
