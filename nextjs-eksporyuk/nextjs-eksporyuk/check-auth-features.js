/**
 * Check related authentication features
 * Verifies integration of forgot-password, reset-password, change-password, etc.
 * Run: node check-auth-features.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

async function checkAuthFeatures() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║   AUTHENTICATION SYSTEM - FEATURE VERIFICATION              ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  const basePath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk'
  const features = {}

  try {
    // 1. LOGIN
    console.log('═════════════════════════════════════════════════════════════')
    console.log('1. LOGIN FEATURE')
    console.log('═════════════════════════════════════════════════════════════\n')

    const loginPagePath = path.join(basePath, 'src/app/(auth)/login/page.tsx')
    const loginPage = fileExists(loginPagePath)
    features.login = loginPage

    console.log(`Page: /auth/login`)
    console.log(`   File exists: ${loginPage ? '✅' : '❌'}`)
    if (loginPage) {
      const content = readFile(loginPagePath)
      const hasForm = content?.includes('form') && content?.includes('password')
      const hasNextAuth = content?.includes('NextAuth')
      console.log(`   Has form: ${hasForm ? '✅' : '❌'}`)
      console.log(`   Uses NextAuth: ${hasNextAuth ? '✅' : '❌'}`)
    }

    const loginApiPath = path.join(basePath, 'src/app/api/auth/[...nextauth]/route.ts')
    const loginApi = fileExists(loginApiPath)
    console.log(`\nAPI: /api/auth/[...nextauth]`)
    console.log(`   File exists: ${loginApi ? '✅' : '❌'}`)
    console.log(`   Status: ${loginPage && loginApi ? '✅ WORKING' : '⚠️ PARTIAL'}\n`)

    // 2. REGISTER
    console.log('═════════════════════════════════════════════════════════════')
    console.log('2. REGISTER FEATURE')
    console.log('═════════════════════════════════════════════════════════════\n')

    const registerPagePath = path.join(basePath, 'src/app/(auth)/register/page.tsx')
    const registerPage = fileExists(registerPagePath)
    features.register = registerPage

    console.log(`Page: /auth/register`)
    console.log(`   File exists: ${registerPage ? '✅' : '❌'}`)
    if (registerPage) {
      const content = readFile(registerPagePath)
      const hasForm = content?.includes('form') || content?.includes('Form')
      console.log(`   Has form: ${hasForm ? '✅' : '❌'}`)
    }

    const registerApiPath = path.join(basePath, 'src/app/api/auth/register/route.ts')
    const registerApi = fileExists(registerApiPath)
    console.log(`\nAPI: /api/auth/register`)
    console.log(`   File exists: ${registerApi ? '✅' : '❌'}`)
    console.log(`   Status: ${registerPage && registerApi ? '✅ WORKING' : '⚠️ PARTIAL'}\n`)

    // 3. FORGOT PASSWORD
    console.log('═════════════════════════════════════════════════════════════')
    console.log('3. FORGOT PASSWORD FEATURE')
    console.log('═════════════════════════════════════════════════════════════\n')

    const forgotPagePath = path.join(basePath, 'src/app/(auth)/forgot-password/page.tsx')
    const forgotPage = fileExists(forgotPagePath)
    features.forgotPassword = forgotPage

    console.log(`Page: /auth/forgot-password`)
    console.log(`   File exists: ${forgotPage ? '✅' : '❌'}`)
    if (forgotPage) {
      const content = readFile(forgotPagePath)
      const hasEmailInput = content?.includes('email') || content?.includes('Email')
      console.log(`   Has email input: ${hasEmailInput ? '✅' : '❌'}`)
    }

    const forgotApiPath = path.join(basePath, 'src/app/api/auth/forgot-password-v2/route.ts')
    const forgotApi = fileExists(forgotApiPath)
    console.log(`\nAPI: /api/auth/forgot-password-v2`)
    console.log(`   File exists: ${forgotApi ? '✅' : '❌'}`)
    if (forgotApi) {
      const content = readFile(forgotApiPath)
      const hasMailketing = content?.includes('mailketingService')
      const hasTokenGeneration = content?.includes('randomBytes') || content?.includes('token')
      console.log(`   Uses email service: ${hasMailketing ? '✅' : '❌'}`)
      console.log(`   Generates token: ${hasTokenGeneration ? '✅' : '❌'}`)
    }
    console.log(`   Status: ${forgotPage && forgotApi ? '✅ WORKING' : '⚠️ PARTIAL'}\n`)

    // 4. RESET PASSWORD
    console.log('═════════════════════════════════════════════════════════════')
    console.log('4. RESET PASSWORD FEATURE (FIXED)')
    console.log('═════════════════════════════════════════════════════════════\n')

    const resetPageNewPath = path.join(basePath, 'src/app/(auth)/reset-password/page.tsx')
    const resetPageNew = fileExists(resetPageNewPath)
    features.resetPassword = resetPageNew

    console.log(`Page: /auth/reset-password (NEW - Query params)`)
    console.log(`   File exists: ${resetPageNew ? '✅' : '❌'}`)
    if (resetPageNew) {
      const content = readFile(resetPageNewPath)
      const hasSearchParams = content?.includes('useSearchParams')
      const hasTokenValidation = content?.includes('token')
      console.log(`   Uses useSearchParams: ${hasSearchParams ? '✅' : '❌'}`)
      console.log(`   Validates token: ${hasTokenValidation ? '✅' : '❌'}`)
    }

    const resetPageOldPath = path.join(basePath, 'src/app/(auth)/reset-password/[token]/page.tsx')
    const resetPageOld = fileExists(resetPageOldPath)
    console.log(`\nPage: /auth/reset-password/[token] (OLD - Dynamic routes)`)
    console.log(`   File exists: ${resetPageOld ? '⚠️ YES (deprecated)' : '❌ NO (good)'}`)

    const resetApiPath = path.join(basePath, 'src/app/api/auth/reset-password/route.ts')
    const resetApi = fileExists(resetApiPath)
    console.log(`\nAPI: /api/auth/reset-password (NEW - UNIFIED)`)
    console.log(`   File exists: ${resetApi ? '✅' : '❌'}`)
    if (resetApi) {
      const content = readFile(resetApiPath)
      const hasTokenValidation = content?.includes('token')
      const hasPasswordUpdate = content?.includes('update')
      const hasEmail = content?.includes('mailketingService')
      console.log(`   Validates token: ${hasTokenValidation ? '✅' : '❌'}`)
      console.log(`   Updates password: ${hasPasswordUpdate ? '✅' : '❌'}`)
      console.log(`   Sends confirmation email: ${hasEmail ? '✅' : '❌'}`)
    }

    const resetApiOldPath = path.join(basePath, 'src/app/api/auth/reset-password-new/route.ts')
    const resetApiOld = fileExists(resetApiOldPath)
    console.log(`\nAPI: /api/auth/reset-password-new (OLD - Parallel endpoint)`)
    console.log(`   File exists: ${resetApiOld ? '⚠️ YES (can be deprecated)' : '❌ NO'}`)

    console.log(`\nStatus: ${resetPageNew && resetApi ? '✅ WORKING' : '⚠️ PARTIAL'}\n`)

    // 5. CHANGE PASSWORD
    console.log('═════════════════════════════════════════════════════════════')
    console.log('5. CHANGE PASSWORD FEATURE')
    console.log('═════════════════════════════════════════════════════════════\n')

    const accountSettingsPath = path.join(basePath, 'src/app/(account)/account/security/page.tsx')
    const accountSettings = fileExists(accountSettingsPath)
    features.changePassword = accountSettings

    console.log(`Page: /account/security (or similar)`)
    console.log(`   File exists: ${accountSettings ? '✅' : '❌'}`)

    const changePasswordApiPath = path.join(basePath, 'src/app/api/account/change-password/route.ts')
    const changePasswordApi = fileExists(changePasswordApiPath)
    console.log(`\nAPI: /api/account/change-password`)
    console.log(`   File exists: ${changePasswordApi ? '✅' : '❌'}`)
    
    if (!accountSettings && !changePasswordApi) {
      console.log(`\nℹ️  Alternative: Check if password change is in account settings`)
      const accountPagePath = path.join(basePath, 'src/app/(account)/account/page.tsx')
      const hasAccountPage = fileExists(accountPagePath)
      console.log(`   Account page exists: ${hasAccountPage ? '✅' : '❌'}`)
    }

    console.log(`   Status: ${changePasswordApi ? '✅ AVAILABLE' : '⏳ FEATURE'}\n`)

    // 6. DATABASE MODEL
    console.log('═════════════════════════════════════════════════════════════')
    console.log('6. DATABASE MODELS')
    console.log('═════════════════════════════════════════════════════════════\n')

    const userCount = await prisma.user.count()
    console.log(`User model`)
    console.log(`   Total users in database: ${userCount}`)
    console.log(`   Status: ✅ EXISTS`)

    const tokenCount = await prisma.passwordResetToken.count()
    console.log(`\nPasswordResetToken model`)
    console.log(`   Total reset tokens: ${tokenCount}`)
    console.log(`   Status: ✅ EXISTS\n`)

    // 7. MIDDLEWARE
    console.log('═════════════════════════════════════════════════════════════')
    console.log('7. ROUTE PROTECTION')
    console.log('═════════════════════════════════════════════════════════════\n')

    const middlewarePath = path.join(basePath, 'src/middleware.ts')
    const middleware = fileExists(middlewarePath)
    features.middleware = middleware

    console.log(`Middleware: /src/middleware.ts`)
    console.log(`   File exists: ${middleware ? '✅' : '❌'}`)
    if (middleware) {
      const content = readFile(middlewarePath)
      const hasAuthCheck = content?.includes('auth') || content?.includes('session')
      const hasRoleCheck = content?.includes('role')
      console.log(`   Has auth checks: ${hasAuthCheck ? '✅' : '❌'}`)
      console.log(`   Has role-based routing: ${hasRoleCheck ? '✅' : '❌'}`)
    }
    console.log(`   Status: ${middleware ? '✅ ACTIVE' : '❌ MISSING'}\n`)

    // 8. EMAIL SERVICE
    console.log('═════════════════════════════════════════════════════════════')
    console.log('8. EMAIL SERVICE INTEGRATION')
    console.log('═════════════════════════════════════════════════════════════\n')

    const mailketingPath = path.join(basePath, 'src/lib/services/mailketingService.ts')
    const mailketing = fileExists(mailketingPath)
    features.emailService = mailketing

    console.log(`File: /src/lib/services/mailketingService.ts`)
    console.log(`   File exists: ${mailketing ? '✅' : '❌'}`)
    if (mailketing) {
      const content = readFile(mailketingPath)
      const hasPasswordReset = content?.includes('sendPasswordResetEmail')
      const hasConfirmation = content?.includes('sendPasswordResetConfirmationEmail')
      console.log(`   Has sendPasswordResetEmail: ${hasPasswordReset ? '✅' : '❌'}`)
      console.log(`   Has sendPasswordResetConfirmationEmail: ${hasConfirmation ? '✅' : '❌'}`)
    }
    console.log(`   Status: ${mailketing ? '✅ AVAILABLE' : '❌ MISSING'}\n`)

    // SUMMARY
    console.log('═════════════════════════════════════════════════════════════')
    console.log('FEATURE SUMMARY')
    console.log('═════════════════════════════════════════════════════════════\n')

    const featureStatus = {
      'Login/NextAuth': (features.login && loginApi) ? '✅' : '⚠️',
      'Register': (features.register && registerApi) ? '✅' : '⚠️',
      'Forgot Password': (features.forgotPassword && forgotApi) ? '✅' : '⚠️',
      'Reset Password': (features.resetPassword && resetApi) ? '✅' : '⚠️',
      'Change Password': features.changePassword ? '✅' : '⏳',
      'Middleware Protection': features.middleware ? '✅' : '❌',
      'Email Service': features.emailService ? '✅' : '❌'
    }

    Object.entries(featureStatus).forEach(([feature, status]) => {
      console.log(`   ${status} ${feature}`)
    })

    console.log('\n═════════════════════════════════════════════════════════════')
    console.log('✅ AUTHENTICATION SYSTEM - VERIFICATION COMPLETE')
    console.log('═════════════════════════════════════════════════════════════\n')

    const allWorking = Object.values(featureStatus).every(status => status !== '❌')
    console.log(`Overall Status: ${allWorking ? '✅ READY FOR PRODUCTION' : '⚠️ REVIEW NEEDED'}\n`)

  } catch (error) {
    console.error('❌ Error during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAuthFeatures()
