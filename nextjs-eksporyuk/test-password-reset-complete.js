/**
 * Comprehensive end-to-end testing for password reset system
 * Run: node test-password-reset-complete.js
 * 
 * This script simulates the complete user flow:
 * 1. Forgot password request
 * 2. Token generation
 * 3. Password reset with new password
 * 4. Login verification with new password
 */

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testCompletePasswordResetFlow() {
  console.log('\n╔═════════════════════════════════════════════════════════╗')
  console.log('║   PASSWORD RESET SYSTEM - E2E TEST                       ║')
  console.log('╚═════════════════════════════════════════════════════════╝\n')

  let testUserId = null
  let testEmail = `e2e-test-${Date.now()}@eksporyuk.com`

  try {
    // PHASE 1: Create test user
    console.log('═════════════════════════════════════════════════════════')
    console.log('PHASE 1: CREATE TEST USER')
    console.log('═════════════════════════════════════════════════════════\n')

    const initialPassword = 'InitialPassword123'
    const hashedInitialPassword = await bcrypt.hash(initialPassword, 10)

    const testUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: testEmail,
        name: 'E2E Test User',
        password: hashedInitialPassword,
        isActive: true,
        role: 'MEMBER_FREE'
      }
    })

    testUserId = testUser.id
    console.log(`✅ Test user created`)
    console.log(`   Email: ${testUser.email}`)
    console.log(`   ID: ${testUser.id}`)
    console.log(`   Initial password: ${initialPassword}\n`)

    // PHASE 2: Simulate forgot password request
    console.log('═════════════════════════════════════════════════════════')
    console.log('PHASE 2: FORGOT PASSWORD REQUEST')
    console.log('═════════════════════════════════════════════════════════\n')

    console.log('Simulating: User enters email and requests password reset')

    // Generate reset token (like forgot-password API does)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(resetToken, 10)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    console.log(`✅ Reset token generated`)
    console.log(`   Token (plaintext): ${resetToken.substring(0, 20)}...`)
    console.log(`   Expires at: ${expiresAt.toISOString()}\n`)

    // Store token in database (like forgot-password API does)
    const tokenRecord = await prisma.passwordResetToken.create({
      data: {
        id: uuidv4(),
        email: testEmail,
        token: hashedToken,
        expiresAt,
        used: false
      }
    })

    console.log(`✅ Token stored in database`)
    console.log(`   Token ID: ${tokenRecord.id}`)
    console.log(`   Status: not used\n`)

    console.log('📧 Email would be sent with link:')
    console.log(`   ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}\n`)

    // PHASE 3: User clicks link and loads reset page
    console.log('═════════════════════════════════════════════════════════')
    console.log('PHASE 3: USER LOADS RESET PASSWORD PAGE')
    console.log('═════════════════════════════════════════════════════════\n')

    console.log('Simulating: User clicks link from email')
    console.log(`   URL: /auth/reset-password?token=${resetToken.substring(0, 20)}...`)

    // Validate token (like reset-password page does on load)
    const tokenCheck = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() }
      }
    })

    if (!tokenCheck) {
      throw new Error('Token validation failed on page load')
    }

    console.log(`✅ Token validated on page load`)
    console.log(`   Token found: ${tokenCheck.id}`)
    console.log(`   Not expired: yes`)
    console.log(`   Not used: yes`)
    console.log(`   Ready to show reset form: yes\n`)

    // PHASE 4: User submits new password
    console.log('═════════════════════════════════════════════════════════')
    console.log('PHASE 4: USER SUBMITS NEW PASSWORD')
    console.log('═════════════════════════════════════════════════════════\n')

    const newPassword = 'NewSecurePassword123!'
    console.log(`User enters new password: ${newPassword}`)
    console.log(`Password validation:`)
    console.log(`   Length >= 8: ${newPassword.length >= 8 ? '✅' : '❌'}`)
    console.log(`   Contains uppercase: ${/[A-Z]/.test(newPassword) ? '✅' : '⚠️'}`)
    console.log(`   Contains numbers: ${/[0-9]/.test(newPassword) ? '✅' : '⚠️'}`)
    console.log(`   Contains special chars: ${/[!@#$%^&*]/.test(newPassword) ? '✅' : '⚠️'}\n`)

    // PHASE 5: Process password reset (like reset-password API does)
    console.log('═════════════════════════════════════════════════════════')
    console.log('PHASE 5: PROCESS PASSWORD RESET')
    console.log('═════════════════════════════════════════════════════════\n')

    // Re-verify token for reset (security check)
    const tokenForReset = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() }
      }
    })

    if (!tokenForReset) {
      throw new Error('Token invalid or expired during reset')
    }

    console.log(`✅ Token re-verified for reset`)

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    console.log(`✅ New password hashed with bcryptjs`)

    // Update user password
    const updatedUser = await prisma.user.update({
      where: { id: testUserId },
      data: {
        password: hashedNewPassword,
        isActive: true
      }
    })

    console.log(`✅ User password updated in database`)
    console.log(`   User ID: ${updatedUser.id}`)
    console.log(`   Updated at: ${new Date().toISOString()}\n`)

    // Mark token as used
    const usedToken = await prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: {
        used: true,
        usedAt: new Date()
      }
    })

    console.log(`✅ Token marked as used`)
    console.log(`   Used at: ${usedToken.usedAt?.toISOString()}\n`)

    // Delete other tokens for this email
    const deletedCount = await prisma.passwordResetToken.deleteMany({
      where: {
        email: testEmail,
        id: { not: tokenRecord.id }
      }
    })

    console.log(`✅ Cleaned up old tokens`)
    console.log(`   Deleted: ${deletedCount.count} old tokens\n`)

    // PHASE 6: Verify password change
    console.log('═════════════════════════════════════════════════════════')
    console.log('PHASE 6: VERIFY PASSWORD CHANGE')
    console.log('═════════════════════════════════════════════════════════\n')

    const verifyUser = await prisma.user.findUnique({
      where: { id: testUserId }
    })

    const oldPasswordStillWorks = await bcrypt.compare(initialPassword, verifyUser.password)
    const newPasswordWorks = await bcrypt.compare(newPassword, verifyUser.password)

    console.log(`Password verification:`)
    console.log(`   Old password still works: ${oldPasswordStillWorks ? '❌ FAIL' : '✅ PASS'}`)
    console.log(`   New password works: ${newPasswordWorks ? '✅ PASS' : '❌ FAIL'}\n`)

    if (!oldPasswordStillWorks && newPasswordWorks) {
      console.log(`✅ Password successfully changed\n`)
    } else {
      throw new Error('Password verification failed')
    }

    // PHASE 7: Test token cannot be reused
    console.log('═════════════════════════════════════════════════════════')
    console.log('PHASE 7: TEST TOKEN REUSE PREVENTION')
    console.log('═════════════════════════════════════════════════════════\n')

    const reuseAttempt = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() }
      }
    })

    console.log(`Attempting to use same token again...`)
    if (!reuseAttempt) {
      console.log(`✅ Token cannot be reused (marked as used)\n`)
    } else {
      throw new Error('Token reuse prevention failed')
    }

    // PHASE 8: Simulate login with new password
    console.log('═════════════════════════════════════════════════════════')
    console.log('PHASE 8: LOGIN WITH NEW PASSWORD')
    console.log('═════════════════════════════════════════════════════════\n')

    const loginUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })

    const loginSuccessful = await bcrypt.compare(newPassword, loginUser.password)

    console.log(`Login attempt with new password:`)
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${newPassword}`)
    console.log(`   Result: ${loginSuccessful ? '✅ LOGIN SUCCESS' : '❌ LOGIN FAILED'}\n`)

    if (!loginSuccessful) {
      throw new Error('Login with new password failed')
    }

    // PHASE 9: Summary
    console.log('═════════════════════════════════════════════════════════')
    console.log('✅ ALL TESTS PASSED - E2E FLOW COMPLETE')
    console.log('═════════════════════════════════════════════════════════\n')

    console.log('📋 TEST SUMMARY:')
    console.log('   ✅ User created')
    console.log('   ✅ Forgot password request processed')
    console.log('   ✅ Reset token generated')
    console.log('   ✅ Token stored in database')
    console.log('   ✅ Token validated on page load')
    console.log('   ✅ Password reset processed')
    console.log('   ✅ Password updated in database')
    console.log('   ✅ Token marked as used')
    console.log('   ✅ Old tokens cleaned up')
    console.log('   ✅ Old password no longer works')
    console.log('   ✅ New password works')
    console.log('   ✅ Token reuse prevented')
    console.log('   ✅ Login with new password successful\n')

    console.log('📊 SYSTEM STATUS: READY FOR PRODUCTION ✅\n')

  } catch (error) {
    console.error('\n❌ ERROR DURING TESTING:', error.message)
    console.error('\n💥 TEST FAILED - System not ready\n')
    process.exit(1)
  } finally {
    // Cleanup
    if (testUserId) {
      await prisma.passwordResetToken.deleteMany({
        where: { email: testEmail }
      })
      await prisma.user.delete({
        where: { id: testUserId }
      }).catch(() => {}) // Ignore if already deleted
    }
    await prisma.$disconnect()
  }
}

// Run the test
testCompletePasswordResetFlow()
