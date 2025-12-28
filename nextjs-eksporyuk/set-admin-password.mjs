import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Setting admin password for local development...\n')

  const adminEmail = 'admin@eksporyuk.com'
  const newPassword = 'admin123'

  // Find admin
  const admin = await prisma.user.findFirst({
    where: { email: adminEmail }
  })

  if (!admin) {
    console.log('❌ Admin user not found!')
    return
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update password
  await prisma.user.update({
    where: { id: admin.id },
    data: { password: hashedPassword }
  })

  console.log('✅ Password updated successfully!')
  console.log('\n📝 Login Credentials:')
  console.log(`   URL: http://localhost:3000/auth/login`)
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Password: ${newPassword}`)
  console.log('\n🎯 You can now login to local development!')

  await prisma.$disconnect()
}

main().catch(console.error)
