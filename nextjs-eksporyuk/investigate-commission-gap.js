const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function investigateCommissionGap() {
  console.log(`
======================================================================
🔍 COMMISSION ALLOCATION GAP INVESTIGATION
======================================================================
`)

  try {
    // 1. Count transactions by affiliateShare status
    console.log(`\n1️⃣  TRANSACTION AFFILIATE SHARE STATUS`)
    console.log(`----------------------------------------------------------------------`)

    const transactionsWithShare = await prisma.transaction.count({
      where: { affiliateShare: { not: null } }
    })

    const transactionsWithoutShare = await prisma.transaction.count({
      where: { affiliateShare: null }
    })

    const totalTransactions = transactionsWithShare + transactionsWithoutShare

    console.log(`Total Transactions: ${totalTransactions}`)
    console.log(`  ✅ With affiliateShare: ${transactionsWithShare} (${((transactionsWithShare / totalTransactions) * 100).toFixed(1)}%)`)
    console.log(`  ❌ Without affiliateShare (NULL): ${transactionsWithoutShare} (${((transactionsWithoutShare / totalTransactions) * 100).toFixed(1)}%)`)

    // 2. Breakdown by transaction status
    console.log(`\n2️⃣  STATUS BREAKDOWN - COMMISSION ALLOCATION`)
    console.log(`----------------------------------------------------------------------`)

    const successWithShare = await prisma.transaction.count({
      where: { status: 'SUCCESS', affiliateShare: { not: null } }
    })

    const successWithoutShare = await prisma.transaction.count({
      where: { status: 'SUCCESS', affiliateShare: null }
    })

    const pendingWithShare = await prisma.transaction.count({
      where: { status: 'PENDING', affiliateShare: { not: null } }
    })

    const pendingWithoutShare = await prisma.transaction.count({
      where: { status: 'PENDING', affiliateShare: null }
    })

    const failedWithShare = await prisma.transaction.count({
      where: { status: 'FAILED', affiliateShare: { not: null } }
    })

    const failedWithoutShare = await prisma.transaction.count({
      where: { status: 'FAILED', affiliateShare: null }
    })

    console.log(`SUCCESS Transactions:`)
    console.log(`  ✅ With share: ${successWithShare}`)
    console.log(`  ❌ Without share: ${successWithoutShare}`)
    console.log(`  Rate: ${((successWithShare / (successWithShare + successWithoutShare)) * 100).toFixed(1)}% have commission`)

    console.log(`\nPENDING Transactions:`)
    console.log(`  ✅ With share: ${pendingWithShare}`)
    console.log(`  ❌ Without share: ${pendingWithoutShare}`)

    console.log(`\nFAILED Transactions:`)
    console.log(`  ✅ With share: ${failedWithShare}`)
    console.log(`  ❌ Without share: ${failedWithoutShare}`)

    // 3. Breakdown by payment provider
    console.log(`\n3️⃣  PAYMENT PROVIDER BREAKDOWN`)
    console.log(`----------------------------------------------------------------------`)

    const xenditWithShare = await prisma.transaction.count({
      where: { paymentProvider: 'XENDIT', affiliateShare: { not: null } }
    })

    const xenditWithoutShare = await prisma.transaction.count({
      where: { paymentProvider: 'XENDIT', affiliateShare: null }
    })

    const manualWithShare = await prisma.transaction.count({
      where: { paymentProvider: 'MANUAL', affiliateShare: { not: null } }
    })

    const manualWithoutShare = await prisma.transaction.count({
      where: { paymentProvider: 'MANUAL', affiliateShare: null }
    })

    console.log(`XENDIT Provider:`)
    console.log(`  Total: ${xenditWithShare + xenditWithoutShare}`)
    console.log(`  ✅ With commission: ${xenditWithShare}`)
    console.log(`  ❌ Without commission: ${xenditWithoutShare}`)
    console.log(`  Commission Rate: ${((xenditWithShare / (xenditWithShare + xenditWithoutShare)) * 100).toFixed(1)}%`)

    console.log(`\nMANUAL Provider:`)
    console.log(`  Total: ${manualWithShare + manualWithoutShare}`)
    console.log(`  ✅ With commission: ${manualWithShare}`)
    console.log(`  ❌ Without commission: ${manualWithoutShare}`)
    console.log(`  Commission Rate: ${((manualWithShare / (manualWithShare + manualWithoutShare)) * 100).toFixed(1)}%`)

    // 4. Breakdown by affiliate vs non-affiliate
    console.log(`\n4️⃣  AFFILIATE VS NON-AFFILIATE TRANSACTIONS`)
    console.log(`----------------------------------------------------------------------`)

    const allTransactions = await prisma.transaction.findMany({
      select: { 
        id: true, 
        affiliateId: true, 
        status: true, 
        affiliateShare: true,
        paymentProvider: true
      }
    })

    const withAffiliateId = allTransactions.filter(t => t.affiliateId !== null)
    const withoutAffiliateId = allTransactions.filter(t => t.affiliateId === null)

    const affiliateWithShare = withAffiliateId.filter(t => t.affiliateShare !== null).length
    const affiliateWithoutShare = withAffiliateId.filter(t => t.affiliateShare === null).length

    console.log(`Affiliate Transactions (affiliateUserId NOT NULL):`)
    console.log(`  Total: ${withAffiliateId.length}`)
    console.log(`  ✅ With commission: ${affiliateWithShare}`)
    console.log(`  ❌ Without commission: ${affiliateWithoutShare}`)
    console.log(`  Commission Rate: ${((affiliateWithShare / withAffiliateId.length) * 100).toFixed(1)}%`)

    console.log(`\nNon-Affiliate Transactions (affiliateUserId NULL):`)
    console.log(`  Total: ${withoutAffiliateId.length}`)
    console.log(`  Note: These should NOT have affiliateShare`)

    // 5. Find SUCCESS transactions without commission (these are ERRORS)
    console.log(`\n5️⃣  🚨 CRITICAL: SUCCESS TRANSACTIONS WITH AFFILIATE BUT NO COMMISSION`)
    console.log(`----------------------------------------------------------------------`)

    const problematicTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        affiliateId: { not: null },
        affiliateShare: null
      },
      select: {
        id: true,
        amount: true,
        affiliateId: true,
        paymentProvider: true,
        createdAt: true,
        updatedAt: true
      },
      take: 20
    })

    console.log(`Found ${problematicTransactions.length} SUCCESS transactions with affiliate but NO commission:`)
    if (problematicTransactions.length > 0) {
      console.log(`\nFirst 20 examples:`)
      problematicTransactions.forEach((t, idx) => {
        const age = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        console.log(`  ${idx + 1}. ${t.id} - Rp ${t.amount} - ${t.paymentProvider} - ${age} days old`)
      })
    }

    // 6. Timeline analysis - when did commission processing break?
    console.log(`\n6️⃣  TIMELINE ANALYSIS - WHEN DID COMMISSION STOP PROCESSING?`)
    console.log(`----------------------------------------------------------------------`)

    const txByDate = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: { status: 'SUCCESS', affiliateId: { not: null } },
      _count: { id: true }
    })

    const txByDateWithShare = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: { status: 'SUCCESS', affiliateId: { not: null }, affiliateShare: { not: null } },
      _count: { id: true }
    })

    // Group by date for cleaner display
    const dateMap = new Map()
    const dateMapWithShare = new Map()

    txByDate.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0]
      dateMap.set(date, (dateMap.get(date) || 0) + t._count.id)
    })

    txByDateWithShare.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0]
      dateMapWithShare.set(date, (dateMapWithShare.get(date) || 0) + t._count.id)
    })

    console.log(`Commission Processing Rate by Date (SUCCESS transactions with affiliate):`)
    console.log(`Date          Total  With Commission  Rate`)
    const sortedDates = Array.from(dateMap.keys()).sort().reverse().slice(0, 10)
    sortedDates.forEach(date => {
      const total = dateMap.get(date)
      const withShare = dateMapWithShare.get(date) || 0
      const rate = ((withShare / total) * 100).toFixed(1)
      console.log(`${date}   ${total.toString().padStart(4)} ${withShare.toString().padStart(15)} ${rate.padStart(5)}%`)
    })

    // 7. Focus on the 2 problematic transactions
    console.log(`\n7️⃣  ANALYZING THE 2 PROBLEMATIC SUCCESS TRANSACTIONS`)
    console.log(`----------------------------------------------------------------------`)

    if (problematicTransactions.length > 0) {
      problematicTransactions.forEach((tx, idx) => {
        const age = Math.floor((Date.now() - new Date(tx.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        console.log(`\n${idx + 1}. ${tx.id}`)
        console.log(`   Amount: Rp ${tx.amount}`)
        console.log(`   Affiliate ID: ${tx.affiliateId}`)
        console.log(`   Provider: ${tx.paymentProvider}`)
        console.log(`   Age: ${age} days`)
        console.log(`   Status: SUCCESS but affiliateShare = NULL ❌`)
      })
      console.log(`\n⚠️  ISSUE: These ${problematicTransactions.length} SUCCESS transactions have affiliate but NO commission allocated`)
    }

    // 8. ROOT CAUSE HYPOTHESIS
    console.log(`\n8️⃣  ROOT CAUSE ANALYSIS`)
    console.log(`----------------------------------------------------------------------`)

    if (successWithoutShare > 0) {
      console.log(`✋ HYPOTHESIS: Commission processing is broken for most transactions`)
      console.log(`\nEvidence:`)
      console.log(`  1. ${successWithoutShare} SUCCESS transactions have NO commission allocated`)
      console.log(`  2. Pattern suggests processTransactionCommission() is NOT being called`)
      console.log(`  3. OR it's being called but failing silently without updating affiliateShare`)
      console.log(`\nMost likely root causes:`)
      console.log(`  A. Webhook callback not triggering processTransactionCommission()`)
      console.log(`  B. Manual payment flow doesn't call processTransactionCommission()`)
      console.log(`  C. Error in processTransactionCommission() causing silent failure`)
      console.log(`  D. Race condition - commission tries to update before transaction exists`)

      console.log(`\nRECOMMENDED ACTIONS:`)
      console.log(`  1. Check /src/app/api/webhooks/xendit route - verify it calls commission processor`)
      console.log(`  2. Check /src/app/api/auth/payment or manual payment endpoint`)
      console.log(`  3. Review /src/lib/commission-helper.ts - look for try/catch hiding errors`)
      console.log(`  4. Check transaction status update timing - ensure correct order of operations`)
      console.log(`  5. Look for environment variables that might disable commission processing`)
    }

    console.log(`\n`)
  } catch (error) {
    console.error('Error during investigation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

investigateCommissionGap()
