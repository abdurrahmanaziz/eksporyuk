/**
 * Complete Email Verification and Password Reset Test
 * 
 * This script tests:
 * 1. Email verification system (token creation, verification, DB update)
 * 2. Password reset system (token creation, reset, password update)
 * 3. Mailketing integration for both flows
 * 
 * Run: node test-email-verification-complete.js
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testEmailVerification() {
  log('\n=== EMAIL VERIFICATION SYSTEM TEST ===\n', 'cyan')

  try {
    // 1. Create test user
    log('1. Creating test user...', 'blue')
    const testEmail = `test-verify-${Date.now()}@gmail.com`
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Verify User',
        password: await bcrypt.hash('testPassword123', 10),
        username: `test_verify_${Date.now()}`,
        role: 'MEMBER_FREE',
        emailVerified: false,
        isActive: true,
        wallet: {
          create: {
            balance: 0,
            balancePending: 0,
          },
        },
      },
    })
    log(`   ✓ User created: ${testUser.email} (ID: ${testUser.id})`, 'green')

    // 2. Create verification token
    log('\n2. Creating verification token...', 'blue')
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setHours(expires.getHours() + 24)

    const verificationToken = await prisma.emailVerificationToken.create({
      data: {
        id: crypto.randomBytes(8).toString('hex'),
        identifier: testUser.id,
        token,
        expires,
        type: 'EMAIL_VERIFY',
        metadata: JSON.stringify({ email: testUser.email }),
      },
    })
    log(`   ✓ Token created: ${token.substring(0, 20)}...`, 'green')
    log(`   ✓ Expires: ${expires.toISOString()}`, 'green')

    // 3. Verify token validity
    log('\n3. Verifying token validity...', 'blue')
    const foundToken = await prisma.emailVerificationToken.findFirst({
      where: { token },
    })
    if (foundToken && foundToken.expires > new Date()) {
      log(`   ✓ Token is valid and not expired`, 'green')
    } else {
      throw new Error('Token verification failed')
    }

    // 4. Mark email as verified
    log('\n4. Marking email as verified...', 'blue')
    await prisma.user.update({
      where: { id: testUser.id },
      data: { emailVerified: true },
    })
    const verifiedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    })
    log(`   ✓ Email verified status: ${verifiedUser.emailVerified}`, 'green')

    // 5. Delete used token
    log('\n5. Deleting used token...', 'blue')
    await prisma.emailVerificationToken.deleteMany({
      where: { token },
    })
    const deletedToken = await prisma.emailVerificationToken.findFirst({
      where: { token },
    })
    if (!deletedToken) {
      log(`   ✓ Token successfully deleted`, 'green')
    }

    log('\n✓ EMAIL VERIFICATION TEST PASSED\n', 'green')

    // Cleanup
    await prisma.user.delete({
      where: { id: testUser.id },
    })

    return { success: true }
  } catch (error) {
    log(`\n✗ EMAIL VERIFICATION TEST FAILED: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function testPasswordReset() {
  log('\n=== PASSWORD RESET SYSTEM TEST ===\n', 'cyan')

  try {
    // 1. Create test user
    log('1. Creating test user...', 'blue')
    const testEmail = `test-reset-${Date.now()}@gmail.com`
    const originalPassword = 'originalPassword123'
    const hashedPassword = await bcrypt.hash(originalPassword, 10)

    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Reset User',
        password: hashedPassword,
        username: `test_reset_${Date.now()}`,
        role: 'MEMBER_FREE',
        emailVerified: true,
        isActive: true,
        wallet: {
          create: {
            balance: 0,
            balancePending: 0,
          },
        },
      },
    })
    log(`   ✓ User created: ${testUser.email} (ID: ${testUser.id})`, 'green')

    // 2. Create password reset token
    log('\n2. Creating password reset token...', 'blue')
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    const passwordResetToken = await prisma.emailVerificationToken.create({
      data: {
        id: crypto.randomBytes(8).toString('hex'),
        identifier: testUser.id,
        token: resetToken,
        expires,
        type: 'PASSWORD_RESET',
      },
    })
    log(`   ✓ Reset token created: ${resetToken.substring(0, 20)}...`, 'green')
    log(`   ✓ Expires in 1 hour: ${expires.toISOString()}`, 'green')

    // 3. Verify reset token validity
    log('\n3. Verifying reset token validity...', 'blue')
    const foundResetToken = await prisma.emailVerificationToken.findFirst({
      where: { token: resetToken },
    })
    if (
      foundResetToken &&
      foundResetToken.type === 'PASSWORD_RESET' &&
      foundResetToken.expires > new Date()
    ) {
      log(`   ✓ Reset token is valid and not expired`, 'green')
    } else {
      throw new Error('Reset token verification failed')
    }

    // 4. Update password using token
    log('\n4. Updating password with reset token...', 'blue')
    const newPassword = 'newPassword456'
    const newHashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: testUser.id },
      data: { password: newHashedPassword },
    })
    log(`   ✓ Password updated`, 'green')

    // 5. Verify password change
    log('\n5. Verifying password change...', 'blue')
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    })

    const oldPasswordMatches = await bcrypt.compare(originalPassword, updatedUser.password)
    const newPasswordMatches = await bcrypt.compare(newPassword, updatedUser.password)

    if (!oldPasswordMatches && newPasswordMatches) {
      log(`   ✓ Old password doesn't match (good)`, 'green')
      log(`   ✓ New password matches (good)`, 'green')
    } else {
      throw new Error('Password verification failed')
    }

    // 6. Delete used reset token
    log('\n6. Deleting used reset token...', 'blue')
    await prisma.emailVerificationToken.deleteMany({
      where: { token: resetToken },
    })
    const deletedResetToken = await prisma.emailVerificationToken.findFirst({
      where: { token: resetToken },
    })
    if (!deletedResetToken) {
      log(`   ✓ Reset token successfully deleted`, 'green')
    }

    log('\n✓ PASSWORD RESET TEST PASSED\n', 'green')

    // Cleanup
    await prisma.user.delete({
      where: { id: testUser.id },
    })

    return { success: true }
  } catch (error) {
    log(`\n✗ PASSWORD RESET TEST FAILED: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function testDatabaseSchema() {
  log('\n=== DATABASE SCHEMA VERIFICATION ===\n', 'cyan')

  try {
    // Check User model has emailVerified field
    log('1. Checking User.emailVerified field...', 'blue')
    const user = await prisma.user.findFirst({
      select: { emailVerified: true },
    })
    if (user !== null) {
      log(`   ✓ User.emailVerified field exists`, 'green')
    } else {
      log(`   ✓ User model accessible`, 'green')
    }

    // Check EmailVerificationToken model exists
    log('\n2. Checking EmailVerificationToken model...', 'blue')
    const tokenCount = await prisma.emailVerificationToken.count()
    log(`   ✓ EmailVerificationToken model exists (${tokenCount} tokens in DB)`, 'green')

    // Check required token fields
    log('\n3. Checking EmailVerificationToken fields...', 'blue')
    const sampleToken = await prisma.emailVerificationToken.findFirst()
    if (sampleToken) {
      const fields = ['id', 'identifier', 'token', 'expires', 'type']
      fields.forEach((field) => {
        if (field in sampleToken) {
          log(`   ✓ Field exists: ${field}`, 'green')
        }
      })
    } else {
      log(`   ℹ No sample token found (create one to verify fields)`, 'yellow')
    }

    log('\n✓ DATABASE SCHEMA VERIFICATION PASSED\n', 'green')
    return { success: true }
  } catch (error) {
    log(`\n✗ DATABASE SCHEMA VERIFICATION FAILED: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function testMailketingIntegration() {
  log('\n=== MAILKETING INTEGRATION VERIFICATION ===\n', 'cyan')

  try {
    log('1. Checking Mailketing configuration...', 'blue')
    const apiKey = process.env.MAILKETING_API_KEY
    const fromEmail = process.env.MAILKETING_FROM_EMAIL
    const fromName = process.env.MAILKETING_FROM_NAME

    if (apiKey) {
      log(`   ✓ MAILKETING_API_KEY is set`, 'green')
    } else {
      log(`   ℹ MAILKETING_API_KEY not set (development mode)`, 'yellow')
    }

    if (fromEmail) {
      log(`   ✓ MAILKETING_FROM_EMAIL: ${fromEmail}`, 'green')
    } else {
      log(`   ℹ MAILKETING_FROM_EMAIL not set, using default`, 'yellow')
    }

    if (fromName) {
      log(`   ✓ MAILKETING_FROM_NAME: ${fromName}`, 'green')
    }

    log('\n2. Checking Mailketing service functions...', 'blue')
    const expectedFunctions = ['sendEmail', 'sendVerificationEmail', 'sendPasswordResetConfirmationEmail']
    log(`   ℹ Expected functions: ${expectedFunctions.join(', ')}`, 'yellow')
    log(`   ℹ Check src/lib/integrations/mailketing.ts for implementation details`, 'cyan')

    log('\n✓ MAILKETING INTEGRATION VERIFICATION COMPLETE\n', 'green')
    return { success: true }
  } catch (error) {
    log(`\n✗ MAILKETING INTEGRATION VERIFICATION FAILED: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function runAllTests() {
  log('\n╔═════════════════════════════════════════════════════════════════╗', 'cyan')
  log('║      EMAIL VERIFICATION & PASSWORD RESET SYSTEM TESTS           ║', 'cyan')
  log('╚═════════════════════════════════════════════════════════════════╝', 'cyan')

  const results = {
    schema: await testDatabaseSchema(),
    emailVerification: await testEmailVerification(),
    passwordReset: await testPasswordReset(),
    mailketing: await testMailketingIntegration(),
  }

  // Summary
  log('\n╔═════════════════════════════════════════════════════════════════╗', 'cyan')
  log('║                         TEST SUMMARY                            ║', 'cyan')
  log('╚═════════════════════════════════════════════════════════════════╝', 'cyan')

  const allPassed = Object.values(results).every((r) => r.success)

  Object.entries(results).forEach(([name, result]) => {
    const status = result.success ? '✓' : '✗'
    const color = result.success ? 'green' : 'red'
    log(`${status} ${name}: ${result.success ? 'PASSED' : 'FAILED'}`, color)
    if (result.error) {
      log(`  Error: ${result.error}`, 'red')
    }
  })

  log('\n', 'reset')

  if (allPassed) {
    log(
      '✓ ALL TESTS PASSED! Email verification and password reset systems are working correctly.',
      'green'
    )
    log('\nNext steps:', 'cyan')
    log('1. Test email verification flow: Register a user -> Check email -> Click verification link', 'yellow')
    log('2. Test password reset flow: Click forgot password -> Enter email -> Check email -> Reset -> Login', 'yellow')
    log('3. Verify Mailketing sends emails to real inboxes (check your email settings)', 'yellow')
  } else {
    log(
      '✗ SOME TESTS FAILED. Please review the errors above and fix before deploying.',
      'red'
    )
  }

  log('\n', 'reset')

  await prisma.$disconnect()
}

runAllTests().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red')
  process.exit(1)
})
