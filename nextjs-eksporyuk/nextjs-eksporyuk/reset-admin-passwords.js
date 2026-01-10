const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function resetAdminPasswords() {
  try {
    console.log('🔧 Resetting admin passwords...\n')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Update all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true }
    })

    console.log(`Found ${admins.length} admin users:\n`)

    for (const admin of admins) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { 
          password: hashedPassword,
          emailVerified: true 
        }
      })
      console.log(`✅ ${admin.name} (${admin.email})`)
      console.log(`   Password reset to: password123\n`)
    }

    console.log('✅ All admin passwords have been reset!')
    console.log('\n📋 Login dengan salah satu akun ini:')
    admins.forEach(admin => {
      console.log(`   ${admin.email} / password123`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPasswords()
