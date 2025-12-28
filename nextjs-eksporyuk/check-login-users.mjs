import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking production users for local login...\n')

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true
    }
  })

  if (admin) {
    console.log('👤 ADMIN User:')
    console.log(`   Email: ${admin.email}`)
    console.log(`   Name: ${admin.name}`)
    console.log(`   Has Password: ${admin.password ? '✅' : '❌'}`)
    console.log(`   Password Hash: ${admin.password?.substring(0, 20)}...`)
  }

  // Get sample affiliate
  const affiliate = await prisma.user.findFirst({
    where: { role: 'AFFILIATE' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true
    }
  })

  if (affiliate) {
    console.log('\n👤 Sample AFFILIATE User:')
    console.log(`   Email: ${affiliate.email}`)
    console.log(`   Name: ${affiliate.name}`)
    console.log(`   Has Password: ${affiliate.password ? '✅' : '❌'}`)
  }

  // Test admin password
  if (admin && admin.password) {
    const testPasswords = ['admin123', 'password', '123456', 'admin']
    console.log('\n🔐 Testing common passwords for admin...')
    
    for (const pwd of testPasswords) {
      const match = await bcrypt.compare(pwd, admin.password)
      if (match) {
        console.log(`   ✅ FOUND: "${pwd}" works!`)
        break
      }
    }
  }

  console.log('\n📝 Login Instructions:')
  console.log('   1. Go to: http://localhost:3000/auth/login')
  console.log(`   2. Email: ${admin?.email || 'admin@eksporyuk.com'}`)
  console.log('   3. Password: (check above or set new password)')
  
  await prisma.$disconnect()
}

main().catch(console.error)
