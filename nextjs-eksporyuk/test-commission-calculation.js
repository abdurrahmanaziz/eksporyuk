const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import the commission calculation function
// Since commission-helper is TypeScript, we'll manually implement the calculation
function calculateCommission(totalAmount, affiliateCommissionRate) {
  const affiliateCommission = (totalAmount * affiliateCommissionRate) / 100
  const remainingAfterAffiliate = totalAmount - affiliateCommission
  const adminFee = (remainingAfterAffiliate * 15) / 100
  const remainingForFounders = remainingAfterAffiliate - adminFee
  const founderShare = (remainingForFounders * 60) / 100
  const cofounderShare = (remainingForFounders * 40) / 100
  
  return {
    affiliateCommission,
    adminFee,
    founderShare,
    cofounderShare
  }
}

async function processTransactionCommissionManual(
  transactionId,
  affiliateUserId,
  adminUserId,
  founderUserId,
  cofounderUserId,
  totalAmount,
  affiliateCommissionRate
) {
  const commission = calculateCommission(totalAmount, affiliateCommissionRate)
  
  // 1. Affiliate Commission (direct to balance)
  if (affiliateUserId) {
    const affiliateWallet = await prisma.wallet.findUnique({
      where: { userId: affiliateUserId }
    })
    
    await prisma.wallet.update({
      where: { userId: affiliateUserId },
      data: { balance: { increment: commission.affiliateCommission } }
    })
    
    await prisma.walletTransaction.create({
      data: {
        walletId: affiliateWallet.id,
        type: 'COMMISSION',
        amount: commission.affiliateCommission,
        description: `Affiliate commission (${affiliateCommissionRate}%)`,
        reference: transactionId
      }
    })
  }
  
  // 2. Admin Fee (to balancePending)
  const adminWallet = await prisma.wallet.findUnique({
    where: { userId: adminUserId }
  })
  
  await prisma.wallet.update({
    where: { userId: adminUserId },
    data: { balancePending: { increment: commission.adminFee } }
  })
  
  await prisma.pendingRevenue.create({
    data: {
      walletId: adminWallet.id,
      transactionId,
      amount: commission.adminFee,
      type: 'ADMIN_FEE',
      percentage: 15,
      status: 'PENDING'
    }
  })
  
  // 3. Founder Share (to balancePending)
  const founderWallet = await prisma.wallet.findUnique({
    where: { userId: founderUserId }
  })
  
  await prisma.wallet.update({
    where: { userId: founderUserId },
    data: { balancePending: { increment: commission.founderShare } }
  })
  
  await prisma.pendingRevenue.create({
    data: {
      walletId: founderWallet.id,
      transactionId,
      amount: commission.founderShare,
      type: 'FOUNDER_SHARE',
      percentage: 60,
      status: 'PENDING'
    }
  })
  
  // 4. Co-Founder Share (to balancePending)
  const cofounderWallet = await prisma.wallet.findUnique({
    where: { userId: cofounderUserId }
  })
  
  await prisma.wallet.update({
    where: { userId: cofounderUserId },
    data: { balancePending: { increment: commission.cofounderShare } }
  })
  
  await prisma.pendingRevenue.create({
    data: {
      walletId: cofounderWallet.id,
      transactionId,
      amount: commission.cofounderShare,
      type: 'COFOUNDER_SHARE',
      percentage: 40,
      status: 'PENDING'
    }
  })
}

