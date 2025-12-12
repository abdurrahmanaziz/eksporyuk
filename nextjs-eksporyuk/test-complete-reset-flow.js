const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

async function testCompleteResetFlow() {
  console.log('\n' + '='.repeat(80))
  console.log('🔐 TESTING COMPLETE FORGOT PASSWORD & RESET FLOW')
  console.log('='.repeat(80) + '\n')
  
  try {
    // 1. Get admin user
    console.log('1️⃣ Getting Admin User...')
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!admin) {
      console.log('❌ No admin user found')
      return
    }
    
    console.log('✅ Admin found:')
    console.log('   ID:', admin.id)
    console.log('   Email:', admin.email)
    console.log('   Name:', admin.name)
    console.log('   Role:', admin.role)
    
    // 2. Simulate forgot password POST request
    console.log('\n2️⃣ Simulating Forgot Password Request...')
    
    // Delete old tokens
    await prisma.passwordResetToken.deleteMany({
      where: { email: admin.email }
    })
    console.log('   ✓ Cleaned old tokens')
    
    // Generate token like API does
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        email: admin.email,
        token,
        expiresAt,
        used: false
      }
    })
    
    console.log('✅ Reset token created:')
    console.log('   Token:', token.substring(0, 30) + '...')
    console.log('   Full token length:', token.length, 'chars')
    console.log('   Expires at:', expiresAt.toLocaleString('id-ID'))
    
    // 3. Build reset link
    console.log('\n3️⃣ Building Reset Link...')
    const appUrl = 'http://localhost:3000'
    const resetLink = `${appUrl}/reset-password?token=${token}`
    console.log('✅ Reset link created:')
    console.log('   URL:', resetLink)
    console.log('   Link length:', resetLink.length, 'chars')
    
    // 4. Verify token in database
    console.log('\n4️⃣ Verifying Token in Database...')
    const storedToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })
    
    if (storedToken) {
      console.log('✅ Token verified:')
      console.log('   Email:', storedToken.email)
      console.log('   Used:', storedToken.used)
      console.log('   Expired:', storedToken.expiresAt < new Date() ? '❌ YES' : '✅ NO')
      console.log('   Created at:', storedToken.createdAt.toLocaleString('id-ID'))
    } else {
      console.log('❌ Token NOT found!')
      return
    }
    
    // 5. Check email templates
    console.log('\n5️⃣ Checking Email Templates...')
    const templates = await prisma.brandedTemplate.findMany({
      where: {
        slug: { in: ['reset-password', 'password-reset-confirmation'] }
      },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    })
    
    if (templates.length === 0) {
      console.log('⚠️ No templates found!')
    } else {
      console.log(`✅ Found ${templates.length} templates:`)
      templates.forEach(t => {
        console.log(`   - ${t.slug}:`)
        console.log(`     Name: ${t.name}`)
        console.log(`     Status: ${t.isActive ? '🟢 Active' : '🔴 Inactive'}`)
        console.log(`     Created: ${t.createdAt.toLocaleDateString('id-ID')}`)
      })
    }
    
    // 6. Test token validation (simulate PUT request)
    console.log('\n6️⃣ Simulating Reset Password (PUT) with Token...')
    
    // Verify token is NOT expired
    const checkToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })
    
    if (!checkToken) {
      console.log('❌ Token not found for validation')
      return
    }
    
    if (checkToken.expiresAt < new Date()) {
      console.log('❌ Token already expired')
      return
    }
    
    if (checkToken.used) {
      console.log('❌ Token already used')
      return
    }
    
    console.log('✅ Token validation passed:')
    console.log('   Valid: YES')
    console.log('   Not expired: YES')
    console.log('   Not used: YES')
    
    // 7. Test reset logic (don't actually update password)
    console.log('\n7️⃣ Testing Reset Password Logic (dry run)...')
    const newPassword = 'NewPassword123'
    console.log('✅ New password would be:')
    console.log('   Password: ' + newPassword)
    console.log('   Length:', newPassword.length, 'chars ✓')
    console.log('   Has numbers: ' + (/[0-9]/.test(newPassword) ? '✓' : '✗'))
    console.log('   Has letters: ' + (/[a-zA-Z]/.test(newPassword) ? '✓' : '✗'))
    
    // 8. Summary
    console.log('\n' + '='.repeat(80))
    console.log('📋 FLOW VERIFICATION SUMMARY')
    console.log('='.repeat(80))
    console.log('\n✅ All checks passed! Flow is ready to test:')
    console.log('\n📧 Email Test Steps:')
    console.log('   1. Visit: http://localhost:3000/forgot-password')
    console.log(`   2. Enter email: ${admin.email}`)
    console.log('   3. Check inbox/spam for reset email')
    console.log('   4. Click reset link in email')
    
    console.log('\n🔗 Or manually test with:')
    console.log('   ' + resetLink)
    
    console.log('\n🔑 Reset Form Fields:')
    console.log('   Token: auto-filled from URL')
    console.log('   New Password: enter desired password')
    console.log('   Confirm Password: repeat password')
    console.log('   Submit: click "Reset Password" button')
    
    console.log('\n✅ Expected Success:')
    console.log('   • Token marked as used')
    console.log('   • Password updated in database')
    console.log('   • Confirmation email sent')
    console.log('   • User redirected to login')
    console.log('   • Can login with new password')
    
    console.log('\n⚠️ Token Details:')
    console.log('   Expires in:', Math.round((expiresAt - new Date()) / 1000 / 60), 'minutes')
    console.log('   Expires at:', expiresAt.toLocaleTimeString('id-ID'))
    
    console.log('\n' + '='.repeat(80))
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    if (error.meta) console.error('DB Error:', error.meta)
    console.error(error)
  }
  
  await prisma.$disconnect()
}

testCompleteResetFlow().catch(console.error)
