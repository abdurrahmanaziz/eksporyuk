#!/usr/bin/env node

/**
 * DIAGNOSTIC SCRIPT: Membership Purchase & Activation Flow Audit
 * 
 * This script audits:
 * 1. Payment webhook trigger and membership creation
 * 2. UserMembership activation status
 * 3. User role upgrade from MEMBER_FREE to MEMBER_PREMIUM
 * 4. Group & Course auto-assignment
 * 5. Session/Cache invalidation after payment
 * 6. Dashboard access permissions
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

const log = {
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  debug: (msg) => console.log(`${colors.gray}🔍 ${msg}${colors.reset}`),
}

async function main() {
  log.info('🏥 MEMBERSHIP ACTIVATION FLOW DIAGNOSTIC')
  log.info('==========================================\n')

  try {
    // 1. Find recent membership transactions
    log.info('1️⃣  SCANNING RECENT MEMBERSHIP TRANSACTIONS')
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    if (recentTransactions.length === 0) {
      log.warn('No recent membership transactions found in past 7 days')
      log.info('\nTrying to find ANY membership transactions...')
      const anyTransactions = await prisma.transaction.findMany({
        where: { type: 'MEMBERSHIP' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      if (anyTransactions.length === 0) {
        log.error('No membership transactions found at all')
        return
      }

      log.info(`Found ${anyTransactions.length} total membership transactions. Using oldest for analysis...`)
      await analyzeTransaction(anyTransactions[0])
    } else {
      log.success(`Found ${recentTransactions.length} recent membership transactions`)
      
      // Analyze most recent
      const mostRecent = recentTransactions[0]
      log.info(`\nAnalyzing most recent: ${mostRecent.id}`)
      await analyzeTransaction(mostRecent)

      // Check for patterns in failures
      log.info('\n\n📊 SCANNING FOR ACTIVATION PATTERNS')
      const statusCounts = {}
      for (const tx of recentTransactions) {
        statusCounts[tx.status] = (statusCounts[tx.status] || 0) + 1
      }
      
      log.info('Transaction status distribution:')
      for (const [status, count] of Object.entries(statusCounts)) {
        log.info(`  ${status}: ${count}`)
      }

      // Find SUCCESS transactions without memberships
      const successWithoutMemberships = await prisma.transaction.findMany({
        where: {
          type: 'MEMBERSHIP',
          status: 'SUCCESS'
        },
        take: 5
      })

      if (successWithoutMemberships.length > 0) {
        log.error(`\n⚠️  CRITICAL: Found ${successWithoutMemberships.length} SUCCESS transactions WITHOUT UserMembership records!`)
        log.info('These payments succeeded but membership was never activated:')
        for (const tx of successWithoutMemberships) {
      if (successWithoutMemberships.length > 0) {
        log.warn(`\n⚠️  Found ${successWithoutMemberships.length} SUCCESS transactions - checking if UserMembership exists...`)
        for (const tx of successWithoutMemberships) {
          const um = await prisma.userMembership.findFirst({
            where: { transactionId: tx.id }
          })
          if (!um) {
            log.error(`  ✗ ${tx.id} - SUCCESS but NO UserMembership!`)
          } else {
            log.success(`  ✓ ${tx.id} - Has UserMembership (${um.status})`)
          }
        }
      }.info('\n\n2️⃣  CHECKING MEMBERSHIP ACTIVATION ISSUES')
    const membershipsWithoutStatus = await prisma.userMembership.findMany({
      where: {
        status: { not: 'ACTIVE' }
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        membership: { select: { name: true } }
      },
      take: 10
    })

    if (membershipsWithoutMemberships > 0) {
      log.warn(`Found ${membershipsWithoutStatus.length} inactive user memberships:`)
      for (const um of membershipsWithoutStatus) {
        log.warn(`  - ${um.user?.name} (${um.user?.email}): ${um.membership?.name} - Status: ${um.status}`)
      }
    }

    // 3. Check for role upgrade failures
    log.info('\n\n3️⃣  CHECKING USER ROLE UPGRADES')
    const premiumMembers = await prisma.user.findMany({
      where: { role: 'MEMBER_PREMIUM' },
      select: { id: true, name: true, email: true, createdAt: true },
      take: 5
    const freeMembersWithMemberships = await prisma.user.findMany({
      where: {
        role: 'MEMBER_FREE'
      },
      take: 10
    })
    
    const freeWithActiveMemberships = []
    for (const user of freeMembersWithMemberships) {
      const activeMemberships = await prisma.userMembership.findMany({
        where: {
          userId: user.id,
          isActive: true
        }
    if (freeWithActiveMemberships.length > 0) {
      log.error(`\n🚨 CRITICAL: Found ${freeWithActiveMemberships.length} MEMBER_FREE users with ACTIVE memberships!`)
      log.error('These should have been upgraded to MEMBER_PREMIUM:')
      for (const user of freeWithActiveMemberships) {
        log.error(`  - ${user.name} (${user.email}): ${user.activeCount} active membership(s)`)
      }
    } else {
      log.success('✓ No MEMBER_FREE users with active memberships found (role upgrade works)')
    }f (freeMembersWithMemberships.length > 0) {
      log.error(`\n🚨 CRITICAL: Found ${freeMembersWithMemberships.length} MEMBER_FREE users with ACTIVE memberships!`)
      log.error('These should have been upgraded to MEMBER_PREMIUM:')
      for (const user of freeMembersWithMemberships) {
        log.error(`  - ${user.name} (${user.email}): Has ${user.userMembership.map(m => m.membership?.name).join(', ')}`)
      }
    } else {
      log.success('✓ No MEMBER_FREE users with active memberships found (role upgrade works)')
    }

    // 4. Check group/course assignments
    log.info('\n\n4️⃣  CHECKING GROUP & COURSE AUTO-ASSIGNMENT')
    
    const membershipsWithGroups = await prisma.membership.findMany({
      where: {
        membershipGroup: { some: {} }
      },
      include: {
        membershipGroup: { select: { groupId: true } },
        _count: { select: { membershipGroup: true } }
      },
      take: 5
    })

    log.info(`Found ${membershipsWithGroups.length} memberships with group assignments`)

    for (const membership of membershipsWithGroups) {
      const groupIds = membership.membershipGroup.map(mg => mg.groupId)
      
      // Check if users with this membership are in groups
      const usersWithMembership = await prisma.userMembership.findMany({
        where: { membershipId: membership.id, isActive: true },
        select: { userId: true },
        take: 3
      })

      for (const um of usersWithMembership) {
        const userGroupMembers = await prisma.groupMember.findMany({
          where: { userId: um.userId, groupId: { in: groupIds } },
          select: { groupId: true }
        })

        const assignedGroupIds = new Set(userGroupMembers.map(gm => gm.groupId))
        const missingGroups = groupIds.filter(gid => !assignedGroupIds.has(gid))

        if (missingGroups.length > 0) {
          log.warn(`User ${um.userId} missing from ${missingGroups.length} groups despite active membership`)
        }
      }
    }

    // 5. Check webhook processing
    log.info('\n\n5️⃣  CHECKING XENDIT WEBHOOK PROCESSING')
    
    const recentPaidTransactions = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        status: 'SUCCESS',
        paidAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
    let webhookSuccessCount = 0
    let webhookFailureCount = 0

    for (const tx of recentPaidTransactions) {
      const um = await prisma.userMembership.findFirst({
        where: { transactionId: tx.id }
      })
      
      if (um) {
        if (um.status === 'ACTIVE') {
          webhookSuccessCount++
          const delayMs = um.activatedAt ? new Date(um.activatedAt).getTime() - new Date(tx.paidAt).getTime() : 0
          const delaySec = Math.round(delayMs / 1000)
          log.debug(`  ✓ ${tx.id}: Activated within ${delaySec}s`)
        } else {
          webhookFailureCount++
          log.warn(`  ✗ ${tx.id}: Payment successful but status is ${um.status}`)
        }
      } else {
        webhookFailureCount++
        log.error(`  ✗ ${tx.id}: No UserMembership created despite SUCCESS status`)
      }
    }   } else {
          webhookFailureCount++
          log.warn(`  ✗ ${tx.id}: Payment successful but status is ${um.status}`)
        }
      } else {
        webhookFailureCount++
        log.error(`  ✗ ${tx.id}: No UserMembership created despite SUCCESS status`)
      }
    }

    if (webhookSuccessCount > 0 || webhookFailureCount > 0) {
      log.info(`\nWebhook activation success rate: ${webhookSuccessCount}/${webhookSuccessCount + webhookFailureCount}`)
      if (webhookFailureCount > 0) {
        log.warn(`${webhookFailureCount} transactions failed to activate`)
    const issues = []

    if (freeWithActiveMemberships.length > 0) {
      issues.push({
        severity: 'CRITICAL',
        title: 'User role not upgraded after payment',
        description: `${freeWithActiveMemberships.length} MEMBER_FREE users have active memberships but weren't upgraded to MEMBER_PREMIUM`,
        fix: 'Check webhook handler activateMembership() function - role upgrade logic may be skipped'
      })
    }f (successWithoutMemberships && successWithoutMemberships.length > 0) {
      issues.push({
        severity: 'CRITICAL',
        title: 'Membership not created after successful payment',
        description: `${successWithoutMemberships.length} transactions marked SUCCESS but no UserMembership created`,
        fix: 'Check webhook handler - membership creation logic may not be executing or has errors'
      })
    }

    if (issues.length === 0) {
      log.success('\n✅ All core systems appear to be functioning correctly!')
      log.info('\nCommon issues to check manually:')
      log.info('  1. User session needs refresh - try logging out and back in')
      log.info('  2. Check browser cache - clear localStorage and cookies')
      log.info('  3. Verify membership duration settings - check if endDate is far in future')
      log.info('  4. Check middleware permissions - ensure role-based redirects work')
    } else {
      log.error(`\n🚨 Found ${issues.length} issues:`)
      for (const issue of issues) {
        log.error(`\n${issue.severity}: ${issue.title}`)
        log.info(`Description: ${issue.description}`)
        log.info(`Fix: ${issue.fix}`)
      }
    }

  } catch (error) {
    log.error(`Audit failed: ${error.message}`)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

async function analyzeTransaction(transaction) {
  const txId = transaction.id
async function analyzeTransaction(transaction) {
  const txId = transaction.id
  const userId = transaction.userId
  
  // Fetch user for context
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, role: true }
  })

  log.debug(`Transaction: ${txId}`)
  log.debug(`User: ${user?.name} (${user?.email}) - Role: ${user?.role}`)
  log.debug(`Status: ${transaction.status}`)
  log.debug(`Amount: ${transaction.amount}`)
  log.debug(`Created: ${transaction.createdAt}`)
  log.debug(`Paid: ${transaction.paidAt || 'Not paid'}`)
  const userMemberships = await prisma.userMembership.findMany({
    where: { transactionId: txId },
    include: {
      membership: { select: { name: true, duration: true } }
    }
  })

  if (userMemberships.length === 0) {
    log.error('❌ No UserMembership record found for this transaction')
    log.error('   → Membership was NOT activated despite transaction success')
  } else {
    log.success(`✓ UserMembership created: ${userMemberships[0].membership?.name}`)
    log.debug(`  Status: ${userMemberships[0].status}`)
    log.debug(`  Active: ${userMemberships[0].isActive}`)
    log.debug(`  Start: ${userMemberships[0].startDate}`)
    log.debug(`  End: ${userMemberships[0].endDate}`)
  // Check user role
  if (user?.role === 'MEMBER_FREE') {

  if (user?.role === 'MEMBER_FREE') {
    log.error(`❌ User still has MEMBER_FREE role`)
    log.error('   → Should have been upgraded to MEMBER_PREMIUM after purchase')
  } else if (user?.role === 'MEMBER_PREMIUM') {
    log.success(`✓ User role is MEMBER_PREMIUM`)
  } else {
    log.debug(`  User role: ${user?.role}`)
  }

  // Check group assignments
  const membership = await prisma.membership.findFirst({
    where: {
      userMembership: {
        some: { transactionId: txId }
      }
    },
    include: {
      membershipGroup: { select: { groupId: true } }
    }
  })

  if (membership && membership.membershipGroup.length > 0) {
    const groupIds = membership.membershipGroup.map(mg => mg.groupId)
    const userGroups = await prisma.groupMember.findMany({
      where: { userId, groupId: { in: groupIds } }
    })

    log.info(`\nGroup Assignments:`)
    log.debug(`  Membership includes: ${groupIds.length} groups`)
    log.debug(`  User is member of: ${userGroups.length} groups`)

    if (userGroups.length < groupIds.length) {
      const assignedGroupIds = new Set(userGroups.map(gm => gm.groupId))
      const missingGroupIds = groupIds.filter(gid => !assignedGroupIds.has(gid))
      log.warn(`  Missing from: ${missingGroupIds.length} groups`)
    } else {
      log.success(`✓ User assigned to all membership groups`)
    }
  }
}

main().catch(console.error)
