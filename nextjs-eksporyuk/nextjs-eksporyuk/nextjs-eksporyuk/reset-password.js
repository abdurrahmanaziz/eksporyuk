const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function resetPassword() {
  try {
    const email = 'admin@eksporyuk.com'
    const newPassword = 'password123' // Simple password for testing
    
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Password reset berhasil!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${newPassword}`)
    console.log('\nSilakan login dengan password baru ini.')
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

resetPassword()
