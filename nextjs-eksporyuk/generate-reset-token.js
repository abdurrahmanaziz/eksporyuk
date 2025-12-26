/**
 * Generate Fresh Reset Password Token
 * Usage: node generate-reset-token.js EMAIL
 */

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

async function generateResetToken() {
  const email = process.argv[2] || 'admin@eksporyuk.com'
  
  console.log(`🔑 Generating reset token for: ${email}\n`)
  
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    })
    
    if (!user) {
      console.log('❌ User not found!')
      process.exit(1)
    }
    
    console.log('✅ User found:', user.name || user.email)
    
    // Delete old unused tokens for this email
    const deletedCount = await prisma.passwordResetToken.deleteMany({
      where: { 
        email,
        used: false
      }
    })
    
    if (deletedCount.count > 0) {
      console.log(`🗑️  Deleted ${deletedCount.count} old token(s)`)
    }
    
    // Generate new token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    })
    
    console.log('\n✅ Token generated successfully!')
    console.log('\n📋 Token Details:')
    console.log('   ID:', resetToken.id)
    console.log('   Email:', resetToken.email)
    console.log('   Expires:', resetToken.expiresAt.toLocaleString('id-ID'))
    console.log('\n🔗 Reset Link:')
    console.log(`   http://localhost:3000/auth/reset-password?token=${token}`)
    console.log('\n   OR for production:')
    console.log(`   https://eksporyuk.com/auth/reset-password?token=${token}`)
    console.log('\n💡 Use this link to test reset password!')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

generateResetToken()
