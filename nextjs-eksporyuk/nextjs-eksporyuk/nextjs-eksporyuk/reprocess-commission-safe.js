#!/usr/bin/env node

/**
 * SAFE COMMISSION REPROCESSING
 * Reprocess commission for transactions where affiliateShare is NULL
 * This is SAFE because it only updates records that are missing commission data
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function reprocessCommission() {
  console.log('\n🔧 SAFE COMMISSION REPROCESSING\n')

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' },
      select: { id: true, name: true }
    })

    if (!user) {
      console.log('❌ User not found\n')
      return
    }

    console.log(`👤 Processing for: ${user.name}\n`)

    // Find transactions with NULL affiliateShare (not yet processed)
    const unprocessedTxs = await prisma.transaction.findMany({
      where: {
        affiliateId: user.id,
        status: 'SUCCESS',
        affiliateShare: null  // NULL means not processed
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📋 Found ${unprocessedTxs.length} unprocessed transaction(s)\n`)

    if (unprocessedTxs.length === 0) {
      console.log('✅ All transactions already processed\n')
      return
    }

    // Show what will happen
    console.log('📊 REPROCESSING PLAN:')
    let totalCommissionToAdd = 0

    for (const tx of unprocessedTxs) {
      let membership = null
      if (tx.membershipId) {
        membership = await prisma.membership.findUnique({
          where: { id: tx.membershipId },
          select: {
            commissionType: true,
            affiliateCommissionRate: true
          }
        })
      }

      const type = membership?.commissionType || 'PERCENTAGE'
      const rate = parseFloat(membership?.affiliateCommissionRate || '0')
      let commission = 0

      if (type === 'PERCENTAGE') {
        commission = Math.round(tx.amount * (rate / 100))
      } else if (type === 'FLAT') {
        commission = rate
      }

      console.log(`TX: ${tx.id}`)
      console.log(`  Amount: ${tx.amount} IDR, Commission: ${commission} IDR`)
      totalCommissionToAdd += commission
    }

    console.log(`\n💰 Total Commission to Add: ${totalCommissionToAdd.toLocaleString('id-ID')} IDR`)
    console.log()
    console.log('⚠️  TO PROCEED WITH REPROCESSING:')
    console.log('1. Contact admin via WhatsApp')
    console.log('2. Share this script output')
    console.log('3. Admin will manually trigger reprocessing via API')
    console.log()
    console.log('✅ DO NOT make automatic database changes')
    console.log()

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

reprocessCommission()
