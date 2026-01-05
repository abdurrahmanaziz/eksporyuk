#!/usr/bin/env node

/**
 * COMPREHENSIVE SYSTEM AUDIT
 * Pendaftaran → Paket → Akses → Transaksi → Komisi → Saldo
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function runAudit() {
  console.log('\n' + '='.repeat(70))
  console.log('🔍 COMPREHENSIVE SYSTEM AUDIT')
  console.log('='.repeat(70) + '\n')

  try {
    // ============ 1. USER REGISTRATION CHECK ============
    console.log('\n1️⃣  USER REGISTRATION & ACCOUNT STATUS')
    console.log('-'.repeat(70))

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        isSuspended: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    console.log(`Total Users in System: ${await prisma.user.count()}`)
    console.log(`\nLatest 5 Users:`)
    users.forEach((u, i) => {
      console.log(`${i+1}. ${u.name} (${u.email})`)
      console.log(`   Role: ${u.role}, Active: ${u.isActive}, Email Verified: ${u.emailVerified ? '✅' : '❌'}`)
      console.log(`   Registered: ${u.createdAt.toISOString().split('T')[0]}`)
    })

    // ============ 2. MEMBERSHIP & PACKAGE CHECK ============
    console.log('\n\n2️⃣  MEMBERSHIP & PACKAGE CONFIGURATION')
    console.log('-'.repeat(70))

    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        commissionType: true,
        affiliateCommissionRate: true,
        isActive: true,
      }
    })

    console.log(`Total Packages: ${memberships.length}`)
    console.log(`\nPackage Configuration:`)
    memberships.forEach((m, i) => {
      console.log(`${i+1}. ${m.name}`)
      console.log(`   Price: Rp ${parseFloat(m.price).toLocaleString('id-ID')}`)
      console.log(`   Commission: ${m.commissionType} ${m.affiliateCommissionRate}`)
      console.log(`   Active: ${m.isActive ? '✅' : '❌'}`)
    })

    // ============ 3. USER MEMBERSHIPS & ACCESS ============
    console.log('\n\n3️⃣  USER MEMBERSHIP & ACCESS CONTROL')
    console.log('-'.repeat(70))

    const userMemberships = await prisma.userMembership.findMany({
      select: {
        id: true,
        userId: true,
        membershipId: true,
        isActive: true,
        endDate: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Get membership names separately
    const membershipMap = new Map()
    for (const um of userMemberships) {
      if (!membershipMap.has(um.membershipId)) {
        const m = await prisma.membership.findUnique({
          where: { id: um.membershipId },
          select: { name: true }
        })
        membershipMap.set(um.membershipId, m?.name || 'Unknown')
      }
    }

    // Get user names separately
    const userMap = new Map()
    for (const um of userMemberships) {
      if (!userMap.has(um.userId)) {
        const u = await prisma.user.findUnique({
          where: { id: um.userId },
          select: { name: true }
        })
        userMap.set(um.userId, u?.name || 'Unknown')
      }
    }

    console.log(`Total User Memberships: ${await prisma.userMembership.count()}`)
    console.log(`\nLatest 5 Memberships:`)
    userMemberships.forEach((um, i) => {
      const now = new Date()
      const isExpired = um.endDate && new Date(um.endDate) < now
      console.log(`${i+1}. ${userMap.get(um.userId)} - ${membershipMap.get(um.membershipId)}`)
      console.log(`   Active: ${um.isActive ? '✅' : '❌'}, Status: ${um.status}, Expired: ${isExpired ? '⚠️  YES' : '✅ NO'}`)
      console.log(`   Expires: ${um.endDate.toISOString().split('T')[0]}`)
    })

    // ============ 4. TRANSACTIONS CHECK ============
    console.log('\n\n4️⃣  TRANSACTION & PAYMENT STATUS')
    console.log('-'.repeat(70))

    const transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        paymentProvider: true,
        affiliateShare: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const txStats = {
      total: transactions.length,
      success: transactions.filter(t => t.status === 'SUCCESS').length,
      pending: transactions.filter(t => t.status === 'PENDING').length,
      failed: transactions.filter(t => t.status === 'FAILED').length,
    }

    console.log(`Total Transactions: ${await prisma.transaction.count()}`)
    console.log(`Status Breakdown: SUCCESS=${txStats.success}, PENDING=${txStats.pending}, FAILED=${txStats.failed}`)
    console.log(`\nLatest 10 Transactions:`)
    transactions.forEach((tx, i) => {
      console.log(`${i+1}. [${tx.status}] Rp ${tx.amount.toLocaleString('id-ID')}`)
      console.log(`   Provider: ${tx.paymentProvider}, Affiliate Share: ${tx.affiliateShare ? 'Rp ' + tx.affiliateShare.toLocaleString('id-ID') : '❌ NULL'}`)
      console.log(`   Date: ${tx.createdAt.toISOString().split('T')[0]}`)
    })

    // ============ 5. COMMISSION & WALLET CHECK ============
    console.log('\n\n5️⃣  COMMISSION & WALLET SYSTEM')
    console.log('-'.repeat(70))

    const wallets = await prisma.wallet.findMany({
      select: {
        id: true,
        userId: true,
        balance: true,
        balancePending: true,
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { balance: 'desc' },
      take: 5
    })

    console.log(`Total Wallets: ${await prisma.wallet.count()}`)
    console.log(`\nTop 5 Wallets by Balance:`)
    wallets.forEach((w, i) => {
      console.log(`${i+1}. ${w.user.name} (${w.user.role})`)
      console.log(`   Balance: Rp ${w.balance.toLocaleString('id-ID')}`)
      console.log(`   Pending: Rp ${w.balancePending.toLocaleString('id-ID')}`)
    })

    // ============ 6. AFFILIATE PROFILE CHECK ============
    console.log('\n\n6️⃣  AFFILIATE SYSTEM STATUS')
    console.log('-'.repeat(70))

    const affiliateProfiles = await prisma.affiliateProfile.findMany({
      select: {
        id: true,
        userId: true,
        isActive: true,
        totalEarnings: true,
        totalConversions: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { totalEarnings: 'desc' },
      take: 5
    })

    console.log(`Total Affiliate Profiles: ${await prisma.affiliateProfile.count()}`)
    console.log(`\nTop 5 Affiliates by Earnings:`)
    affiliateProfiles.forEach((ap, i) => {
      console.log(`${i+1}. ${ap.user.name}`)
      console.log(`   Total Earnings: Rp ${ap.totalEarnings.toLocaleString('id-ID')}`)
      console.log(`   Conversions: ${ap.totalConversions}, Active: ${ap.isActive ? '✅' : '❌'}`)
    })

    // ============ 7. DATABASE INTEGRITY CHECK ============
    console.log('\n\n7️⃣  DATABASE INTEGRITY & CONSISTENCY')
    console.log('-'.repeat(70))

    // Check orphaned records - simplified approach
    const allUsers = await prisma.user.findMany({
      select: { id: true }
    })
    const userIds = new Set(allUsers.map(u => u.id))

    const allTransactions = await prisma.transaction.findMany({
      select: { userId: true }
    })
    const transactionsWithoutUsers = allTransactions.filter(t => !userIds.has(t.userId)).length

    console.log(`Orphaned Records Check:`)
    console.log(`  • Transactions without users: ${transactionsWithoutUsers}`)
    console.log(`  • Note: Can't detect other orphaned records without schema relations`)

    if (transactionsWithoutUsers === 0) {
      console.log(`✅ Transaction-User relationships intact`)
    } else {
      console.log(`⚠️  WARNING: Orphaned transaction records detected!`)
    }

    // ============ 8. INTEGRATION STATUS CHECK ============
    console.log('\n\n8️⃣  SYSTEM INTEGRATION STATUS')
    console.log('-'.repeat(70))

    // Check Xendit transactions
    const xenditTxs = await prisma.transaction.findMany({
      where: { paymentProvider: 'XENDIT' },
      select: { id: true, externalId: true }
    })

    console.log(`Payment Integration:`)
    console.log(`  • Xendit Transactions: ${xenditTxs.length}`)
    console.log(`  • Missing External IDs: ${xenditTxs.filter(t => !t.externalId).length}`)

    // Check notifications
    const notificationLogs = await prisma.activityLog.findMany({
      where: { action: { contains: 'EMAIL' } },
      select: { action: true },
      distinct: ['action']
    })

    console.log(`\nNotification Integration:`)
    console.log(`  • Email notifications logged: ${notificationLogs.length > 0 ? '✅' : '⚠️ '}`)

    // ============ SUMMARY ============
    console.log('\n\n' + '='.repeat(70))
    console.log('✅ AUDIT COMPLETE')
    console.log('='.repeat(70))
    console.log('\nNext Steps:')
    console.log('1. Run detailed flow tests (registration → purchase → commission)')
    console.log('2. Verify webhook integrations are working')
    console.log('3. Test affiliate link tracking')
    console.log('4. Validate email notifications')
    console.log('5. Check payment provider callbacks\n')

  } catch (error) {
    console.error('❌ Audit Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

runAudit()
