#!/usr/bin/env node

/**
 * SAFE COMMISSION REPROCESSING SCRIPT
 * - Read-only analysis first
 * - Can manually trigger commission processing if needed
 * - No automatic changes
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzeCommissionGap() {
  console.log('\n📊 COMMISSION REPROCESSING ANALYSIS (READ-ONLY)\n')

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' },
      select: { id: true, name: true }
    })

    if (!user) {
      console.log('❌ User not found\n')
      return
    }

    console.log(`👤 User: ${user.name}`)
    console.log()

    // Find transactions with SUCCESS status but affiliateShare = 0
    const missingCommissionTxs = await prisma.transaction.findMany({
      where: {
        affiliateId: user.id,
        status: 'SUCCESS',
        affiliateShare: 0
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        affiliateId: true,
        membershipId: true,
        status: true,
        createdAt: true,
      }
    })

    console.log(`⚠️  TRANSACTIONS WITH MISSING COMMISSION (affiliateShare = 0):`)
    console.log(`Found: ${missingCommissionTxs.length} transaction(s)\n`)

    if (missingCommissionTxs.length === 0) {
      console.log('✅ All transactions have commission processed correctly\n')
      return
    }

    let totalMissingCommission = 0

    // Fetch membership details separately for each transaction
    for (const tx of missingCommissionTxs) {
      let membership = null
      if (tx.membershipId) {
        membership = await prisma.membership.findUnique({
          where: { id: tx.membershipId },
          select: {
            name: true,
            affiliateCommissionType: true,
            affiliateCommissionRate: true
          }
        })
      }

      const idx = missingCommissionTxs.indexOf(tx) + 1
      console.log(`${idx}. Transaction ID: ${tx.id}`)
      console.log(`   Amount: ${tx.amount.toLocaleString('id-ID')} IDR`)
      console.log(`   Package: ${membership?.name || 'Unknown'}`)
      console.log(`   Commission Type: ${membership?.affiliateCommissionType}`)
      console.log(`   Commission Rate: ${membership?.affiliateCommissionRate}`)

      // Calculate what commission should be
      const rate = membership?.affiliateCommissionRate || 0
      const type = membership?.affiliateCommissionType || 'PERCENTAGE'
      let expectedCommission = 0

      if (type === 'PERCENTAGE') {
        expectedCommission = Math.round(tx.amount * (rate / 100))
      } else if (type === 'FLAT') {
        expectedCommission = rate
      }

      console.log(`   Expected Commission: ${expectedCommission.toLocaleString('id-ID')} IDR`)
      console.log(`   Date: ${tx.createdAt.toISOString().split('T')[0]}`)
      console.log()

      totalMissingCommission += expectedCommission
    }

    console.log(`💰 TOTAL MISSING COMMISSION: ${totalMissingCommission.toLocaleString('id-ID')} IDR`)
    console.log()
    console.log('⚠️  ACTION NEEDED:')
    console.log('These transactions need to have processTransactionCommission() called')
    console.log('This should be done via the API, not manually in database')
    console.log()
    console.log('SAFE NEXT STEP:')
    console.log('1. Check if webhook/API callback was triggered for these transactions')
    console.log('2. If not, trigger /api/webhooks/xendit for payment confirmation')
    console.log('3. Or use admin dashboard to manually approve payment')
    console.log()

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeCommissionGap()
