/**
 * Script: Fix Expired Memberships
 * 
 * Purpose: 
 * 1. Update all expired memberships (endDate < now) to status EXPIRED
 * 2. Downgrade users without active membership to MEMBER_FREE
 * 3. Fix Transaction membershipId field from metadata
 * 
 * Run: node scripts/fix-expired-memberships.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=================================================')
  console.log('  FIX EXPIRED MEMBERSHIPS & DATA CONSISTENCY')
  console.log('=================================================\n')

  const now = new Date()

  // ========================================
  // STEP 1: Update expired memberships
  // ========================================
  console.log('📋 STEP 1: Updating expired memberships...\n')

  const expiredMemberships = await prisma.userMembership.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: now }
    },
    data: {
      status: 'EXPIRED',
      isActive: false,
      updatedAt: now
    }
  })

  console.log(`✅ Updated ${expiredMemberships.count} memberships to EXPIRED\n`)

  // ========================================
  // STEP 2: Downgrade users without active membership
  // ========================================
  console.log('📋 STEP 2: Finding users to downgrade...\n')

  // Find MEMBER_PREMIUM users without any active membership
  const usersToDowngrade = await prisma.$queryRaw`
    SELECT u.id, u.email, u.name
    FROM "User" u
    WHERE u.role = 'MEMBER_PREMIUM'
    AND NOT EXISTS (
      SELECT 1 FROM "UserMembership" um 
      WHERE um."userId" = u.id 
        AND um.status = 'ACTIVE' 
        AND um."isActive" = true 
        AND um."endDate" >= ${now}
    )
  `

  console.log(`Found ${usersToDowngrade.length} MEMBER_PREMIUM users to downgrade\n`)

  if (usersToDowngrade.length > 0) {
    // Show first 10 users to be downgraded
    console.log('Sample users to downgrade:')
    usersToDowngrade.slice(0, 10).forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email} (${u.name})`)
    })
    if (usersToDowngrade.length > 10) {
      console.log(`  ... and ${usersToDowngrade.length - 10} more`)
    }
    console.log('')

    // Downgrade users in batch
    const userIds = usersToDowngrade.map(u => u.id)
    const downgradeResult = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { 
        role: 'MEMBER_FREE',
        updatedAt: now
      }
    })

    console.log(`✅ Downgraded ${downgradeResult.count} users to MEMBER_FREE\n`)
  }

  // ========================================
  // STEP 3: Fix Transaction membershipId from metadata
  // ========================================
  console.log('📋 STEP 3: Fixing Transaction membershipId...\n')

  // Find transactions with membershipId in metadata but not in field
  const transactionsToFix = await prisma.transaction.findMany({
    where: {
      type: 'MEMBERSHIP',
      membershipId: null,
      metadata: { not: null }
    },
    select: {
      id: true,
      metadata: true
    }
  })

  let fixedCount = 0
  for (const tx of transactionsToFix) {
    try {
      const metadata = typeof tx.metadata === 'string' 
        ? JSON.parse(tx.metadata) 
        : tx.metadata

      if (metadata?.membershipId) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { membershipId: metadata.membershipId }
        })
        fixedCount++
      }
    } catch (err) {
      console.error(`  Error fixing transaction ${tx.id}:`, err.message)
    }
  }

  console.log(`✅ Fixed ${fixedCount} transactions with membershipId\n`)

  // ========================================
  // FINAL SUMMARY
  // ========================================
  console.log('=================================================')
  console.log('                    SUMMARY')
  console.log('=================================================')

  // Get final counts
  const finalCounts = await prisma.$queryRaw`
    SELECT 
      (SELECT COUNT(*)::int FROM "User" WHERE role = 'MEMBER_FREE') as free_members,
      (SELECT COUNT(*)::int FROM "User" WHERE role = 'MEMBER_PREMIUM') as premium_members,
      (SELECT COUNT(*)::int FROM "UserMembership" WHERE status = 'ACTIVE') as active_memberships,
      (SELECT COUNT(*)::int FROM "UserMembership" WHERE status = 'EXPIRED') as expired_memberships,
      (SELECT COUNT(*)::int FROM "UserMembership" WHERE status = 'ACTIVE' AND "endDate" < NOW()) as still_bad
  `

  const c = finalCounts[0]
  console.log(`
📊 Final Database State:
   - MEMBER_FREE: ${c.free_members}
   - MEMBER_PREMIUM: ${c.premium_members}
   - Active Memberships: ${c.active_memberships}
   - Expired Memberships: ${c.expired_memberships}
   - Still problematic (ACTIVE but expired): ${c.still_bad}
`)

  if (c.still_bad > 0) {
    console.log('⚠️  WARNING: There are still some inconsistent records!')
  } else {
    console.log('✅ All data is now consistent!')
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('Error:', e)
  await prisma.$disconnect()
  process.exit(1)
})
