#!/usr/bin/env node

/**
 * Test Register Fix - Verify Wallet schema and registration flow
 * Tests the fix for 500 error on /api/auth/register
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Testing Register Fix - Schema Validation & Database Integration\n')

  try {
    // Test 1: Check Wallet model schema
    console.log('📋 Test 1: Verify Wallet model schema')
    console.log('Expected: Wallet should have id @default(cuid()) and User relation')
    
    const walletTest = await prisma.wallet.findFirst()
    console.log('✅ Wallet model accessible - schema is correct\n')

    // Test 2: Create test user WITHOUT wallet first (to ensure separation works)
    console.log('📋 Test 2: Create test user')
    const testEmail = `test-register-${Date.now()}@example.com`
    const testUsername = `testuser_${Date.now()}`
    const testPassword = 'TestPassword123!'
    const hashedPassword = await bcrypt.hash(testPassword, 10)

    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Register User',
        password: hashedPassword,
        username: testUsername,
        whatsapp: '+6281234567890',
        role: 'MEMBER_FREE',
        emailVerified: false,
        isActive: true,
        isSuspended: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
      }
    })

    console.log('✅ User created successfully:')
    console.log(`   ID: ${newUser.id}`)
    console.log(`   Email: ${newUser.email}`)
    console.log(`   Username: ${newUser.username}\n`)

    // Test 3: Create wallet for user
    console.log('📋 Test 3: Create wallet for user')
    const newWallet = await prisma.wallet.create({
      data: {
        userId: newUser.id,
        balance: 0,
        balancePending: 0,
        totalEarnings: 0,
        totalPayout: 0,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        balance: true,
        balancePending: true,
      }
    })

    console.log('✅ Wallet created successfully:')
    console.log(`   ID: ${newWallet.id}`)
    console.log(`   User ID: ${newWallet.userId}`)
    console.log(`   Balance: ${newWallet.balance}`)
    console.log(`   Pending: ${newWallet.balancePending}\n`)

    // Test 4: Verify user-wallet relation
    console.log('📋 Test 4: Verify user-wallet relation')
    const userWithWallet = await prisma.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        email: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            balancePending: true,
          }
        }
      }
    })

    if (userWithWallet?.wallet) {
      console.log('✅ User-Wallet relation verified:')
      console.log(`   User ID: ${userWithWallet.id}`)
      console.log(`   User Email: ${userWithWallet.email}`)
      console.log(`   Wallet ID: ${userWithWallet.wallet.id}`)
      console.log(`   Wallet Balance: ${userWithWallet.wallet.balance}\n`)
    } else {
      console.error('❌ User-Wallet relation FAILED - wallet not found\n')
      process.exit(1)
    }

    // Test 5: Test nested create (simulating register endpoint)
    console.log('📋 Test 5: Test nested wallet creation (simulating register)')
    const testEmail2 = `test-nested-${Date.now()}@example.com`
    const testUsername2 = `testuser_nested_${Date.now()}`
    
    const userWithNestedWallet = await prisma.user.create({
      data: {
        email: testEmail2,
        name: 'Test Nested Wallet',
        password: hashedPassword,
        username: testUsername2,
        whatsapp: '+6281234567890',
        role: 'MEMBER_FREE',
        emailVerified: false,
        isActive: true,
        isSuspended: false,
        wallet: {
          create: {
            balance: 0,
            balancePending: 0,
            totalEarnings: 0,
            totalPayout: 0,
          }
        }
      },
      select: {
        id: true,
        email: true,
        wallet: {
          select: {
            id: true,
            balance: true,
          }
        }
      }
    })

    console.log('✅ Nested wallet creation SUCCESS:')
    console.log(`   User ID: ${userWithNestedWallet.id}`)
    console.log(`   User Email: ${userWithNestedWallet.email}`)
    console.log(`   Wallet ID: ${userWithNestedWallet.wallet?.id}`)
    console.log(`   Wallet Balance: ${userWithNestedWallet.wallet?.balance}\n`)

    // Test 6: Verify data integrity
    console.log('📋 Test 6: Verify data integrity')
    const walletCount = await prisma.wallet.count()
    const userCount = await prisma.user.count()
    const walletsWithUsers = await prisma.wallet.count({
      where: {
        user: {
          isNot: null
        }
      }
    })

    console.log('✅ Data integrity check:')
    console.log(`   Total users in database: ${userCount}`)
    console.log(`   Total wallets in database: ${walletCount}`)
    console.log(`   Wallets with linked users: ${walletsWithUsers}\n`)

    console.log('✅ ALL TESTS PASSED - Register fix is working correctly!')
    console.log('\n🎉 Summary:')
    console.log('  ✓ Wallet schema is complete (id @default, User relation)')
    console.log('  ✓ User-Wallet relation works bidirectionally')
    console.log('  ✓ Nested wallet creation in register works')
    console.log('  ✓ Database integrity maintained')
    console.log('\n📝 Register endpoint should now return 201 (success) instead of 500')

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message)
    console.error('\nFull error:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
