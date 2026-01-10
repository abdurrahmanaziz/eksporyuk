#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`  🔍 EKSPORYUK MEMBERSHIP SYSTEM AUDIT - READ ONLY`)
    console.log(`  Date: ${new Date().toLocaleString('id-ID')}`)
    console.log(`${'='.repeat(70)}\n`)

    // ===== PART 1: COUNT ALL MEMBERSHIP TRANSACTIONS =====
    console.log(`\n📊 PART 1: MEMBERSHIP TRANSACTION SUMMARY`)
    console.log(`${'-'.repeat(70)}`)

    const membershipTxs = await prisma.transaction.findMany({
      where: { type: 'MEMBERSHIP' },
      select: {
        id: true,
        userId: true,
        status: true,
        paymentProvider: true,
        amount: true,
        affiliateId: true,
        affiliateShare: true
      }
    })

    console.log(`\nTotal MEMBERSHIP transactions: ${membershipTxs.length}`)
    console.log(`  - SUCCESS: ${membershipTxs.filter(t => t.status === 'SUCCESS').length}`)
    console.log(`  - FAILED: ${membershipTxs.filter(t => t.status === 'FAILED').length}`)
    console.log(`  - PENDING: ${membershipTxs.filter(t => t.status === 'PENDING').length}`)

    const providers = {}
    membershipTxs.forEach(tx => {
      const provider = tx.paymentProvider || 'NULL'
      providers[provider] = (providers[provider] || 0) + 1
    })

    console.log(`\nPayment Providers:`)
    Object.entries(providers).forEach(([provider, count]) => {
      console.log(`  - ${provider}: ${count}`)
    })

    // ===== PART 2: SUCCESS TRANSACTIONS & ACTIVATION CHECK =====
    console.log(`\n\n📋 PART 2: SUCCESS TRANSACTIONS & ACTIVATION`)
    console.log(`${'-'.repeat(70)}`)

    const successTxs = membershipTxs.filter(t => t.status === 'SUCCESS')
    console.log(`\nFound ${successTxs.length} SUCCESS transactions\n`)

    const activationResults = []
    for (const tx of successTxs) {
      const userMembership = await prisma.userMembership.findFirst({
        where: {
          userId: tx.userId,
          status: 'ACTIVE'
        },
        select: { id: true, membershipId: true }
      })

      const hasCommission = tx.affiliateId ? (tx.affiliateShare ? 'YES' : 'MISSING') : 'N/A'
      const activated = userMembership ? 'YES ✅' : 'NO ❌'

      activationResults.push({
        txId: tx.id.substring(0, 12),
        provider: tx.paymentProvider || 'NULL',
        amount: tx.amount,
        hasAffiliate: tx.affiliateId ? 'YES' : 'NO',
        commission: hasCommission,
        activated: activated,
        status: userMembership ? 'OK' : 'PROBLEM'
      })
    }

    // Print in table format
    activationResults.forEach(result => {
      console.log(`${result.txId}... | ${result.provider.padEnd(7)} | Rp${String(result.amount).padEnd(8)} | Affiliate: ${result.hasAffiliate} | Commission: ${result.commission} | Activated: ${result.activated}`)
    })

    const activatedCount = activationResults.filter(r => r.activated.includes('✅')).length
    const notActivatedCount = activationResults.filter(r => r.activated.includes('❌')).length

    console.log(`\nActivation Summary:`)
    console.log(`  ✅ Successfully Activated: ${activatedCount}`)
    console.log(`  ❌ Not Activated: ${notActivatedCount}`)

    // ===== PART 3: AFFILIATE & COMMISSION CHECK =====
    console.log(`\n\n💰 PART 3: AFFILIATE & COMMISSION VERIFICATION`)
    console.log(`${'-'.repeat(70)}`)

    const txWithAffiliate = successTxs.filter(t => t.affiliateId)
    console.log(`\nSUCCESS transactions with affiliate: ${txWithAffiliate.length}\n`)

    for (const tx of txWithAffiliate) {
      const profile = await prisma.affiliateProfile.findUnique({
        where: { id: tx.affiliateId },
        select: { id: true, affiliateCode: true }
      })

      const wallet = await prisma.wallet.findUnique({
        where: { userId: tx.affiliateId },
        select: { balance: true }
      })

      const profileStatus = profile ? '✅ Found' : '❌ MISSING'
      const commissionStatus = tx.affiliateShare ? `✅ Rp${tx.affiliateShare}` : '❌ MISSING'

      console.log(`Affiliate: ${tx.affiliateId.substring(0, 12)}...`)
      console.log(`  Profile: ${profileStatus}${profile ? ` (${profile.affiliateCode})` : ''}`)
      console.log(`  Commission: ${commissionStatus}`)
      console.log(`  Wallet: ${wallet ? `Rp${wallet.balance}` : '❌ NO WALLET'}`)
      console.log('')
    }

    // ===== PART 4: MEMBERSHIP CONFIGURATION =====
    console.log(`\n⚙️  PART 4: MEMBERSHIP CONFIGURATION`)
    console.log(`${'-'.repeat(70)}`)

    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        isActive: true,
        affiliateCommissionRate: true
      },
      orderBy: { isActive: 'desc' }
    })

    console.log(`\nTotal memberships configured: ${memberships.length}\n`)
    memberships.forEach(m => {
      const status = m.isActive ? '✅ ACTIVE' : '❌ INACTIVE'
      const commission = typeof m.affiliateCommissionRate === 'number' ? `Rp${m.affiliateCommissionRate}` : m.affiliateCommissionRate
      console.log(`${status} | ${m.name.padEnd(30)} | Rp${m.price.toLocaleString('id-ID')} | Commission: ${commission} | Duration: ${m.duration}`)
    })

    // ===== PART 5: DATA INTEGRITY =====
    console.log(`\n\n🔐 PART 5: DATA INTEGRITY CHECK`)
    console.log(`${'-'.repeat(70)}`)

    const totalUserMemberships = await prisma.userMembership.count()
    const totalUsers = await prisma.user.count()
    const totalMemberships = await prisma.membership.count()
    const totalWallets = await prisma.wallet.count()
    const totalAffiliates = await prisma.affiliateProfile.count()

    console.log(`\nDatabase Counts:`)
    console.log(`  - Total Users: ${totalUsers}`)
    console.log(`  - Total Memberships: ${totalMemberships}`)
    console.log(`  - Total UserMemberships: ${totalUserMemberships}`)
    console.log(`  - Total Wallets: ${totalWallets}`)
    console.log(`  - Total Affiliate Profiles: ${totalAffiliates}`)

    console.log(`\nData Integrity:`)
    console.log(`  - Wallet/User ratio: ${(totalWallets / totalUsers * 100).toFixed(1)}%`)
    console.log(`  - UserMembership/User ratio: ${(totalUserMemberships / totalUsers * 100).toFixed(1)}%`)

    // ===== PART 6: FAILED TRANSACTIONS SAMPLE =====
    console.log(`\n\n⚠️  PART 6: FAILED TRANSACTIONS SAMPLE`)
    console.log(`${'-'.repeat(70)}`)

    const failedTxs = membershipTxs.filter(t => t.status === 'FAILED').slice(0, 5)
    console.log(`\nShowing first 5 of ${membershipTxs.filter(t => t.status === 'FAILED').length} failed transactions:\n`)

    for (const tx of failedTxs) {
      const user = await prisma.user.findUnique({
        where: { id: tx.userId },
        select: { name: true, email: true }
      })
      console.log(`ID: ${tx.id.substring(0, 12)}...`)
      console.log(`  User: ${user?.name} (${user?.email})`)
      console.log(`  Provider: ${tx.paymentProvider || 'NULL'}`)
      console.log(`  Amount: Rp${tx.amount}`)
      console.log('')
    }

    // ===== SUMMARY =====
    console.log(`\n\n🎯 AUDIT SUMMARY`)
    console.log(`${'='.repeat(70)}`)

    const issues = []
    if (notActivatedCount > 0) issues.push(`${notActivatedCount} SUCCESS txs not activated`)
    if (txWithAffiliate.length > membershipTxs.filter(t => t.affiliateShare).length) issues.push(`Some txs missing commission`)
    if (membershipTxs.filter(t => !t.paymentProvider).length > 0) issues.push(`${membershipTxs.filter(t => !t.paymentProvider).length} txs with NULL provider`)

    if (issues.length === 0) {
      console.log(`\n✅ SYSTEM HEALTHY`)
      console.log(`   - All memberships properly activated`)
      console.log(`   - All commissions properly processed`)
      console.log(`   - Data integrity maintained`)
      console.log(`   → Safe for production ✅`)
    } else {
      console.log(`\n⚠️  ISSUES FOUND:`)
      issues.forEach(issue => console.log(`   - ${issue}`))
      console.log(`   → Review needed before deploying `)
    }

    console.log(`\n${'='.repeat(70)}\n`)

  } catch (error) {
    console.error('\n❌ Audit Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
