const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function testLogin() {
  try {
    const email = 'admin@eksporyuk.com'
    const password = 'password123'
    
    console.log('🔍 Testing login...\n')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}\n`)
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      }
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log('✅ User found:')
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Has password: ${!!user.password}\n`)

    if (!user.password) {
      console.log('❌ User has no password in database!')
      return
    }

    const isValid = await bcrypt.compare(password, user.password)
    
    if (isValid) {
      console.log('✅ Password is CORRECT!')
      console.log('✅ Login should work!\n')
    } else {
      console.log('❌ Password is INCORRECT!')
      console.log('❌ Password mismatch!\n')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
