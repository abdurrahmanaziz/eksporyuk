const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function comprehensiveAudit() {
  console.log(`
======================================================================
🔍 COMPREHENSIVE MEMBERSHIP & PAYMENT SYSTEM AUDIT
======================================================================
Date: 2026-01-05
Purpose: Verify complete flow safety - SERIOUS & DETAILED

`)

  try {
    // ===== SECTION 1: MEMBERSHIP TRANSACTIONS =====
    console.log(`\n1️⃣  MEMBERSHIP TRANSACTIONS BREAKDOWN`)
    console.log(`======================================================================`)

    const allMembershipTxs = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP' },
      select: {
        id: true,
        userId: true,
        status: true,
        affiliateId: true,
        affiliateShare: true,
        amount: true,
        paymentProvider: true,
        createdAt: true
      }
    })

    console.log(`\nTotal MEMBERSHIP transactions: ${allMembershipTxs.length}`)

    console.log(`\nXENDIT Transactions (${allMembershipTxs.filter(tx => tx.paymentProvider === 'XENDIT').length}):`)
    const xenditTxs = allMembershipTxs.filter(tx => tx.paymentProvider === 'XENDIT')
    xenditTxs.forEach(tx => {
      console.log(`  ${tx.id}`)
      console.log(`    Status: ${tx.status}, Amount: Rp${tx.amount}`)
      console.log(`    Affiliate: ${tx.affiliateId ? 'YES' : 'NO'}, Commission: Rp${tx.affiliateShare || 'NULL'}`)
    })

    console.log(`\nMANUAL Transactions (${allMembershipTxs.filter(tx => tx.paymentProvider === 'MANUAL').length}):`)
    const manualTxs = allMembershipTxs.filter(tx => tx.paymentProvider === 'MANUAL')
    manualTxs.forEach(tx => {
      console.log(`  ${tx.id}`)
      console.log(`    Status: ${tx.status}, Amount: Rp${tx.amount}`)
      console.log(`    Affiliate: ${tx.affiliateId ? 'YES' : 'NO'}, Commission: Rp${tx.affiliateShare || 'NULL'}`)
    })

    console.log(`\nOther/NULL Provider (${allMembershipTxs.filter(tx => !tx.paymentProvider).length}):`)
    const otherTxs = allMembershipTxs.filter(tx => !tx.paymentProvider)
    otherTxs.slice(0, 3).forEach(tx => {
      console.log(`  ${tx.id}: Status=${tx.status}, Amount=Rp${tx.amount}`)
    })

    // ===== SECTION 2: ACTIVATION VERIFICATION =====
    console.log(`\n\n2️⃣  MEMBERSHIP ACTIVATION VERIFICATION`)
    console.log(`======================================================================`)

    const successTxs = allMembershipTxs.filter(tx => tx.status === 'SUCCESS')
    console.log(`\nTotal SUCCESS transactions: ${successTxs.length}`)

    let activatedCount = 0
    let notActivatedCount = 0
    const problems = []

    for (const tx of successTxs) {
      const userMembership = await prisma.userMembership.findFirst({
        where: {
          userId: tx.userId,
          status: 'ACTIVE'
        }
      })

      if (userMembership) {
        activatedCount++
      } else {
        notActivatedCount++
        const user = await prisma.user.findUnique({
          where: { id: tx.userId },
          select: { name: true, email: true }
        })
        problems.push({
          txId: tx.id,
          user: user?.name,
          provider: tx.paymentProvider,
          amount: tx.amount
        })
      }
    }

    console.log(`Activated: ${activatedCount}/${successTxs.length}`)
    if (notActivatedCount > 0) {
      console.log(`NOT Activated: ${notActivatedCount} ❌`)
      problems.forEach(p => {
        console.log(`  - ${p.txId}: ${p.user} via ${p.provider} (Rp${p.amount})`)
      })
    } else {
      console.log(`NOT Activated: 0 ✅`)
    }

    // ===== SECTION 3: COMMISSION PROCESSING =====
    console.log(`\n\n3️⃣  COMMISSION PROCESSING VERIFICATION`)
    console.log(`======================================================================`)

    const affiliateTxs = successTxs.filter(tx => tx.affiliateId)
    console.log(`\nSUCCESS transactions with affiliate: ${affiliateTxs.length}`)

    let commissionOk = 0
    let commissionMissing = 0
    const commissionProblems = []

    affiliateTxs.forEach(tx => {
      if (tx.affiliateShare && Number(tx.affiliateShare) > 0) {
        commissionOk++
      } else {
        commissionMissing++
        commissionProblems.push({
          txId: tx.id,
          affiliate: tx.affiliateId.substring(0, 12) + '...',
          amount: tx.amount,
          commission: tx.affiliateShare
        })
      }
    })

    console.log(`Commission Processed: ${commissionOk}/${affiliateTxs.length}`)
    if (commissionMissing > 0) {
      console.log(`Commission Missing: ${commissionMissing} ❌`)
      commissionProblems.forEach(p => {
        console.log(`  - ${p.txId}: Affiliate ${p.affiliate}, Amount Rp${p.amount}, Commission: ${p.commission}`)
      })
    } else {
      console.log(`Commission Missing: 0 ✅`)
    }

    // ===== SECTION 4: AFFILIATE PROFILE VERIFICATION =====
    console.log(`\n\n4️⃣  AFFILIATE PROFILE VERIFICATION`)
    console.log(`======================================================================`)

    const uniqueAffiliates = [...new Set(successTxs.filter(tx => tx.affiliateId).map(tx => tx.affiliateId))]
    console.log(`\nUnique affiliates in SUCCESS txs: ${uniqueAffiliates.length}`)

    let profilesFound = 0
    let profilesMissing = 0

    for (const affiliateId of uniqueAffiliates) {
      const profile = await prisma.affiliateProfile.findUnique({
        where: { id: affiliateId }
      })

      if (profile) {
        profilesFound++
        console.log(`  ✅ ${profile.id.substring(0, 12)}...: ${profile.affiliateCode}`)
      } else {
        profilesMissing++
        console.log(`  ❌ ${affiliateId.substring(0, 12)}...: NO PROFILE FOUND`)
      }
    }

    console.log(`\nResult: ${profilesFound} profiles found, ${profilesMissing} missing`)

    // ===== SECTION 5: MEMBERSHIP CONFIGURATION =====
    console.log(`\n\n5️⃣  MEMBERSHIP CONFIGURATION AUDIT`)
    console.log(`======================================================================`)

    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        affiliateCommissionRate: true,
        isActive: true
      }
    })

    console.log(`\nTotal memberships: ${memberships.length}`)
    memberships.forEach(m => {
      const status = m.isActive ? '✅' : '❌'
      console.log(`\n${status} ${m.name}`)
      console.log(`   Price: Rp${m.price}`)
      console.log(`   Duration: ${m.duration}`)
      console.log(`   Commission: ${m.affiliateCommissionRate} (Type: ${typeof m.affiliateCommissionRate})`)
    })

    // ===== SECTION 6: WALLET VERIFICATION =====
    console.log(`\n\n6️⃣  WALLET & BALANCE VERIFICATION`)
    console.log(`======================================================================`)

    const topWallets = await prisma.wallet.findMany({
      where: { balance: { gt: 0 } },
      select: { userId: true, balance: true, balancePending: true },
      orderBy: { balance: 'desc' },
      take: 5
    })

    console.log(`\nTop 5 wallet balances:`)
    for (const w of topWallets) {
      const user = await prisma.user.findUnique({
        where: { id: w.userId },
        select: { name: true, email: true }
      })
      console.log(`  ${user?.name}`)
      console.log(`    Balance: Rp${w.balance.toLocaleString('id-ID')}`)
      console.log(`    Pending: Rp${w.balancePending.toLocaleString('id-ID')}`)
    }

    // ===== SECTION 7: DATA INTEGRITY CHECKS =====
    console.log(`\n\n7️⃣  DATA INTEGRITY CHECKS`)
    console.log(`======================================================================`)

    // Check for orphaned UserMemberships
    const allUserMemberships = await prisma.userMembership.findMany({
      select: { userId: true, membershipId: true }
    })

    const allUsers = await prisma.user.findMany({ select: { id: true } })
    const allMembershipsIds = await prisma.membership.findMany({ select: { id: true } })

    const userIds = new Set(allUsers.map(u => u.id))
    const membershipIds = new Set(allMembershipsIds.map(m => m.id))

    let orphanedUserIds = 0
    let orphanedMembershipIds = 0

    allUserMemberships.forEach(um => {
      if (!userIds.has(um.userId)) orphanedUserIds++
      if (!membershipIds.has(um.membershipId)) orphanedMembershipIds++
    })

    console.log(`\nUserMembership integrity:`)
    console.log(`  Total UserMemberships: ${allUserMemberships.length}`)
    console.log(`  Orphaned user IDs: ${orphanedUserIds}`)
    console.log(`  Orphaned membership IDs: ${orphanedMembershipIds}`)

    if (orphanedUserIds === 0 && orphanedMembershipIds === 0) {
      console.log(`  ✅ Data integrity OK`)
    } else {
      console.log(`  ❌ Data integrity issues detected`)
    }

    // ===== FINAL SUMMARY =====
    console.log(`\n\n8️⃣  FINAL AUDIT SUMMARY`)
    console.log(`======================================================================`)

    const issues = [
      { name: 'Activation Problems', count: notActivatedCount, severity: 'HIGH' },
      { name: 'Commission Missing', count: commissionMissing, severity: 'HIGH' },
      { name: 'Affiliate Profiles Missing', count: profilesMissing, severity: 'MEDIUM' },
      { name: 'Data Integrity Issues', count: orphanedUserIds + orphanedMembershipIds, severity: 'MEDIUM' }
    ]

    const totalIssues = issues.reduce((sum, i) => sum + i.count, 0)

    console.log(`\nTotal Issues Found: ${totalIssues}`)
    issues.forEach(i => {
      if (i.count > 0) {
        console.log(`  [${i.severity}] ${i.name}: ${i.count}`)
      }
    })

    if (totalIssues === 0) {
      console.log(`\n✅ AUDIT RESULT: SYSTEM SAFE & OPERATIONAL`)
      console.log(`   All membership purchases are activating correctly`)
      console.log(`   All commissions are being processed`)
      console.log(`   Data integrity is maintained`)
    } else {
      console.log(`\n⚠️  AUDIT RESULT: ISSUES DETECTED`)
      console.log(`   See details above for problems`)
    }

    console.log(`\n======================================================================`)

  } catch (error) {
    console.error('Audit Error:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

comprehensiveAudit()
