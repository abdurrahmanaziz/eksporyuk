const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixManualPaymentCommission() {
  console.log(`
======================================================================
🔧 FIXING MANUAL PAYMENT MISSING COMMISSION
======================================================================
`)

  try {
    // Find the 2 problematic SUCCESS transactions with affiliate but no commission
    const problematicTxs = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        affiliateId: { not: null },
        affiliateShare: null,
        paymentProvider: 'MANUAL'
      },
      select: {
        id: true,
        amount: true,
        affiliateId: true,
        membershipId: true,
        userId: true,
        createdAt: true
      }
    })

    console.log(`Found ${problematicTxs.length} manual payment transactions to fix:\n`)

    for (const tx of problematicTxs) {
      console.log(`Processing: ${tx.id}`)
      console.log(`  Amount: Rp ${tx.amount}`)
      console.log(`  Affiliate ID: ${tx.affiliateId}`)

      // Get membership details
      const membership = tx.membershipId ? await prisma.membership.findUnique({
        where: { id: tx.membershipId },
        select: { name: true, affiliateCommissionRate: true }
      }) : null

      console.log(`  Membership: ${membership?.name || 'Unknown'}`)

      // Calculate affiliate commission based on membership rate
      const commissionRate = membership?.affiliateCommissionRate || 0
      let affiliateShare = 0

      if (typeof commissionRate === 'object' && commissionRate.type === 'FLAT') {
        affiliateShare = commissionRate.value
      } else if (typeof commissionRate === 'number') {
        affiliateShare = Math.round((tx.amount * commissionRate) / 100)
      }

      console.log(`  Calculated Commission: Rp ${affiliateShare}`)

      // Update transaction with affiliate share
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { affiliateShare }
      })

      // Get affiliate's user ID to find wallet
      const affiliate = await prisma.affiliateProfile.findUnique({
        where: { id: tx.affiliateId },
        select: { userId: true }
      })

      if (!affiliate) {
        console.log(`  ⚠️  WARNING: Affiliate profile not found for ${tx.affiliateId}`)
        continue
      }

      // Add to affiliate wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: affiliate.userId },
        select: { id: true, balance: true }
      })

      if (wallet) {
        const newBalance = wallet.balance + affiliateShare

        // Update wallet balance
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance }
        })

        // Create wallet transaction record
        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'COMMISSION',
            amount: affiliateShare,
            description: `Affiliate commission (FLAT Rp ${affiliateShare.toLocaleString('id-ID')} - ${tx.membership?.name || 'Manual'})`,
            referenceId: tx.id,
            referenceType: 'TRANSACTION'
          }
        })

        console.log(`  ✅ Updated wallet: Rp ${wallet.balance} → Rp ${newBalance}`)
        console.log(`  ✅ Created wallet transaction record`)
      } else {
        console.log(`  ⚠️  WARNING: No wallet found for affiliate ${tx.affiliateId}`)
      }

      console.log()
    }

    // Verify the fix
    console.log(`\n📊 VERIFICATION`)
    console.log(`----------------------------------------------------------------------`)

    const fixedTxs = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        affiliateId: { not: null },
        affiliateShare: { not: null },
        paymentProvider: 'MANUAL'
      },
      select: {
        id: true,
        amount: true,
        affiliateShare: true
      }
    })

    console.log(`Manual payment transactions now with commission: ${fixedTxs.length}`)
    fixedTxs.forEach(tx => {
      console.log(`  ✅ ${tx.id}: Rp ${tx.amount} → Commission: Rp ${tx.affiliateShare}`)
    })

    console.log(`\n✅ FIX COMPLETE`)
    console.log(`\nFixed Commission Summary:`)
    const totalAdded = await Promise.all(problematicTxs.map(async tx => {
      const membership = tx.membershipId ? await prisma.membership.findUnique({
        where: { id: tx.membershipId },
        select: { affiliateCommissionRate: true }
      }) : null
      
      const rate = membership?.affiliateCommissionRate || 0
      let commission = 0
      if (typeof rate === 'object' && rate.type === 'FLAT') {
        commission = rate.value
      } else if (typeof rate === 'number') {
        commission = Math.round((tx.amount * rate) / 100)
      }
      return commission
    })).then(arr => arr.reduce((sum, c) => sum + c, 0))

    console.log(`  Total Commission Added: Rp ${totalAdded.toLocaleString('id-ID')}`)
    console.log(`  Transactions Fixed: ${problematicTxs.length}`)

  } catch (error) {
    console.error('❌ Error during fix:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixManualPaymentCommission()
