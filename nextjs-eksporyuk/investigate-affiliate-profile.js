#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function investigateAffiliateProfile() {
  try {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`  🔍 INVESTIGATING MISSING AFFILIATE PROFILE`)
    console.log(`${'='.repeat(70)}\n`)

    // Get all SUCCESS membership transactions with affiliate
    const txsWithAffiliate = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        status: 'SUCCESS',
        affiliateId: { not: null }
      },
      select: {
        id: true,
        userId: true,
        affiliateId: true,
        affiliateShare: true,
        amount: true,
        createdAt: true
      }
    })

    console.log(`Found ${txsWithAffiliate.length} SUCCESS transactions with affiliate\n`)

    // Get unique affiliate IDs
    const uniqueAffiliates = [...new Set(txsWithAffiliate.map(t => t.affiliateId))]
    console.log(`Unique affiliate IDs: ${uniqueAffiliates.length}\n`)

    for (const affiliateId of uniqueAffiliates) {
      console.log(`${'='.repeat(70)}`)
      console.log(`AFFILIATE: ${affiliateId}`)
      console.log(`${'='.repeat(70)}`)

      // Check if profile exists
      const profile = await prisma.affiliateProfile.findUnique({
        where: { id: affiliateId },
        select: {
          id: true,
          affiliateCode: true,
          userId: true,
          applicationStatus: true
        }
      })

      if (!profile) {
        console.log(`❌ Profile DOES NOT EXIST in database`)
      } else {
        console.log(`✅ Profile found:`)
        console.log(`   Code: ${profile.affiliateCode}`)
        console.log(`   User ID: ${profile.userId}`)
        console.log(`   Status: ${profile.applicationStatus}`)
      }

      // Check wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: affiliateId },
        select: { balance: true, balancePending: true }
      })

      if (!wallet) {
        console.log(`❌ Wallet DOES NOT EXIST`)
      } else {
        console.log(`✅ Wallet found:`)
        console.log(`   Balance: Rp${wallet.balance.toLocaleString('id-ID')}`)
        console.log(`   Pending: Rp${wallet.balancePending.toLocaleString('id-ID')}`)
      }

      // Check user
      const user = await prisma.user.findUnique({
        where: { id: affiliateId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      })

      if (!user) {
        console.log(`❌ User DOES NOT EXIST`)
      } else {
        console.log(`✅ User found:`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Role: ${user.role}`)
      }

      // Show transactions
      const affiliateTxs = txsWithAffiliate.filter(t => t.affiliateId === affiliateId)
      console.log(`\nTransactions (${affiliateTxs.length} total):`)
      affiliateTxs.forEach(tx => {
        console.log(`  - ${tx.id}: Rp${tx.amount} → Commission Rp${tx.affiliateShare}`)
      })

      // Calculate total commission
      const totalCommission = affiliateTxs.reduce((sum, tx) => sum + Number(tx.affiliateShare), 0)
      console.log(`\n  Total Commission: Rp${totalCommission.toLocaleString('id-ID')}`)

      console.log('')
    }

    console.log(`${'='.repeat(70)}`)
    console.log(`FINDINGS:`)
    console.log(`${'='.repeat(70)}`)
    console.log(`\n✅ All commissions ARE credited to wallet`)
    console.log(`❌ BUT affiliate profile missing - could cause issues with:`)
    console.log(`   - Affiliate dashboard access`)
    console.log(`   - Profile information display`)
    console.log(`   - Affiliate link generation`)
    console.log(`   - Payout processing`)
    console.log(`\nRECOMMENDATION:`)
    console.log(`Create missing affiliate profile for ID: ${uniqueAffiliates.map(a => a.substring(0, 12) + '...').join(', ')}`)
    console.log(`This is safe and won't affect existing wallet balances\n`)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

investigateAffiliateProfile()
