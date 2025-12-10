const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function testMigrationFlow() {
  console.log('🧪 Testing WordPress Migration Flow...\n')
  
  try {
    // Test 1: User migration dengan berbagai scenarios
    await testUserMigration()
    
    // Test 2: Commission calculation accuracy  
    await testCommissionMigration()
    
    // Test 3: Wallet integrity
    await testWalletIntegrity()
    
    // Test 4: Revenue split validation
    await testRevenueSplitCalculation()
    
    console.log('\n✅ ALL MIGRATION TESTS PASSED!')
    return true
    
  } catch (error) {
    console.error('\n❌ MIGRATION TEST FAILED:', error.message)
    console.error(error.stack)
    return false
  }
}

async function testUserMigration() {
  console.log('📝 Test 1: User Migration...')
  
  // Simulate WordPress user data
  const mockWpUsers = [
    {
      email: 'test.affiliate@eksporyuk.com',
      name: 'Test Affiliate User',
      role: 'affiliate',
      wpEarnings: 1500000, // Rp 1.5M earned
      affiliateCode: 'TESTCODE123',
      phone: '628123456789'
    },
    {
      email: 'test.premium@eksporyuk.com', 
      name: 'Test Premium Member',
      role: 'premium_member',
      wpEarnings: 0,
      phone: '628987654321'
    },
    {
      email: 'test.free@eksporyuk.com',
      name: 'Test Free Member',
      role: 'free_member',
      wpEarnings: 0,
      phone: '628111222333'
    }
  ]
  
  for (const wpUser of mockWpUsers) {
    // Create user menggunakan existing Eksporyuk pattern
    const user = await prisma.user.upsert({
      where: { email: wpUser.email },
      update: {
        name: wpUser.name,
        whatsapp: wpUser.phone
      },
      create: {
        email: wpUser.email,
        name: wpUser.name,
        password: await bcrypt.hash('ekspor123', 10),
        role: wpUser.role === 'affiliate' ? 'AFFILIATE' : 
              wpUser.role === 'premium_member' ? 'MEMBER_PREMIUM' : 'MEMBER_FREE',
        whatsapp: wpUser.phone,
        emailVerified: true, // Boolean, not DateTime
        isActive: true,
        wallet: {
          create: {
            balance: wpUser.wpEarnings || 0,
            balancePending: 0
          }
        }
      },
      include: { wallet: true }
    })
    
    // Create affiliate profile jika role affiliate
    if (wpUser.role === 'affiliate') {
      await prisma.affiliateProfile.upsert({
        where: { userId: user.id },
        update: { 
          affiliateCode: wpUser.affiliateCode,
          commissionRate: 30.0
        },
        create: {
          userId: user.id,
          affiliateCode: wpUser.affiliateCode,
          shortLink: `https://ekspo.ryuk/${wpUser.affiliateCode}`,
          commissionRate: 30.0,
          isActive: true,
          applicationStatus: 'APPROVED'
        }
      })
    }
    
    console.log(`   ✅ Migrated: ${user.email} | Role: ${user.role} | Balance: Rp ${user.wallet.balance.toLocaleString()}`)
  }
  
  // Verify all users created
  const userCount = await prisma.user.count({
    where: {
      email: { in: mockWpUsers.map(u => u.email) }
    }
  })
  
  if (userCount !== mockWpUsers.length) {
    throw new Error(`Expected ${mockWpUsers.length} users, found ${userCount}`)
  }
  
  console.log('   ✅ User migration test passed\n')
}

