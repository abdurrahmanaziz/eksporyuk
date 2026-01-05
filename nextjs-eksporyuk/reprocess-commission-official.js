#!/usr/bin/env node

/**
 * SAFE COMMISSION REPROCESSING VIA processTransactionCommission
 * Uses the exact same function as the API, ensuring consistency
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import the actual commission helper function
const { processTransactionCommission } = require('./src/lib/commission-helper')

async function reprocessCommissionSafely() {
  console.log('\n🔧 SAFE COMMISSION REPROCESSING (Using Official Function)\n')

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

    // Find unprocessed transactions
    const unprocessedTxs = await prisma.transaction.findMany({
      where: {
        affiliateId: user.id,
        status: 'SUCCESS',
        affiliateShare: null
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📋 Found ${unprocessedTxs.length} unprocessed transaction(s)\n`)

    if (unprocessedTxs.length === 0) {
      console.log('✅ All transactions already processed\n')
      return
    }

    let processedCount = 0
    let totalAdded = 0

    for (const tx of unprocessedTxs) {
      try {
        // Get full transaction data needed for commission calculation
        const fullTx = await prisma.transaction.findUnique({
          where: { id: tx.id },
          include: { membership: true }
        })

        if (!fullTx) {
          console.log(`❌ TX ${tx.id}: Could not fetch full transaction data`)
          continue
        }

        console.log(`⏳ Processing TX: ${tx.id}`)
        console.log(`   Amount: ${fullTx.amount} IDR`)
        console.log(`   Package: ${fullTx.membership?.name || 'N/A'}`)

        // Use the official processTransactionCommission function
        // This ensures we use the exact same logic as the API
        await processTransactionCommission(
          tx.id,
          user.id,                     // affiliateUserId
          'admin-user-id',             // adminUserId (placeholder)
          'founder-user-id',           // founderUserId (placeholder)
          'cofounder-user-id',         // cofounderUserId (placeholder)
          fullTx.amount,               // totalAmount
          fullTx.membership?.affiliateCommissionRate || 0, // affiliateCommissionRate
          fullTx.membership?.commissionType || 'PERCENTAGE' // commissionType
        )

        processedCount++
        console.log(`   ✅ Processed successfully`)

        // Verify it was added to wallet
        const updatedTx = await prisma.transaction.findUnique({
          where: { id: tx.id },
          select: { affiliateShare: true }
        })

        if (updatedTx.affiliateShare !== null) {
          totalAdded += updatedTx.affiliateShare
        }
        console.log()

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
        console.log()
      }
    }

    console.log(`\n✅ REPROCESSING COMPLETE`)
    console.log(`Processed: ${processedCount} transactions`)
    console.log(`Commission Added: ${totalAdded.toLocaleString('id-ID')} IDR\n`)

  } catch (error) {
    console.error('❌ Fatal Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

reprocessCommissionSafely()