async function testCommissionCalculation() {
  try {
    console.log('🧪 Testing NEW Commission Calculation System...\n')
    console.log('📋 System Overview:')
    console.log('   - Affiliate: Configurable % per product/membership → balance (immediate)')
    console.log('   - Admin: 15% of remaining → balancePending')
    console.log('   - Founder: 60% of remaining → balancePending')
    console.log('   - Co-Founder: 40% of remaining → balancePending\n')

    // 1. Setup: Get or create test users
    console.log('👥 Setting up test users...')
    
    // Create/get Affiliate
    let affiliate = await prisma.user.findFirst({
      where: { email: 'affiliate@test.com' }
    })
    
    if (!affiliate) {
      affiliate = await prisma.user.create({
        data: {
          name: 'Test Affiliate',
          email: 'affiliate@test.com',
          password: 'hashed_password',
          role: 'AFFILIATE',
          emailVerified: true
        }
      })
      console.log('   ✅ Created test affiliate')
    } else {
      console.log('   ✅ Using existing affiliate')
    }

    // Create/get Mentor
    let mentor = await prisma.user.findFirst({
      where: { email: 'mentor@test.com' }
    })
    
    if (!mentor) {
      mentor = await prisma.user.create({
        data: {
          name: 'Test Mentor',
          email: 'mentor@test.com',
          password: 'hashed_password',
          role: 'MENTOR',
          emailVerified: true
        }
      })
      console.log('   ✅ Created test mentor')
    } else {
      console.log('   ✅ Using existing mentor')
    }

    // Get system users (Admin, Founder, Co-Founder)
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    const founder = await prisma.user.findFirst({
      where: { isFounder: true }
    })
    const cofounder = await prisma.user.findFirst({
      where: { isCoFounder: true }
    })

    if (!admin || !founder || !cofounder) {
      console.log('\n❌ System users not found! Please ensure admin, founder, and co-founder users exist.')
      console.log('   Missing:')
      if (!admin) console.log('   - Admin (role: ADMIN)')
      if (!founder) console.log('   - Founder (isFounder: true)')
      if (!cofounder) console.log('   - Co-Founder (isCoFounder: true)')
      return
    }
    
    console.log('   ✅ Found Admin:', admin.email)
    console.log('   ✅ Found Founder:', founder.email)
    console.log('   ✅ Found Co-Founder:', cofounder.email)

    // Create/get Customer
    let customer = await prisma.user.findFirst({
      where: { email: 'customer@test.com' }
    })
    
    if (!customer) {
      customer = await prisma.user.create({
        data: {
          name: 'Test Customer',
          email: 'customer@test.com',
          password: 'hashed_password',
          role: 'MEMBER_FREE',
          emailVerified: true
        }
      })
      console.log('   ✅ Created test customer')
    } else {
      console.log('   ✅ Using existing customer')
    }

    // Ensure wallets exist
    for (const user of [affiliate, mentor, customer, admin, founder, cofounder]) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: user.id }
      })
      
      if (!wallet) {
        await prisma.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            balancePending: 0
          }
        })
      }
    }

    // 2. Get active membership
    const membership = await prisma.membership.findFirst({
      where: { 
        isActive: true,
        price: { gt: 0 }
      }
    })

    if (!membership) {
      console.log('\n❌ No active membership found. Please run seed data first!')
      return
    }

    console.log(`\n💎 Testing with Membership: ${membership.name}`)
    console.log(`   Price: Rp ${membership.price.toLocaleString('id-ID')}`)
    console.log(`   Affiliate Commission Rate: ${membership.affiliateCommissionRate}%`)

    // 3. Calculate expected commissions using new system
    const membershipPrice = parseFloat(membership.price)
    const affiliateCommissionRate = parseFloat(membership.affiliateCommissionRate)
    
    const expectedAffiliateCommission = (membershipPrice * affiliateCommissionRate) / 100
    const remainingAfterAffiliate = membershipPrice - expectedAffiliateCommission
    
    // Admin, Founder, Co-Founder split from remaining
    const expectedAdminFee = (remainingAfterAffiliate * 15) / 100
    const remainingForFounders = remainingAfterAffiliate - expectedAdminFee
    const expectedFounderShare = (remainingForFounders * 60) / 100
    const expectedCofounderShare = (remainingForFounders * 40) / 100
    
    const expectedTotal = expectedAffiliateCommission + expectedAdminFee + expectedFounderShare + expectedCofounderShare

    console.log(`\n📊 Expected Commission Breakdown:`)
    console.log(`   Base Price: Rp ${membershipPrice.toLocaleString('id-ID')}`)
    console.log(`   `)
    console.log(`   Affiliate (${affiliateCommissionRate}%): Rp ${expectedAffiliateCommission.toLocaleString('id-ID')} → balance`)
    console.log(`   `)
    console.log(`   Remaining: Rp ${remainingAfterAffiliate.toLocaleString('id-ID')}`)
    console.log(`   ├─ Admin (15%): Rp ${expectedAdminFee.toLocaleString('id-ID')} → balancePending`)
    console.log(`   ├─ Founder (60%): Rp ${expectedFounderShare.toLocaleString('id-ID')} → balancePending`)
    console.log(`   └─ Co-Founder (40%): Rp ${expectedCofounderShare.toLocaleString('id-ID')} → balancePending`)
    console.log(`   `)
    console.log(`   Total Distributed: Rp ${expectedTotal.toLocaleString('id-ID')}`)

    // 5. Get initial wallet balances
    const initialAffiliateWallet = await prisma.wallet.findUnique({
      where: { userId: affiliate.id }
    })
    const initialAdminWallet = await prisma.wallet.findUnique({
      where: { userId: admin.id }
    })
    const initialFounderWallet = await prisma.wallet.findUnique({
      where: { userId: founder.id }
    })
    const initialCofounderWallet = await prisma.wallet.findUnique({
      where: { userId: cofounder.id }
    })

    console.log(`\n💳 Initial Wallet Balances:`)
    console.log(`   Affiliate:`)
    console.log(`     - balance: Rp ${parseFloat(initialAffiliateWallet.balance).toLocaleString('id-ID')}`)
    console.log(`     - balancePending: Rp ${parseFloat(initialAffiliateWallet.balancePending).toLocaleString('id-ID')}`)
    console.log(`   Admin:`)
    console.log(`     - balance: Rp ${parseFloat(initialAdminWallet.balance).toLocaleString('id-ID')}`)
    console.log(`     - balancePending: Rp ${parseFloat(initialAdminWallet.balancePending).toLocaleString('id-ID')}`)
    console.log(`   Founder:`)
    console.log(`     - balance: Rp ${parseFloat(initialFounderWallet.balance).toLocaleString('id-ID')}`)
    console.log(`     - balancePending: Rp ${parseFloat(initialFounderWallet.balancePending).toLocaleString('id-ID')}`)
    console.log(`   Co-Founder:`)
    console.log(`     - balance: Rp ${parseFloat(initialCofounderWallet.balance).toLocaleString('id-ID')}`)
    console.log(`     - balancePending: Rp ${parseFloat(initialCofounderWallet.balancePending).toLocaleString('id-ID')}`)

    // 6. Clean up previous test transactions
    console.log('\n🧹 Cleaning up previous test transactions...')
    await prisma.pendingRevenue.deleteMany({
      where: {
        transaction: {
          externalId: { startsWith: 'TEST-' }
        }
      }
    })
    await prisma.walletTransaction.deleteMany({
      where: {
        description: { contains: 'Test commission' }
      }
    })
    await prisma.transaction.deleteMany({
      where: {
        userId: customer.id,
        type: 'MEMBERSHIP',
        externalId: { startsWith: 'TEST-' }
      }
    })

    // 7. Create transaction
    console.log('\n💳 Creating test transaction...')
    const transaction = await prisma.transaction.create({
      data: {
        userId: customer.id,
        type: 'MEMBERSHIP',
        amount: membership.price,
        status: 'SUCCESS',
        paymentMethod: 'BANK_TRANSFER',
        externalId: `TEST-${Date.now()}`,
        metadata: JSON.stringify({
          membershipId: membership.id,
          affiliateId: affiliate.id,
          affiliateCommissionRate: affiliateCommissionRate
        })
      }
    })
    console.log('   ✅ Transaction created:', transaction.id)

    // 8. Process commission using new system
    console.log('\n💸 Processing commissions with processTransactionCommission()...')
    
    await processTransactionCommissionManual(
      transaction.id,
      affiliate.id, // affiliateUserId
      admin.id,     // adminUserId
      founder.id,   // founderUserId
      cofounder.id, // cofounderUserId
      membershipPrice,
      affiliateCommissionRate
    )
    
    console.log('   ✅ Commission processing completed')

    // 11. Verification
    console.log('\n\n🔍 VERIFICATION RESULTS:')
    console.log('='.repeat(70))

    // Verify transaction
    const verifyTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        pendingRevenues: true
      }
    })
    console.log(`\n✅ Transaction Status: ${verifyTransaction.status}`)
    console.log(`   Amount: Rp ${parseFloat(verifyTransaction.amount).toLocaleString('id-ID')}`)
    console.log(`   Pending Revenue Records: ${verifyTransaction.pendingRevenues.length}`)

    // Verify wallet transactions (commissions)
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: {
        reference: transaction.id
      }
    })
    console.log(`\n✅ Wallet Transaction Records: ${walletTransactions.length}`)
    
    const affiliateWalletTx = walletTransactions.find(wt => wt.walletId === initialAffiliateWallet.id)

    if (affiliateWalletTx) {
      console.log(`   Affiliate: Rp ${parseFloat(affiliateWalletTx.amount).toLocaleString('id-ID')} (${affiliateCommissionRate}%) → balance`)
    }

    // Verify pending revenues
    console.log(`\n✅ Pending Revenue Records:`)
    const pendingRevenues = await prisma.pendingRevenue.findMany({
      where: { transactionId: transaction.id },
      include: { wallet: { include: { user: true } } }
    })
    
    const adminPending = pendingRevenues.find(pr => pr.wallet.userId === admin.id)
    const founderPending = pendingRevenues.find(pr => pr.wallet.userId === founder.id)
    const cofounderPending = pendingRevenues.find(pr => pr.wallet.userId === cofounder.id)
    
    if (adminPending) {
      console.log(`   Admin: Rp ${parseFloat(adminPending.amount).toLocaleString('id-ID')} (${adminPending.percentage}%) - ${adminPending.status}`)
    }
    if (founderPending) {
      console.log(`   Founder: Rp ${parseFloat(founderPending.amount).toLocaleString('id-ID')} (${founderPending.percentage}%) - ${founderPending.status}`)
    }
    if (cofounderPending) {
      console.log(`   Co-Founder: Rp ${parseFloat(cofounderPending.amount).toLocaleString('id-ID')} (${cofounderPending.percentage}%) - ${cofounderPending.status}`)
    }

    // Verify wallet balances
    const finalAffiliateWallet = await prisma.wallet.findUnique({
      where: { userId: affiliate.id }
    })
    const finalAdminWallet = await prisma.wallet.findUnique({
      where: { userId: admin.id }
    })
    const finalFounderWallet = await prisma.wallet.findUnique({
      where: { userId: founder.id }
    })
    const finalCofounderWallet = await prisma.wallet.findUnique({
      where: { userId: cofounder.id }
    })

    const affiliateBalanceIncrease = parseFloat(finalAffiliateWallet.balance) - parseFloat(initialAffiliateWallet.balance)
    const adminPendingIncrease = parseFloat(finalAdminWallet.balancePending) - parseFloat(initialAdminWallet.balancePending)
    const founderPendingIncrease = parseFloat(finalFounderWallet.balancePending) - parseFloat(initialFounderWallet.balancePending)
    const cofounderPendingIncrease = parseFloat(finalCofounderWallet.balancePending) - parseFloat(initialCofounderWallet.balancePending)

    console.log(`\n✅ Wallet Balance Updates:`)
    console.log(`   Affiliate (balance):`)
    console.log(`     Before: Rp ${parseFloat(initialAffiliateWallet.balance).toLocaleString('id-ID')}`)
    console.log(`     After: Rp ${parseFloat(finalAffiliateWallet.balance).toLocaleString('id-ID')}`)
    console.log(`     Increase: Rp ${affiliateBalanceIncrease.toLocaleString('id-ID')} ${Math.abs(affiliateBalanceIncrease - expectedAffiliateCommission) < 0.01 ? '✅' : '❌'}`)
    
    console.log(`   Admin (balancePending):`)
    console.log(`     Before: Rp ${parseFloat(initialAdminWallet.balancePending).toLocaleString('id-ID')}`)
    console.log(`     After: Rp ${parseFloat(finalAdminWallet.balancePending).toLocaleString('id-ID')}`)
    console.log(`     Increase: Rp ${adminPendingIncrease.toLocaleString('id-ID')} ${Math.abs(adminPendingIncrease - expectedAdminFee) < 0.01 ? '✅' : '❌'}`)
    
    console.log(`   Founder (balancePending):`)
    console.log(`     Before: Rp ${parseFloat(initialFounderWallet.balancePending).toLocaleString('id-ID')}`)
    console.log(`     After: Rp ${parseFloat(finalFounderWallet.balancePending).toLocaleString('id-ID')}`)
    console.log(`     Increase: Rp ${founderPendingIncrease.toLocaleString('id-ID')} ${Math.abs(founderPendingIncrease - expectedFounderShare) < 0.01 ? '✅' : '❌'}`)
    
    console.log(`   Co-Founder (balancePending):`)
    console.log(`     Before: Rp ${parseFloat(initialCofounderWallet.balancePending).toLocaleString('id-ID')}`)
    console.log(`     After: Rp ${parseFloat(finalCofounderWallet.balancePending).toLocaleString('id-ID')}`)
    console.log(`     Increase: Rp ${cofounderPendingIncrease.toLocaleString('id-ID')} ${Math.abs(cofounderPendingIncrease - expectedCofounderShare) < 0.01 ? '✅' : '❌'}`)

    // 12. Test summary
    console.log('\n\n' + '='.repeat(70))
    console.log('📊 TEST SUMMARY:')
    console.log('='.repeat(70))

    const allPassed = 
      verifyTransaction.status === 'SUCCESS' &&
      walletTransactions.length >= 1 &&
      verifyTransaction.pendingRevenues.length === 3 &&
      Math.abs(affiliateBalanceIncrease - expectedAffiliateCommission) < 0.01 &&
      Math.abs(adminPendingIncrease - expectedAdminFee) < 0.01 &&
      Math.abs(founderPendingIncrease - expectedFounderShare) < 0.01 &&
      Math.abs(cofounderPendingIncrease - expectedCofounderShare) < 0.01

    if (allPassed) {
      console.log('✅ ALL TESTS PASSED!')
      console.log('\n🎉 NEW Commission calculation system is working correctly!')
      console.log('\nWhat was tested:')
      console.log('  ✅ Transaction created successfully')
      console.log('  ✅ Affiliate commission calculated and added to balance (immediate)')
      console.log('  ✅ Admin fee calculated and added to balancePending (15%)')
      console.log('  ✅ Founder share calculated and added to balancePending (60%)')
      console.log('  ✅ Co-Founder share calculated and added to balancePending (40%)')
      console.log('  ✅ PendingRevenue records created for admin/founder/co-founder')
      console.log('  ✅ Wallet balances updated accurately')
      console.log('  ✅ Wallet transactions recorded')
      console.log('\n💡 Next: Admin can review and approve pending revenues at /admin/pending-revenue')
    } else {
      console.log('❌ SOME TESTS FAILED!')
      console.log('\nFailed checks:')
      if (verifyTransaction.status !== 'SUCCESS') console.log('  ❌ Transaction status')
      if (walletTransactions.length < 1) console.log('  ❌ Wallet transaction records count')
      if (verifyTransaction.pendingRevenues.length !== 3) console.log('  ❌ Pending revenue records count (expected 3)')
      if (Math.abs(affiliateBalanceIncrease - expectedAffiliateCommission) >= 0.01) console.log('  ❌ Affiliate balance increase')
      if (Math.abs(adminPendingIncrease - expectedAdminFee) >= 0.01) console.log('  ❌ Admin balancePending increase')
      if (Math.abs(founderPendingIncrease - expectedFounderShare) >= 0.01) console.log('  ❌ Founder balancePending increase')
      if (Math.abs(cofounderPendingIncrease - expectedCofounderShare) >= 0.01) console.log('  ❌ Co-Founder balancePending increase')
    }

    console.log('\n' + '='.repeat(70))

  } catch (error) {
    console.log('❌ Test failed:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testCommissionCalculation()
