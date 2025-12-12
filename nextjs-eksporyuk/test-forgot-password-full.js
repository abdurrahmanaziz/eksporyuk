const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testForgotPasswordFull() {
  console.log('\n🔐 TESTING FORGOT PASSWORD FLOW\n')
  
  try {
    // 1. Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!admin) {
      console.log('❌ No admin user found')
      return
    }
    
    console.log('👤 Admin User:')
    console.log('   Email:', admin.email)
    console.log('   Name:', admin.name)
    
    // 2. Simulate forgot password request
    const crypto = require('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    console.log('\n🎫 Creating password reset token...')
    
    // Delete old tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: admin.id }
    })
    
    // Create new token
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: admin.id,
        token,
        expiresAt
      }
    })
    
    console.log('   Token created:', token.substring(0, 10) + '...')
    console.log('   Expires:', expiresAt.toLocaleString('id-ID'))
    
    // 3. Test email sending via actual system
    console.log('\n📧 Testing email send via system...')
    
    const resetLink = `http://localhost:3000/reset-password?token=${token}`
    
    // Import and use the actual mailketing service
    const { sendEmail } = await import('./src/lib/integrations/mailketing.ts')
    
    console.log('   Using: integrations/mailketing.ts')
    console.log('   To:', admin.email)
    console.log('   Reset Link:', resetLink)
    
    try {
      const result = await sendEmail({
        recipient: admin.email,
        subject: '🔐 Reset Password - EksporYuk',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Reset Password</h1>
            <p>Halo <strong>${admin.name}</strong>,</p>
            <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
            <p>
              <a href="${resetLink}" 
                 style="display: inline-block; background: #ef4444; color: white; 
                        padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                Reset Password Sekarang
              </a>
            </p>
            <p>Atau copy link berikut:</p>
            <p style="background: #f3f4f6; padding: 10px; word-break: break-all;">${resetLink}</p>
            <p><small>Link ini akan expired dalam 1 jam.</small></p>
          </div>
        `,
        fromEmail: 'admin@eksporyuk.com',
        fromName: 'Tim Ekspor Yuk'
      })
      
      console.log('\n📊 Send Result:')
      console.log('   Success:', result.success)
      if (result.success) {
        console.log('   ✅ EMAIL SENT SUCCESSFULLY!')
        console.log('   Message ID:', result.messageId || 'N/A')
      } else {
        console.log('   ❌ FAILED:', result.error)
      }
      
    } catch (emailError) {
      console.log('\n❌ Email send error:', emailError.message)
    }
    
    console.log('\n📋 Manual Test:')
    console.log('   1. Check email inbox:', admin.email)
    console.log('   2. Or visit reset link:', resetLink)
    console.log('   3. Enter new password')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  }
  
  await prisma.$disconnect()
}

testForgotPasswordFull().catch(console.error)
