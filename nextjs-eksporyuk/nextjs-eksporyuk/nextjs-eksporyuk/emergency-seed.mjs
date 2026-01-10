import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function emergencySeed() {
  console.log('🚨 EMERGENCY SEED - Creating minimal admin user...\n')
  
  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@eksporyuk.com' },
      update: {},
      create: {
        email: 'admin@eksporyuk.com',
        password: hashedPassword,
        name: 'Admin Eksporyuk',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        memberCode: 'ADMIN001',
        username: 'admin'
      }
    })
    
    console.log('✅ Admin user created:', admin.email)
    console.log('📧 Email: admin@eksporyuk.com')
    console.log('🔑 Password: admin123')
    console.log('\n⚠️  PLEASE CHANGE PASSWORD IMMEDIATELY AFTER LOGIN!\n')
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

emergencySeed()