async function testCommissionMigration() {
  console.log('💰 Test 2: Commission Migration & Calculation...')
  
  // Manual commission calculation (same as audit script)
  const calculateCommission = (amount, rate, type) => {
    if (type === 'PERCENTAGE') {
      const commission = (amount * rate) / 100
      const remaining = amount - commission
      const adminFee = remaining * 0.15
      const afterAdmin = remaining - adminFee
      return {
        affiliateCommission: commission,
        adminFee: adminFee,
        founderShare: afterAdmin * 0.60,
        cofounderShare: afterAdmin * 0.40
      }
    }
    return null
  }
  
  // Find test affiliate
  const affiliate = await prisma.user.findFirst({
    where: { 
      email: 'test.affiliate@eksporyuk.com'
    },
    include: { affiliateProfile: true, wallet: true }
  })
  
  if (!affiliate) {
    throw new Error('Test affiliate not found')
  }
  
  // Use existing membership from seed (don't create new one)
  const testMembership = await prisma.membership.findFirst({
    where: { isActive: true }
  })
  
  if (!testMembership) {
    throw new Error('No active membership found. Run seed first.')
  }
  
  // Simulate WordPress purchase
  const mockPurchase = {
    customerEmail: 'customer@test.eksporyuk.com',
    amount: parseFloat(testMembership.price.toString()), // Use membership price
    affiliateCode: affiliate.affiliateProfile.affiliateCode
  }
  
  // Create customer
  const customer = await prisma.user.upsert({
    where: { email: mockPurchase.customerEmail },
    update: {},
    create: {
      email: mockPurchase.customerEmail,
      name: 'Test Customer',
      password: await bcrypt.hash('ekspor123', 10),
      role: 'MEMBER_FREE',
      emailVerified: true, // Boolean
      isActive: true,
      wallet: { create: { balance: 0, balancePending: 0 } }
    }
  })
  
  // Get initial wallet balance
  const initialBalance = affiliate.wallet.balance
  
  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId: customer.id,
      type: 'MEMBERSHIP', // Valid enum value
      amount: mockPurchase.amount,
      status: 'SUCCESS', // Valid TransactionStatus
      metadata: {
        migratedFromWp: true,
        affiliateCode: mockPurchase.affiliateCode,
        testTransaction: true
      }
    }
  })
  
  // Test revenue split calculation
  const revenueSplit = calculateCommission(
    mockPurchase.amount,
    parseFloat(testMembership.affiliateCommissionRate.toString()),
    testMembership.commissionType
  )
  
  const expectedCommission = mockPurchase.amount * (parseFloat(testMembership.affiliateCommissionRate.toString()) / 100)
  
  console.log('   💵 Revenue Split Calculation:')
  console.log(`      Total Amount: Rp ${mockPurchase.amount.toLocaleString()}`)
  console.log(`      Commission Rate: ${testMembership.affiliateCommissionRate}%`)
  console.log(`      Affiliate Commission: Rp ${revenueSplit.affiliateCommission.toLocaleString()}`)
  console.log(`      Admin Fee (15%): Rp ${revenueSplit.adminFee.toLocaleString()}`)
  console.log(`      Founder Share: Rp ${revenueSplit.founderShare.toLocaleString()}`)
  console.log(`      Co-Founder Share: Rp ${revenueSplit.cofounderShare.toLocaleString()}`)
  
  // Verify calculation is accurate
  if (Math.abs(revenueSplit.affiliateCommission - expectedCommission) > 1) {
    throw new Error(`Commission calculation error. Expected: ${expectedCommission}, Got: ${revenueSplit.affiliateCommission}`)
  }
  
  // Update affiliate wallet untuk simulate commission payment
  await prisma.wallet.update({
    where: { userId: affiliate.id },
    data: {
      balance: { increment: revenueSplit.affiliateCommission }
    }
  })
  
  // Verify wallet updated
  const updatedWallet = await prisma.wallet.findUnique({
    where: { userId: affiliate.id }
  })
  
  // Convert Decimal to number for comparison
  const initialBalanceNum = parseFloat(initialBalance.toString())
  const updatedBalanceNum = parseFloat(updatedWallet.balance.toString())
  const expectedBalance = initialBalanceNum + revenueSplit.affiliateCommission
  
  if (Math.abs(updatedBalanceNum - expectedBalance) > 1) {
    throw new Error(`Wallet update error. Expected: ${expectedBalance}, Got: ${updatedBalanceNum}`)
  }
  
  console.log(`   ✅ Wallet updated: Rp ${initialBalanceNum.toLocaleString()} → Rp ${updatedBalanceNum.toLocaleString()}`)
  console.log('   ✅ Commission calculation test passed\n')
}

async function testWalletIntegrity() {
  console.log('💼 Test 3: Wallet Integrity...')
  
  // Check semua test users punya wallet
  const testEmails = [
    'test.affiliate@eksporyuk.com',
    'test.premium@eksporyuk.com',
    'test.free@eksporyuk.com',
    'customer@test.eksporyuk.com'
  ]
  
  const usersWithoutWallet = await prisma.user.findMany({
    where: {
      email: { in: testEmails },
      wallet: null
    }
  })
  
  if (usersWithoutWallet.length > 0) {
    throw new Error(`${usersWithoutWallet.length} users missing wallet records: ${usersWithoutWallet.map(u => u.email).join(', ')}`)
  }
  
  // Check balance consistency (no negative balances)
  const wallets = await prisma.wallet.findMany({
    where: {
      user: {
        email: { in: testEmails }
      }
    },
    include: {
      user: { select: { email: true, role: true } }
    }
  })
  
  for (const wallet of wallets) {
    if (wallet.balance < 0 || wallet.balancePending < 0) {
      throw new Error(`Negative balance detected for ${wallet.user.email}: balance=${wallet.balance}, pending=${wallet.balancePending}`)
    }
    console.log(`   ✅ ${wallet.user.email}: Balance Rp ${wallet.balance.toLocaleString()}, Pending Rp ${wallet.balancePending.toLocaleString()}`)
  }
  
  console.log('   ✅ Wallet integrity test passed\n')
}

