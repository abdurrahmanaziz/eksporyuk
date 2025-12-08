import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Creating admin user...\n')

  const email = 'admin@eksporyuk.com'
  const password = 'admin123'
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // Try to create admin user
    const admin = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: 'Admin EksporYuk',
        role: 'ADMIN',
        emailVerified: true,
        isActive: true,
      },
    })

    console.log('✅ Admin user created successfully!\n')
    console.log('=' .repeat(50))
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('👤 Name:', admin.name)
    console.log('🎭 Role:', admin.role)
    console.log('🆔 ID:', admin.id)
    console.log('=' .repeat(50))
    console.log('\n⚠️  Please change password after first login!\n')
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin user already exists. Updating...\n')
      
      const admin = await prisma.user.update({
        where: { email: email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: true,
          isActive: true,
        },
      })

      console.log('✅ Admin user updated!\n')
      console.log('=' .repeat(50))
      console.log('📧 Email:', email)
      console.log('🔑 Password:', password)
      console.log('👤 Name:', admin.name)
      console.log('🎭 Role:', admin.role)
      console.log('=' .repeat(50))
      console.log('\n⚠️  Password has been reset!\n')
    } else {
      throw error
    }
  }
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
