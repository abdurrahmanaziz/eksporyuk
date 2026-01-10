const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function testConcurrentLoads() {
  console.log('🔄 Testing Concurrent Load Performance...\n')
  
  try {
    // Test 1: Concurrent user creation
    await testConcurrentUserCreation()
    
    // Test 2: Concurrent database queries
    await testConcurrentDatabaseQueries()
    
    // Test 3: Concurrent transaction processing
    await testConcurrentTransactions()
    
    console.log('\n✅ ALL CONCURRENT LOAD TESTS PASSED!')
    return true
    
  } catch (error) {
    console.error('\n❌ CONCURRENT LOAD TEST FAILED:', error.message)
    console.error(error.stack)
    return false
  }
}

async function testConcurrentUserCreation() {
  console.log('👥 Test 1: Concurrent User Creation (100 users)...')
  
  const userCount = 100
  const testUsers = []
  
  for (let i = 0; i < userCount; i++) {
    testUsers.push({
      email: `loadtest${i}@eksporyuk.com`,
      name: `Load Test User ${i}`,
      password: 'ekspor123'
    })
  }
  
  const startTime = Date.now()
  
  // Create users concurrently
  const createPromises = testUsers.map(user => 
    prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        password: bcrypt.hashSync(user.password, 10),
        role: 'MEMBER_FREE',
        emailVerified: true, // Boolean, not DateTime
        isActive: true,
        wallet: {
          create: {
            balance: 0,
            balancePending: 0
          }
        }
      }
    })
  )
  
  const results = await Promise.allSettled(createPromises)
  const endTime = Date.now()
  
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  console.log('   📊 Results:')
  console.log(`      Total requests: ${userCount}`)
  console.log(`      Successful: ${successful}`)
  console.log(`      Failed: ${failed}`)
  console.log(`      Total time: ${endTime - startTime}ms`)
  console.log(`      Avg per user: ${Math.round((endTime - startTime) / userCount)}ms`)
  
  if (failed > userCount * 0.1) { // Fail rate > 10%
    throw new Error(`Too many failures: ${failed}/${userCount} (${Math.round(failed/userCount*100)}%)`)
  }
  
  console.log('   ✅ Concurrent user creation test passed\n')
}

async function testConcurrentDatabaseQueries() {
  console.log('🔍 Test 2: Concurrent Database Queries (50 queries)...')
  
  const queryCount = 50
  const startTime = Date.now()
  
  // Simulate concurrent database reads
  const queryPromises = []
  for (let i = 0; i < queryCount; i++) {
    queryPromises.push(
      prisma.user.findMany({
        where: {
          email: { contains: 'loadtest' }
        },
        take: 10,
        include: {
          wallet: true
        }
      })
    )
  }
  
  const results = await Promise.allSettled(queryPromises)
  const endTime = Date.now()
  
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  console.log('   📊 Results:')
  console.log(`      Total queries: ${queryCount}`)
  console.log(`      Successful: ${successful}`)
  console.log(`      Failed: ${failed}`)
  console.log(`      Total time: ${endTime - startTime}ms`)
  console.log(`      Avg per query: ${Math.round((endTime - startTime) / queryCount)}ms`)
  
  if (failed > 0) {
    throw new Error(`Database queries failed: ${failed}/${queryCount}`)
  }
  
  // Check query performance
  const avgQueryTime = (endTime - startTime) / queryCount
  if (avgQueryTime > 500) { // > 500ms average
    console.log(`   ⚠️  WARNING: Slow queries detected (avg ${avgQueryTime}ms)`)
  }
  
  console.log('   ✅ Concurrent database query test passed\n')
}

async function testConcurrentTransactions() {
  console.log('💳 Test 3: Concurrent Transaction Processing (30 transactions)...')
  
  // Get test users
  const testUsers = await prisma.user.findMany({
    where: {
      email: { contains: 'loadtest' }
    },
    take: 30
  })
  
  if (testUsers.length < 30) {
    throw new Error(`Insufficient test users. Need 30, found ${testUsers.length}`)
  }
  
  const startTime = Date.now()
  
  // Create concurrent transactions
  const transactionPromises = testUsers.map((user, index) => 
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'MEMBERSHIP', // Use valid enum value
        amount: Math.floor(Math.random() * 1000000) + 100000, // Rp 100K - 1M
        status: 'SUCCESS', // Valid TransactionStatus
        metadata: {
          loadTest: true,
          batchNumber: index
        }
      }
    })
  )
  
  const results = await Promise.allSettled(transactionPromises)
  const endTime = Date.now()
  
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  // Log first error for debugging
  const firstError = results.find(r => r.status === 'rejected')
  if (firstError) {
    console.log(`   ⚠️ Sample error: ${firstError.reason?.message || firstError.reason}`)
  }
  
  console.log('   📊 Results:')
  console.log(`      Total transactions: ${testUsers.length}`)
  console.log(`      Successful: ${successful}`)
  console.log(`      Failed: ${failed}`)
  console.log(`      Total time: ${endTime - startTime}ms`)
  console.log(`      Avg per transaction: ${Math.round((endTime - startTime) / testUsers.length)}ms`)
  
  // Allow up to 10% failure rate for concurrent stress test
  if (failed > testUsers.length * 0.1) {
    throw new Error(`Too many transaction failures: ${failed}/${testUsers.length} (${Math.round(failed/testUsers.length*100)}%)`)
  }
  
  // Verify transactions created
  const createdTransactions = await prisma.transaction.count({
    where: {
      metadata: {
        path: ['loadTest'],
        equals: true
      }
    }
  })
  
  console.log(`   ✅ ${createdTransactions} transactions created successfully`)
  console.log('   ✅ Concurrent transaction test passed\n')
}

async function cleanup() {
  console.log('🧹 Cleaning up load test data...')
  
  // Delete test transactions
  await prisma.transaction.deleteMany({
    where: {
      metadata: {
        path: ['loadTest'],
        equals: true
      }
    }
  })
  
  // Delete test users and related data
  await prisma.wallet.deleteMany({
    where: {
      user: {
        email: { contains: 'loadtest' }
      }
    }
  })
  
  await prisma.user.deleteMany({
    where: {
      email: { contains: 'loadtest' }
    }
  })
  
  console.log('   ✅ Load test data cleaned up\n')
}

// Run tests
testConcurrentLoads()
  .then(async (success) => {
    if (success) {
      await cleanup()
      console.log('🎉 Concurrent load testing completed successfully!')
      process.exit(0)
    } else {
      console.log('💥 Concurrent load testing failed!')
      process.exit(1)
    }
  })
  .catch(async (error) => {
    console.error('💥 Fatal error:', error)
    await cleanup()
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
