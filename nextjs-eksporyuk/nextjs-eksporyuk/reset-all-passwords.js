const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAllUserPasswords() {
  try {
    console.log('🔄 Resetting all user passwords to: password123\n')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Update all users
    const result = await prisma.user.updateMany({
      data: {
        password: hashedPassword
      }
    })
    
    console.log(`✅ Updated ${result.count} users\n`)
    
    // Show all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    })
    
    console.log('📋 All users with new password (password123):')
    console.log('='.repeat(70))
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Password: password123`)
      console.log('-'.repeat(70))
    })
    
    console.log('\n✅ All passwords reset successfully!')
    console.log('\n🔐 Login credentials:')
    console.log('Email: admin@eksporyuk.com')
    console.log('Password: password123')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAllUserPasswords()