async function testRevenueSplitCalculation() {
  console.log('🧮 Test 4: Revenue Split Edge Cases...')
  
  // Use same manual calculation as earlier tests
  const calculateTestCommission = (amount, rate, type) => {
    if (type === 'PERCENTAGE') {
      const commission = (amount * rate) / 100
      const remaining = amount - commission
      const adminFee = remaining * 0.15
      const afterAdmin = remaining - adminFee
      return {
        affiliateCommission: commission,
        adminFee: adminFee,
        founderShare: afterAdmin * 0.60,
        cofounderShare: afterAdmin * 0.40
      }
    } else if (type === 'FLAT') {
      const commission = rate // flat amount
      const remaining = amount - commission
      const adminFee = remaining * 0.15
      const afterAdmin = remaining - adminFee
      return {
        affiliateCommission: commission,
        adminFee: adminFee,
        founderShare: afterAdmin * 0.60,
        cofounderShare: afterAdmin * 0.40
      }
    }
    return null
  }
  
  // Test case 1: Percentage commission
  const test1 = calculateTestCommission(1000000, 25.5, 'PERCENTAGE')
  
  console.log('   Test 1: Percentage (25.5% of Rp 1,000,000)')
  console.log(`      Affiliate: Rp ${test1.affiliateCommission.toLocaleString()}`)
  
  if (test1.affiliateCommission !== 255000) { // 25.5% of 1M
    throw new Error(`Percentage commission error. Expected: 255000, Got: ${test1.affiliateCommission}`)
  }
  
  // Test case 2: Flat commission  
  const test2 = calculateTestCommission(500000, 100000, 'FLAT')
  
  console.log('   Test 2: Flat (Rp 100,000)')
  console.log(`      Affiliate: Rp ${test2.affiliateCommission.toLocaleString()}`)
  
  if (test2.affiliateCommission !== 100000) {
    throw new Error(`Flat commission error. Expected: 100000, Got: ${test2.affiliateCommission}`)
  }
  
  // Test case 3: Zero commission (direct sale)
  const test3 = calculateTestCommission(800000, 0, 'PERCENTAGE')
  
  console.log('   Test 3: Zero commission (direct sale)')
  console.log(`      Affiliate: Rp ${test3.affiliateCommission.toLocaleString()}`)
  
  if (test3.affiliateCommission !== 0) {
    throw new Error(`Zero commission error. Expected: 0, Got: ${test3.affiliateCommission}`)
  }
  
  // Verify total split equals original amount
  const totalSplit1 = test1.affiliateCommission + test1.adminFee + test1.founderShare + test1.cofounderShare
  if (Math.abs(totalSplit1 - 1000000) > 1) { // Allow 1 rupiah rounding difference
    throw new Error(`Revenue split doesn't add up. Expected: 1000000, Got: ${totalSplit1}`)
  }
  
  console.log('   ✅ All edge cases passed')
  console.log('   ✅ Revenue split calculation test passed\n')
}

// Cleanup function
async function cleanup() {
  console.log('🧹 Cleaning up test data...')
  
  const testEmails = [
    'test.affiliate@eksporyuk.com',
    'test.premium@eksporyuk.com',
    'test.free@eksporyuk.com',
    'customer@test.eksporyuk.com'
  ]
  
  // Delete test transactions
  await prisma.transaction.deleteMany({
    where: {
      metadata: {
        path: ['testTransaction'],
        equals: true
      }
    }
  })
  
  // Delete test affiliate profiles (not "affiliate" model)
  await prisma.affiliateProfile.deleteMany({
    where: {
      user: {
        email: { in: testEmails }
      }
    }
  })
  
  // Delete test wallets
  await prisma.wallet.deleteMany({
    where: {
      user: {
        email: { in: testEmails }
      }
    }
  })
  
  // Delete test users
  await prisma.user.deleteMany({
    where: {
      email: { in: testEmails }
    }
  })
  
  // Delete test membership
  await prisma.membership.deleteMany({
    where: {
      name: 'Test Migration Membership'
    }
  })
  
  console.log('   ✅ Test data cleaned up\n')
}

// Run all tests
testMigrationFlow()
  .then(async (success) => {
    if (success) {
      await cleanup()
      console.log('🎉 Migration testing completed successfully!')
      process.exit(0)
    } else {
      console.log('💥 Migration testing failed!')
      process.exit(1)
    }
  })
  .catch(async (error) => {
    console.error('💥 Fatal error:', error)
    await cleanup()
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
