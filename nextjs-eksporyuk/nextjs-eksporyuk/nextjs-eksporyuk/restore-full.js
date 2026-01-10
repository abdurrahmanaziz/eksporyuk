const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function restoreEssentialData() {
  console.log('🔄 Restoring essential database...\n')
  
  try {
    // 1. Create essential users
    console.log('👥 Creating users...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const users = []
    
    // Admin
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
    users.push(admin)
    console.log('✅ Admin user')
    
    // Mentor
    const mentor = await prisma.user.upsert({
      where: { email: 'mentor@eksporyuk.com' },
      update: {},
      create: {
        email: 'mentor@eksporyuk.com',
        password: hashedPassword,
        name: 'Budi Mentor',
        username: 'mentor',
        role: 'MENTOR',
        emailVerified: true,
        whatsapp: '6281234567891',
      },
    })
    users.push(mentor)
    console.log('✅ Mentor user')
    
    // Create mentor profile
    await prisma.mentorProfile.upsert({
      where: { userId: mentor.id },
      update: {},
      create: {
        userId: mentor.id,
        bio: 'Expert di bidang ekspor dengan pengalaman 10+ tahun',
        expertise: 'Ekspor, Legalitas, Dokumen',
        isActive: true,
      },
    })
    console.log('✅ Mentor profile')
    
    // Affiliate
    const affiliate = await prisma.user.upsert({
      where: { email: 'affiliate@eksporyuk.com' },
      update: {},
      create: {
        email: 'affiliate@eksporyuk.com',
        password: hashedPassword,
        name: 'Siti Affiliate',
        username: 'affiliate',
        role: 'AFFILIATE',
        emailVerified: true,
        whatsapp: '6281234567892',
      },
    })
    users.push(affiliate)
    console.log('✅ Affiliate user')
    
    // Note: Affiliate profile creation skipped - will be created via onboarding flow
    console.log('⏩ Affiliate profile (will be created via onboarding)')
    
    // 2. Create wallets for all users
    console.log('\n💰 Creating wallets...')
    for (const user of users) {
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: 0,
          balancePending: 0,
        },
      })
    }
    console.log('✅ All wallets created')
    
    // 3. Create basic memberships
    console.log('\n📦 Creating memberships...')
    
    const freeMembership = await prisma.membership.upsert({
      where: { slug: 'free' },
      update: {},
      create: {
        name: 'Member FREE',
        slug: 'free',
        description: 'Akses gratis untuk memulai belajar ekspor',
        price: 0,
        priceMonthly: 0,
        duration: 365,
        durationUnit: 'days',
        membershipType: 'FREE',
        isActive: true,
        status: 'ACTIVE',
        showInGeneralCheckout: true,
      },
    })
    console.log('✅ FREE membership')
    
    const premiumMembership = await prisma.membership.upsert({
      where: { slug: 'premium' },
      update: {},
      create: {
        name: 'Member PREMIUM',
        slug: 'premium',
        description: 'Akses penuh ke semua kelas & mentoring',
        price: 500000,
        priceMonthly: 50000,
        duration: 365,
        durationUnit: 'days',
        membershipType: 'PREMIUM',
        isActive: true,
        status: 'ACTIVE',
        showInGeneralCheckout: true,
        affiliateCommissionRate: 30,
      },
    })
    console.log('✅ PREMIUM membership')
    
    // 4. Create basic lead magnets
    console.log('\n🧲 Creating lead magnets...')
    
    await prisma.leadMagnet.upsert({
      where: { slug: 'ebook-panduan-ekspor' },
      update: {},
      create: {
        name: 'E-book Panduan Ekspor Pemula',
        slug: 'ebook-panduan-ekspor',
        description: 'Panduan lengkap memulai bisnis ekspor dari nol',
        type: 'PDF',
        fileUrl: 'https://eksporyuk.com/downloads/ebook-panduan-ekspor.pdf',
        isActive: true,
        createdById: admin.id,
      },
    })
    console.log('✅ Lead magnet PDF')
    
    await prisma.leadMagnet.upsert({
      where: { slug: 'webinar-gratis' },
      update: {},
      create: {
        name: 'Webinar Gratis: Rahasia Ekspor Sukses',
        slug: 'webinar-gratis',
        description: 'Webinar eksklusif tentang tips ekspor',
        type: 'EVENT',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true,
        createdById: admin.id,
      },
    })
    console.log('✅ Lead magnet Event')
    
    console.log('\n🎉 Database restoration completed!\n')
    console.log('📊 Summary:')
    console.log('   - Users: 3 (Admin, Mentor, Affiliate)')
    console.log('   - Wallets: 3')
    console.log('   - Memberships: 2 (FREE, PREMIUM)')
    console.log('   - Lead Magnets: 2')
    console.log('\n🔐 Login credentials:')
    console.log('   Admin: azizbiasa@gmail.com / admin123')
    console.log('   Mentor: mentor@eksporyuk.com / admin123')
    console.log('   Affiliate: affiliate@eksporyuk.com / admin123')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

restoreEssentialData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
