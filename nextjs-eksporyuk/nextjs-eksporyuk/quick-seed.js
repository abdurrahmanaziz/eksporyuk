const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function quickSeed() {
  try {
    console.log('🚀 Quick seeding essential data...')

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@eksporyuk.com' },
      update: {},
      create: {
        email: 'admin@eksporyuk.com',
        name: 'Admin Ekspor Yuk',
        password: hashedPassword,
        role: 'ADMIN',
        whatsapp: '+6281234567890',
        phone: '081234567890',
        isActive: true,
        emailVerified: true,
        profileCompleted: true,
      }
    })

    // Create wallet for admin
    await prisma.wallet.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        balance: 10000000, // 10M IDR
      }
    })

    // Create affiliate for testing
    const affiliate = await prisma.user.upsert({
      where: { email: 'affiliate@eksporyuk.com' },
      update: {},
      create: {
        email: 'affiliate@eksporyuk.com',
        name: 'Test Affiliate',
        password: hashedPassword,
        role: 'AFFILIATE',
        whatsapp: '+6281234567891',
        phone: '081234567891',
        isActive: true,
        emailVerified: true,
        profileCompleted: true,
        affiliateMenuEnabled: true,
      }
    })

    // Create wallet for affiliate with balance
    await prisma.wallet.upsert({
      where: { userId: affiliate.id },
      update: {},
      create: {
        userId: affiliate.id,
        balance: 500000, // 500k IDR for testing withdrawal
      }
    })

    // Create affiliate profile
    await prisma.affiliateProfile.upsert({
      where: { userId: affiliate.id },
      update: {},
      create: {
        userId: affiliate.id,
        isActive: true,
        commissionRate: 30,
        totalEarnings: 0,
      }
    })

    // Create basic settings
    await prisma.settings.upsert({
      where: { id: 'main' },
      update: {},
      create: {
        id: 'main',
        siteName: 'Ekspor Yuk',
        siteDescription: 'Platform edukasi ekspor Indonesia',
        withdrawalMinAmount: 50000,
        withdrawalAdminFee: 5000,
        withdrawalPinRequired: true,
        paymentEnableXendit: true,
      }
    })

    console.log('✅ Quick seed completed!')
    console.log('👤 Admin: admin@eksporyuk.com / admin123')
    console.log('👤 Affiliate: affiliate@eksporyuk.com / admin123')

  } catch (error) {
    console.error('❌ Seed error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickSeed()