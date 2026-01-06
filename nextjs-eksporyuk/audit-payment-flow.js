#!/usr/bin/env node

/**
 * AUDIT: Payment -> Membership Activation Flow
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const log = {
  error: (msg) => console.error(`❌ ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  debug: (msg) => console.log(`🔍 ${msg}`),
}

async function main() {
  log.info('=== MEMBERSHIP ACTIVATION SYSTEM AUDIT ===\n')

  try {
    // 1. Check for SUCCESS transactions WITHOUT UserMembership
    log.info('1️⃣  CRITICAL CHECK: SUCCESS Transactions with Missing UserMembership')
    const successTxWithoutUM = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP', status: 'SUCCESS' },
      take: 10
    })

    let criticalCount = 0
    for (const tx of successTxWithoutUM) {
      const um = await prisma.userMembership.findFirst({
        where: { transactionId: tx.id }
      })
      if (!um) {
        criticalCount++
        const user = await prisma.user.findUnique({
          where: { id: tx.userId },
          select: { name: true, email: true }
        })
        log.error(`   [${tx.id}] SUCCESS but NO UserMembership - User: ${user?.name}`)
      }
    }

    if (criticalCount === 0) {
      log.success(`   All ${successTxWithoutUM.length} SUCCESS transactions have UserMembership`)
    } else {
      log.error(`   CRITICAL: ${criticalCount} transactions missing UserMembership!`)
    }

    // 2. Check MEMBER_FREE users with active memberships
    log.info('\n2️⃣  CRITICAL CHECK: MEMBER_FREE Users with Active Memberships')
    const freeUsers = await prisma.user.findMany({
      where: { role: 'MEMBER_FREE' },
      take: 20
    })

    let freeWithActive = 0
    for (const user of freeUsers) {
      const activeMemberships = await prisma.userMembership.count({
        where: { userId: user.id, isActive: true }
      })
      if (activeMemberships > 0) {
        freeWithActive++
        log.error(`   [${user.id}] ${user.name} (${user.email}) - MEMBER_FREE but has ${activeMemberships} active membership!`)
      }
    }

    if (freeWithActive === 0) {
      log.success(`   All MEMBER_FREE users have no active memberships`)
    } else {
      log.error(`   CRITICAL: ${freeWithActive} MEMBER_FREE users with active memberships!`)
    }

    // 3. Check recent payments and membership activation time
    log.info('\n3️⃣  WEBHOOK ACTIVATION DELAY CHECK')
    const recentPaid = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        status: 'SUCCESS',
        paidAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      take: 10
    })

    if (recentPaid.length === 0) {
      log.info('   No recent payments in last 24 hours')
    } else {
      for (const tx of recentPaid) {
        const um = await prisma.userMembership.findFirst({
          where: { transactionId: tx.id }
        })
        if (um && um.activatedAt && tx.paidAt) {
          const delay = new Date(um.activatedAt).getTime() - new Date(tx.paidAt).getTime()
          const delaySec = Math.round(delay / 1000)
          if (delaySec > 5) {
            log.warn(`   [${tx.id}] ${delaySec}s delay between payment and activation`)
          } else {
            log.debug(`   [${tx.id}] ${delaySec}s delay - OK`)
          }
        }
      }
    }

    // 4. Check dashboard access after membership
    log.info('\n4️⃣  DASHBOARD ACCESS CHECK')
    const premiumUsers = await prisma.user.findMany({
      where: { role: 'MEMBER_PREMIUM' },
      take: 5
    })

    for (const user of premiumUsers) {
      const membershipCount = await prisma.userMembership.count({
        where: { userId: user.id, isActive: true }
      })
      const groupCount = await prisma.groupMember.count({
        where: { userId: user.id }
      })
      const courseCount = await prisma.courseEnrollment.count({
        where: { userId: user.id }
      })
      log.debug(`   ${user.name}: ${membershipCount} active memberships, ${groupCount} groups, ${courseCount} courses`)
    }

    // 5. Summary and recommendations
    log.info('\n📋 AUDIT SUMMARY')
    log.info('=' .repeat(40))

    if (criticalCount > 0 || freeWithActive > 0) {
      log.error(`\n🚨 FOUND ${criticalCount + freeWithActive} CRITICAL ISSUES!\n`)

      if (criticalCount > 0) {
        log.error(`ISSUE 1: ${criticalCount} SUCCESS payments without membership activation`)
        log.info('ROOT CAUSE: Xendit webhook handler may not be executing')
        log.info('LOCATIONS TO CHECK:')
        log.info('  - /src/app/api/webhooks/xendit/route.ts - handleInvoicePaid()')
        log.info('  - Check if webhook is being triggered (test via Xendit dashboard)')
        log.info('  - Check logs for webhook processing errors')
        log.info('ACTION: Manually activate membership in admin/sales panel to test')
      }

      if (freeWithActive > 0) {
        log.error(`\nISSUE 2: ${freeWithActive} MEMBER_FREE users have active memberships`)
        log.info('ROOT CAUSE: Role upgrade logic skipped or failed during payment')
        log.info('LOCATION: /src/lib/membership-helper.ts - activateMembership()')
        log.info('ACTION: Check webhook handler for errors during membership creation')
      }

    } else {
      log.success('\n✅ All core systems operational!')
      log.info('\nIf users still can\'t access dashboards:')
      log.info('1. Check browser cache - clear localStorage, cookies')
      log.info('2. Try logout/login to refresh session')
      log.info('3. Verify membership end date in database')
      log.info('4. Check role-based middleware in /src/middleware.ts')
    }

  } catch (error) {
    log.error(`Audit failed: ${error.message}`)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
