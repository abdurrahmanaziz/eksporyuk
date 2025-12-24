const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function restoreMinimalData() {
  console.log('🔄 Restoring minimal data...')
  
  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.upsert({
      where: { email: 'azizbiasa@gmail.com' },
      update: {},
      create: {
        email: 'azizbiasa@gmail.com',
        password: hashedPassword,
        name: 'Admin Eksporyuk',
        username: 'admin',
        role: 'ADMIN',
        emailVerified: true,
        whatsapp: '6281234567890',
      },
    })
    
    console.log('✅ Admin user created:', admin.email)
    
    // Create wallet for admin
    await prisma.wallet.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        balance: 0,
        balancePending: 0,
      },
    })
    
    console.log('✅ Admin wallet created')
    
    console.log('\n🎉 Minimal data restored!')
    console.log('\nLogin credentials:')
    console.log('Email: azizbiasa@gmail.com')
    console.log('Password: admin123')
    console.log('\n⚠️  IMPORTANT:')
    console.log('1. Restore dari Neon backup untuk data lengkap')
    console.log('2. Atau re-seed semua data dengan seed files')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

restoreMinimalData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
