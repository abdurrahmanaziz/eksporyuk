import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
  console.log('🧪 Testing admin login...\n')

  const email = 'admin@eksporyuk.com'
  const password = 'admin123'

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email }
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log('✅ User found:')
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Role:', user.role)
    console.log('   Has password:', !!user.password)
    console.log('   Email verified:', user.emailVerified)
    console.log('   Is active:', user.isActive)

    // Test password
    if (user.password) {
      const isValid = await bcrypt.compare(password, user.password)
      console.log('\n🔑 Password test:', isValid ? '✅ VALID' : '❌ INVALID')
    } else {
      console.log('\n❌ No password set!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
