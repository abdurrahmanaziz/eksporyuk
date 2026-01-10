const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWithdrawalLogic() {
  try {
    console.log('\n' + '='.repeat(70))
    console.log('WITHDRAWAL LOGIC VERIFICATION - INSTANT vs MANUAL')
    console.log('='.repeat(70) + '\n')

    // 1. Check Payout schema
    console.log('1️⃣  Checking Payout schema for Xendit fields...')
    const samplePayout = await prisma.payout.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    
    if (samplePayout) {
      const hasXenditFields = [
        'xenditPayoutId',
        'channelCode', 
        'channelCategory',
        'phoneNumber',
        'referenceId',
        'xenditStatus',
        'adminFee',
        'netAmount'
      ]
      
      console.log('   Latest payout structure:')
      hasXenditFields.forEach(field => {
        const exists = field in samplePayout
        console.log(`   ${exists ? '✅' : '❌'} ${field}: ${exists ? 'EXISTS' : 'MISSING'}`)
      })
    } else {
      console.log('   ⚠️  No payouts found in database\n')
    }

    // 2. Check payout statuses
    console.log('\n2️⃣  Checking payout statuses in database...')
    const allPayouts = await prisma.payout.findMany({
      select: { status: true }
    })
    
    const statusCounts = allPayouts.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {})
    
    console.log('   Status distribution:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} payouts`)
    })
    
    const hasProcessing = statusCounts['PROCESSING'] > 0
    const hasPending = statusCounts['PENDING'] > 0
    
    if (hasProcessing) {
      console.log('   ✅ PROCESSING status found (Instant withdrawal active)')
    } else {
      console.log('   ⚠️  No PROCESSING status (Instant not used yet)')
    }
    
    if (hasPending) {
      console.log('   ✅ PENDING status found (Manual withdrawal active)')
    } else {
      console.log('   ⚠️  No PENDING status (Manual not used yet)')
    }

    // 3. Check WalletTransaction types
    console.log('\n3️⃣  Checking WalletTransaction types...')
    const allTxns = await prisma.walletTransaction.findMany({
      where: {
        OR: [
          { type: { contains: 'PAYOUT' } },
          { type: 'WITHDRAWAL' },
          { type: 'REFUND' }
        ]
      },
      select: { type: true }
    })
    
    const txnTypes = allTxns.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1
      return acc
    }, {})
    
    console.log('   Transaction types related to withdrawal:')
    Object.entries(txnTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} transactions`)
    })
    
    const hasPAYOUT_REQUEST = txnTypes['PAYOUT_REQUEST'] > 0
    const hasPAYOUT_PROCESSING = txnTypes['PAYOUT_PROCESSING'] > 0
    const hasWITHDRAWAL = txnTypes['WITHDRAWAL'] > 0
    const hasREFUND = txnTypes['REFUND'] > 0
    
    console.log('\n   Logic check:')
    console.log(`   ${hasPAYOUT_REQUEST ? '✅' : '❌'} PAYOUT_REQUEST (Manual - request only)`)
    console.log(`   ${hasPAYOUT_PROCESSING ? '✅' : '❌'} PAYOUT_PROCESSING (Instant Bank)`)
    console.log(`   ${hasWITHDRAWAL ? '✅' : '❌'} WITHDRAWAL (Instant E-Wallet)`)
    console.log(`   ${hasREFUND ? '✅' : '❌'} REFUND (Failed instant refund)`)

    // 4. Check Xendit integration
    console.log('\n4️⃣  Checking Xendit data storage...')
    
    const payoutsWithXenditField = await prisma.payout.count({
      where: { xenditPayoutId: { not: null } }
    })
    
    const allPayoutsCount = await prisma.payout.count()
    
    console.log(`   Total payouts: ${allPayoutsCount}`)
    console.log(`   With xenditPayoutId: ${payoutsWithXenditField}`)
    
    if (payoutsWithXenditField > 0) {
      console.log(`   ✅ Dedicated xenditPayoutId field used (NEW - E-Wallet)`)
      
      // Show sample
      const sample = await prisma.payout.findFirst({
        where: { xenditPayoutId: { not: null } },
        select: {
          xenditPayoutId: true,
          channelCode: true,
          channelCategory: true,
          phoneNumber: true,
          adminFee: true,
          netAmount: true,
          status: true
        }
      })
      
      console.log('\n   Sample E-Wallet payout:')
      console.log(`   - xenditPayoutId: ${sample.xenditPayoutId}`)
      console.log(`   - channelCode: ${sample.channelCode}`)
      console.log(`   - channelCategory: ${sample.channelCategory}`)
      console.log(`   - phoneNumber: ${sample.phoneNumber}`)
      console.log(`   - adminFee: ${sample.adminFee}`)
      console.log(`   - netAmount: ${sample.netAmount}`)
      console.log(`   - status: ${sample.status}`)
    } else {
      console.log(`   ⚠️  No payouts with dedicated xenditPayoutId field yet`)
    }

    // 5. Check recent withdrawals
    console.log('\n5️⃣  Recent withdrawal activity...')
    const recentPayouts = await prisma.payout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log(`   Last ${recentPayouts.length} withdrawals:`)
    
    for (let i = 0; i < recentPayouts.length; i++) {
      const p = recentPayouts[i]
      const type = p.status === 'PENDING' ? 'MANUAL' : 
                   p.xenditPayoutId ? 'INSTANT E-WALLET' :
                   p.metadata?.xenditId ? 'INSTANT BANK' : 'UNKNOWN'
      
      // Get wallet and user separately
      let userName = 'Unknown User'
      if (p.walletId) {
        const wallet = await prisma.wallet.findUnique({
          where: { id: p.walletId },
          include: { user: true }
        })
        userName = wallet?.user?.name || 'Unknown User'
      }
      
      console.log(`   ${i+1}. ${p.createdAt.toISOString().split('T')[0]} - ${userName}`)
      console.log(`      Type: ${type} | Status: ${p.status} | Amount: Rp ${Number(p.amount).toLocaleString()}`)
      
      if (p.channelCode) {
        console.log(`      Channel: ${p.channelCode} | Phone: ${p.phoneNumber || 'N/A'}`)
      }
    }

    // 6. Final verdict
    console.log('\n' + '='.repeat(70))
    console.log('VERDICT:')
    console.log('='.repeat(70))
    
    const checks = {
      dedicatedFields: samplePayout && 'xenditPayoutId' in samplePayout,
      dedicatedFieldsUsed: payoutsWithXenditField > 0,
      processingStatus: hasProcessing,
      pendingStatus: hasPending,
      withdrawalType: hasWITHDRAWAL,
      payoutRequestType: hasPAYOUT_REQUEST,
      refundType: hasREFUND
    }
    
    const passedChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length
    
    console.log(`\nImplementation Status: ${passedChecks}/${totalChecks} checks passed\n`)
    
    console.log('Schema Implementation:')
    console.log(`   ${checks.dedicatedFields ? '✅' : '❌'} Dedicated Xendit fields exist in schema`)
    console.log(`   ${checks.dedicatedFieldsUsed ? '✅' : '❌'} Dedicated fields actually used in production`)
    
    console.log('\nStatus Flow:')
    console.log(`   ${checks.pendingStatus ? '✅' : '❌'} PENDING status (Manual workflow)`)
    console.log(`   ${checks.processingStatus ? '✅' : '❌'} PROCESSING status (Instant workflow)`)
    
    console.log('\nTransaction Types:')
    console.log(`   ${checks.payoutRequestType ? '✅' : '❌'} PAYOUT_REQUEST (Manual - no deduction)`)
    console.log(`   ${checks.withdrawalType ? '✅' : '❌'} WITHDRAWAL (Instant E-Wallet - immediate deduction)`)
    console.log(`   ${checks.refundType ? '✅' : '❌'} REFUND (Failed instant refund)`)
    
    console.log('\n' + '='.repeat(70))
    
    if (passedChecks === totalChecks) {
      console.log('🎉 SESUAI! Implementation fully matches documented logic!')
    } else if (passedChecks >= totalChecks * 0.7) {
      console.log('✅ MOSTLY SESUAI - Schema ready, but not all features used yet')
    } else {
      console.log('⚠️  PARTIALLY IMPLEMENTED - Significant gaps exist')
    }
    
    console.log('='.repeat(70) + '\n')

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkWithdrawalLogic()
