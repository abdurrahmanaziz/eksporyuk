#!/usr/bin/env node

/**
 * REPROCESS MISSING COMMISSION - SAFE EXECUTION
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function reprocessCommission() {
  console.log('\n🔧 REPROCESSING MISSING AFFILIATE COMMISSION\n')

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

    // Find transactions that need reprocessing (affiliateShare is NULL)
    const unprocessedTxs = await prisma.transaction.findMany({
      where: {
        affiliateId: user.id,
        status: 'SUCCESS',
        affiliateShare: null
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📋 Found ${unprocessedTxs.length} transaction(s) to reprocess\n`)

    if (unprocessedTxs.length === 0) {
      console.log('✅ All transactions already processed\n')
      return
    }

    let processedCount = 0
    let totalCommissionAdded = 0

    for (const tx of unprocessedTxs) {
      try {
        // Fetch membership details
        let membership = null
        if (tx.membershipId) {
          membership = await prisma.membership.findUnique({
            where: { id: tx.membershipId },
            select: {
              name: true,
              commissionType: true,
              affiliateCommissionRate: true
            }
          })
        }

        const commissionType = membership?.commissionType || 'PERCENTAGE'
        const commissionRate = parseFloat(membership?.affiliateCommissionRate || '0')

        // Calculate commission
        let commission = 0
        if (commissionType === 'PERCENTAGE') {
          commission = Math.round(tx.amount * (commissionRate / 100))
        } else if (commissionType === 'FLAT') {
          commission = commissionRate
        }

        console.log(`⏳ Processing TX: ${tx.id}`)
        console.log(`   Amount: ${tx.amount.toLocaleString('id-ID')} IDR`)
        console.log(`   Package: ${membership?.name || 'Unknown'}`)
        console.log(`   Commission: ${commission.toLocaleString('id-ID')} IDR`)

        // Only process if there's actual commission
        if (commission === 0) {
          console.log(`   ✅ No commission needed (rate = 0)\n`)
          processedCount++
          continue
        }

        // 1. Update wallet with commission
        const wallet = await prisma.wallet.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            balance: commission,
            balancePending: 0,
          },
          update: {
            balance: { increment: commission },
          }
        })

        // 2. Create wallet transaction record
        await prisma.walletTransaction.create({
          data: {
            id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            walletId: wallet.id,
            type: 'COMMISSION',
            amount: commission,
            description: commissionType === 'FLAT'
              ? `Affiliate commission (FLAT Rp ${commissionRate.toLocaleString('id-ID')} - ${membership?.name})`
              : `Affiliate commission (${commissionRate}% - ${membership?.name})`,
            reference: tx.id
          }
        })

        // 3. Update transaction with affiliate share
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { affiliateShare: commission }
        })

        // 4. Update affiliate profile stats
        const affiliateProfile = await prisma.affiliateProfile.findUnique({
          where: { userId: user.id }
        })

        if (affiliateProfile) {
          await prisma.affiliateProfile.update({
            where: { userId: user.id },
            data: {
              totalEarnings: { increment: commission },
              totalConversions: { increment: 1 }
            }
          })
        }

        console.log(`   ✅ Successfully added Rp ${commission.toLocaleString('id-ID')} to wallet\n`)
        processedCount++
        totalCommissionAdded += commission

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`)
      }
    }

    // Verify final balance
    const finalWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balance: true }
    })

    console.log(`\n✅ REPROCESSING COMPLETE`)
    console.log(`Processed: ${processedCount}/${unprocessedTxs.length} transactions`)
    console.log(`Commission Added: Rp ${totalCommissionAdded.toLocaleString('id-ID')}`)
    console.log(`Final Wallet Balance: Rp ${(finalWallet?.balance || 0).toLocaleString('id-ID')}\n`)

  } catch (error) {
    console.error('❌ Fatal Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

reprocessCommission()
