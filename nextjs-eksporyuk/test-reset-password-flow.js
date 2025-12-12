const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

async function testResetPasswordFlow() {
  console.log('\n' + '='.repeat(70))
  console.log('🔐 TESTING COMPLETE RESET PASSWORD FLOW')
  console.log('='.repeat(70) + '\n')
  
  try {
    // 1. Get admin user
    console.log('1️⃣ Getting Admin User...')
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!admin) {
      console.log('❌ No admin found')
      return
    }
    
    console.log('✅ Admin found:')
    console.log('   Email:', admin.email)
    console.log('   Name:', admin.name)
    
    // 2. Generate reset token like API does
    console.log('\n2️⃣ Generating Reset Token...')
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    // Delete old tokens
    await prisma.passwordResetToken.deleteMany({
      where: { email: admin.email }
    })
    
    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        email: admin.email,
        token,
        expiresAt,
        used: false
      }
    })
    
    console.log('✅ Token created:')
    console.log('   Token:', token.substring(0, 20) + '...')
    console.log('   Expires:', expiresAt.toLocaleString('id-ID'))
    
    // 3. Build reset link
    console.log('\n3️⃣ Building Reset Link...')
    const appUrl = 'http://localhost:3000' // Change to production URL if needed
    const resetLink = `${appUrl}/reset-password?token=${token}`
    
    console.log('✅ Reset link:')
    console.log('   ' + resetLink)
    console.log('   Length:', resetLink.length)
    
    // 4. Check email templates
    console.log('\n4️⃣ Checking Email Templates...')
    const templates = await prisma.brandedTemplate.findMany({
      where: {
        slug: { in: ['reset-password', 'password-reset-confirmation'] }
      }
    })
    
    if (templates.length === 0) {
      console.log('⚠️ No templates found')
    } else {
      console.log(`✅ Found ${templates.length} templates:`)
      templates.forEach(t => {
        console.log(`   - ${t.slug}: ${t.name} (${t.isActive ? 'Active' : 'Inactive'})`)
      })
    }
    
    // 5. Verify token is stored correctly
    console.log('\n5️⃣ Verifying Token in Database...')
    const storedToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })
    
    if (storedToken) {
      console.log('✅ Token verified in database:')
      console.log('   Email:', storedToken.email)
      console.log('   Expires:', storedToken.expiresAt.toLocaleString('id-ID'))
      console.log('   Used:', storedToken.used)
      const isExpired = storedToken.expiresAt < new Date()
      console.log('   Expired:', isExpired ? '❌ YES' : '✅ NO')
    } else {
      console.log('❌ Token not found in database!')
    }
    
    // 6. Summary
    console.log('\n' + '='.repeat(70))
    console.log('📋 NEXT STEPS TO TEST:')
    console.log('='.repeat(70))
    console.log('\n1. Test forgot password via web UI:')
    console.log(`   Visit: http://localhost:3000/forgot-password`)
    console.log(`   Enter email: ${admin.email}`)
    console.log(`   Check inbox for reset link`)
    console.log('\n2. Or manually test reset page:')
    console.log(`   Visit: ${resetLink}`)
    console.log('   Enter new password')
    console.log('   Click "Reset Password" button')
    console.log('\n3. Verify success:')
    console.log('   You should see success message')
    console.log('   Be redirected to login page')
    console.log(`   Try logging in with new password`)
    console.log('\n' + '='.repeat(70))
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  }
  
  await prisma.$disconnect()
}

testResetPasswordFlow().catch(console.error)
