const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testForgotPassword() {
  console.log('\n🔍 Testing Forgot Password System...\n')
  
  try {
    // 1. Check if admin user exists
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!admin) {
      console.log('❌ No admin user found')
      return
    }
    
    console.log('✅ Found admin user:', admin.email)
    console.log('   Name:', admin.name)
    console.log('   Username:', admin.username)
    
    // 2. Check reset-password template
    const template = await prisma.brandedTemplate.findUnique({
      where: { slug: 'reset-password' }
    })
    
    if (template) {
      console.log('\n✅ Reset password template exists')
      console.log('   Name:', template.name)
      console.log('   Subject:', template.subject)
      console.log('   Variables needed: userName, resetLink, expiryTime')
    } else {
      console.log('\n⚠️  Reset password template not found')
      console.log('   Will use fallback HTML')
    }
    
    // 3. Check email settings
    const settings = await prisma.setting.findFirst({
      where: {
        OR: [
          { key: { startsWith: 'email_' } },
          { key: { startsWith: 'mailketing_' } }
        ]
      }
    })
    
    if (settings) {
      console.log('\n✅ Email settings configured')
    } else {
      console.log('\n⚠️  No email settings found')
    }
    
    // 4. Check recent password reset tokens
    const recentTokens = await prisma.passwordResetToken.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
    
    if (recentTokens.length > 0) {
      console.log('\n📝 Recent password reset requests:')
      recentTokens.forEach((token, i) => {
        const isExpired = new Date(token.expiresAt) < new Date()
        console.log(`   ${i + 1}. ${token.user.email}`)
        console.log(`      Token: ${token.token.substring(0, 10)}...`)
        console.log(`      Status: ${isExpired ? '❌ Expired' : '✅ Active'}`)
        console.log(`      Created: ${token.createdAt.toLocaleString('id-ID')}`)
        console.log(`      Expires: ${token.expiresAt.toLocaleString('id-ID')}`)
      })
    } else {
      console.log('\n📝 No password reset requests found')
    }
    
    // 5. Instructions
    console.log('\n📋 Test Instructions:')
    console.log('   1. Visit: http://localhost:3000/forgot-password')
    console.log(`   2. Enter email: ${admin.email}`)
    console.log('   3. Submit form')
    console.log('   4. Check email inbox for reset link')
    console.log('   5. Click link to reset password')
    console.log('\n   Note: Link expires in 1 hour')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
  
  await prisma.$disconnect()
}

testForgotPassword().catch(console.error)
