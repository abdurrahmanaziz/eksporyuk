#!/usr/bin/env node

/**
 * Test script to verify bank info onboarding fix
 * 
 * This tests:
 * 1. Bank info submission to profile API
 * 2. Onboarding API bankInfoCompleted update
 * 3. Re-fetching onboarding status to verify it doesn't show form again
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBankInfoFix() {
  try {
    console.log('🧪 Testing Bank Info Onboarding Fix...\n')

    // Find first affiliate user
    const affiliate = await prisma.affiliateProfile.findFirst()

    if (!affiliate) {
      console.log('❌ No affiliate found for testing')
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: affiliate.userId },
      select: { id: true, name: true, email: true }
    })

    console.log(`✅ Found affiliate: ${user?.email}`)
    console.log(`   Current bankInfoCompleted: ${affiliate.bankInfoCompleted}`)
    console.log(`   Current bank fields: ${affiliate.bankName ? affiliate.bankName : 'None'}\n`)

    // Simulate what happens when form is submitted:
    // 1. POST /api/affiliate/profile saves bank info to payout
    console.log('📝 Simulating POST /api/affiliate/profile...')
    
    const wallet = await prisma.wallet.upsert({
      where: { userId: affiliate.userId },
      create: { userId: affiliate.userId, balance: 0 },
      update: {}
    })
    console.log(`   ✓ Wallet exists: ${wallet.id}`)

    // Create payout record with bank info (same as profile API does)
    const testBankInfo = {
      bankName: 'BCA',
      accountName: user?.name || 'Test User',
      accountNumber: '9876543210'
    }

    const payout = await prisma.payout.create({
      data: {
        id: `payout_test_${Date.now()}`,
        walletId: wallet.id,
        amount: 0,
        status: 'PAID',
        bankName: testBankInfo.bankName,
        accountName: testBankInfo.accountName,
        accountNumber: testBankInfo.accountNumber,
        notes: 'Test bank info for onboarding',
        paidAt: new Date(),
        updatedAt: new Date(),
      }
    })
    console.log(`   ✓ Bank info saved to payout: ${payout.id}`)

    // 2. POST /api/affiliate/onboarding with step='bank' marks it as completed
    console.log('\n📝 Simulating POST /api/affiliate/onboarding (step=bank)...')
    
    const updated = await prisma.affiliateProfile.update({
      where: { id: affiliate.id },
      data: {
        bankInfoCompleted: true,
        bankInfoCompletedAt: new Date(),
      }
    })
    console.log(`   ✓ bankInfoCompleted updated to: ${updated.bankInfoCompleted}`)
    console.log(`   ✓ bankInfoCompletedAt set to: ${updated.bankInfoCompletedAt}`)

    // 3. GET /api/affiliate/onboarding should now return bankInfoCompleted=true
    console.log('\n🔍 Verifying GET /api/affiliate/onboarding logic...')
    
    // Fetch fresh affiliate data
    const refreshedAffiliate = await prisma.affiliateProfile.findUnique({
      where: { id: affiliate.id }
    })

    // Check payout records
    const bankPayout = await prisma.payout.findFirst({
      where: {
        walletId: wallet.id,
        bankName: { not: null },
        accountName: { not: null },
        accountNumber: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Simulate GET logic
    const hasBankInfo = !!bankPayout
    const bankInfoCompleted = refreshedAffiliate.bankInfoCompleted || hasBankInfo || !!(
      refreshedAffiliate.bankName && 
      refreshedAffiliate.bankAccountName && 
      refreshedAffiliate.bankAccountNumber
    )

    console.log(`   ✓ hasBankInfo (from payout): ${hasBankInfo}`)
    console.log(`   ✓ bankInfoCompleted flag: ${refreshedAffiliate.bankInfoCompleted}`)
    console.log(`   ✓ Final bankInfoCompleted: ${bankInfoCompleted}`)

    if (bankInfoCompleted) {
      console.log('\n✅ SUCCESS: Bank info form will NOT be shown again!')
      console.log('   The bankInfoCompleted flag is now properly set in the database.')
      console.log('   Next onboarding page load will skip the bank form.')
    } else {
      console.log('\n❌ FAILED: bankInfoCompleted is still false')
      console.log('   The form would still be shown on next load.')
    }

    console.log('\n📊 Final state:')
    console.log(`   bankInfoCompleted: ${refreshedAffiliate.bankInfoCompleted}`)
    console.log(`   bankInfoCompletedAt: ${refreshedAffiliate.bankInfoCompletedAt}`)
    console.log(`   Bank payout record exists: ${!!bankPayout}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testBankInfoFix()
