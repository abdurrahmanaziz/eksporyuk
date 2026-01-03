#!/usr/bin/env node

/**
 * Transaction & Commission Consistency Audit
 * Usage: node audit-transaction-consistency.js
 * 
 * Checks for:
 * - Transactions without commission breakdown
 * - Commission mismatches
 * - Wallet balance discrepancies
 * - Pending revenue orphans
 * - Missing affiliate conversions
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function auditConsistency() {
  try {
    console.log('🔍 Transaction & Commission Consistency Audit\n')
    console.log('='.repeat(60))

    // 1. Check transactions without commission breakdown
    console.log('\n1️⃣  Checking transactions without commission breakdown...')
    const transactionsNoBreakdown = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        OR: [
          { affiliateShare: null },
          { companyFee: null },
          { founderShare: null },
        ]
      },
      select: {
        id: true,
        amount: true,
        type: true,
        affiliateShare: true,
        companyFee: true,
        status: true,
      },
      take: 10,
    })

    if (transactionsNoBreakdown.length > 0) {
      console.log(`⚠️  Found ${transactionsNoBreakdown.length} transactions without full breakdown:`)
      transactionsNoBreakdown.forEach(t => {
        console.log(`   - ${t.id}: Rp ${(t.amount || 0).toLocaleString('id-ID')} (Type: ${t.type})`)
      })
    } else {
      console.log('✅ All success transactions have commission breakdown')
    }

    // 2. Check affiliate conversions without matching commissions
    console.log('\n2️⃣  Checking affiliate conversions...')
    const conversionsCount = await prisma.affiliateConversion.count()
    const linksCount = await prisma.affiliateShortLink.count()

    console.log(`   Total conversions: ${conversionsCount}`)
    console.log(`   Total short links: ${linksCount}`)

    // 3. Check wallets with negative balance (should never happen)
    console.log('\n3️⃣  Checking wallet balance integrity...')
    const negativeBalances = await prisma.wallet.findMany({
      where: {
        OR: [
          { balance: { lt: 0 } },
          { balancePending: { lt: 0 } },
        ]
      },
      select: {
        id: true,
        userId: true,
        balance: true,
        balancePending: true,
      },
    })

    if (negativeBalances.length > 0) {
      console.log(`🔴 Found ${negativeBalances.length} wallets with negative balance:`)
      negativeBalances.forEach(w => {
        console.log(`   - User ${w.userId}: Balance ${w.balance}, Pending ${w.balancePending}`)
      })
    } else {
      console.log('✅ All wallet balances are positive')
    }

    // 4. Check pending revenue without wallet
    console.log('\n4️⃣  Checking pending revenue status...')
    const pendingByStatus = await prisma.pendingRevenue.groupBy({
      by: ['status'],
      _count: true,
    })

    console.log(`   Pending revenue by status:`)
    pendingByStatus.forEach(s => {
      console.log(`   - ${s.status}: ${s._count} entries`)
    })

    // 5. Check for duplicate commission entries
    console.log('\n5️⃣  Checking for duplicate affiliate commissions...')
    const duplicateCommissions = await prisma.$queryRaw`
      SELECT 
        "transactionId",
        "affiliateId",
        COUNT(*) as count
      FROM "AffiliateConversion"
      WHERE "transactionId" IS NOT NULL
      GROUP BY "transactionId", "affiliateId"
      HAVING COUNT(*) > 1
      LIMIT 5
    `

    if (duplicateCommissions.length > 0) {
      console.log(`⚠️  Found duplicate commission entries:`)
      duplicateCommissions.forEach(d => {
        console.log(`   - Transaction ${d.transactionId}: ${d.count} entries`)
      })
    } else {
      console.log('✅ No duplicate commission entries found')
    }

    // 6. Check unmatched transactions
    console.log('\n6️⃣  Checking success transactions...')
    const successTxCount = await prisma.transaction.count({
      where: { status: 'SUCCESS' }
    })
    const totalTxCount = await prisma.transaction.count()

    console.log(`   Total transactions: ${totalTxCount}`)
    console.log(`   Success transactions: ${successTxCount}`)
    console.log(`   Success rate: ${((successTxCount / totalTxCount) * 100).toFixed(1)}%`)

    // 7. Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 SUMMARY:')

    let issues = 0
    if (transactionsNoBreakdown.length > 0) issues++
    if (negativeBalances.length > 0) issues++
    if (duplicateCommissions.length > 0) issues++

    if (issues === 0) {
      console.log('✅ No consistency issues found!')
    } else {
      console.log(`⚠️  Found ${issues} category/categories with potential issues`)
      console.log('   Consider investigating and fixing flagged items')
    }

    console.log('\n💡 RECOMMENDATIONS:')
    console.log('   1. Review transactions without commission breakdown')
    console.log('   2. Check wallet balance anomalies manually')
    console.log('   3. Investigate pending revenue orphans')
    console.log('   4. Deduplicate commission entries if needed')
    console.log('   5. Monitor success transaction rate')

    console.log('\n' + '='.repeat(60) + '\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

auditConsistency().then(() => {
  console.log('✅ Audit complete!')
  process.exit(0)
})
