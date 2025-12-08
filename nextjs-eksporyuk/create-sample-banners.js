const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createSampleBanners() {
  console.log('Creating sample banners...')

  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.error('No admin user found. Please create an admin user first.')
    await prisma.$disconnect()
    return
  }

  const now = new Date()
  const oneMonthLater = new Date()
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

  try {
    // Dashboard Banner - Hero style
    const dashboardBanner = await prisma.banner.create({
      data: {
        title: 'Bergabung dengan Komunitas Eksportir Indonesia',
        description: 'Temukan peluang ekspor, akses ke mentor berpengalaman, dan jaringan eksportir terpercaya.',
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1200&h=600&fit=crop',
        linkUrl: '/community/groups',
        linkText: 'Jelajahi Komunitas',
        placement: 'DASHBOARD',
        displayType: 'CAROUSEL',
        backgroundColor: '#1e40af',
        textColor: '#ffffff',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
        priority: 1,
        startDate: now,
        endDate: oneMonthLater,
        isActive: true,
        isSponsored: false,
        targetRoles: ['MEMBER_FREE', 'MEMBER_PREMIUM', 'AFFILIATE', 'MENTOR', 'ADMIN'],
        createdBy: adminUser.id,
      },
    })
    console.log('✓ Dashboard banner created:', dashboardBanner.id)

    // Feed Banner - Between posts
    const feedBanner = await prisma.banner.create({
      data: {
        title: 'Upgrade ke Premium - Fitur Lengkap untuk Eksportir',
        description: 'Dapatkan akses ke semua kursus ekspor, konsultasi mentor, dan tools analitik bisnis.',
        imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&h=400&fit=crop',
        linkUrl: '/pricing',
        linkText: 'Lihat Paket Premium',
        placement: 'FEED',
        displayType: 'INLINE',
        backgroundColor: '#f59e0b',
        textColor: '#ffffff',
        buttonColor: '#ffffff',
        buttonTextColor: '#f59e0b',
        priority: 2,
        startDate: now,
        endDate: oneMonthLater,
        isActive: true,
        isSponsored: false,
        targetRoles: ['MEMBER_FREE', 'MEMBER_PREMIUM', 'AFFILIATE', 'MENTOR', 'ADMIN'],
        createdBy: adminUser.id,
      },
    })
    console.log('✓ Feed banner created:', feedBanner.id)

    // Sidebar Banner - Compact
    const sidebarBanner = await prisma.banner.create({
      data: {
        title: 'Kursus Ekspor Online',
        description: 'Pelajari cara ekspor dari nol hingga mahir. Dipandu mentor bersertifikat.',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
        linkUrl: '/courses',
        linkText: 'Mulai Belajar',
        placement: 'SIDEBAR',
        displayType: 'STATIC',
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        buttonColor: '#ffffff',
        buttonTextColor: '#10b981',
        priority: 3,
        startDate: now,
        endDate: oneMonthLater,
        isActive: true,
        isSponsored: false,
        targetRoles: ['MEMBER_FREE', 'MEMBER_PREMIUM', 'AFFILIATE', 'MENTOR', 'ADMIN'],
        createdBy: adminUser.id,
      },
    })
    console.log('✓ Sidebar banner created:', sidebarBanner.id)

    // Sponsored Banner Example
    const sponsoredBanner = await prisma.banner.create({
      data: {
        title: 'Jasa Logistik Ekspor Terpercaya',
        description: 'Kirim produk Anda ke seluruh dunia dengan harga kompetitif dan layanan cepat.',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=400&fit=crop',
        linkUrl: 'https://example.com/logistic',
        linkText: 'Konsultasi Gratis',
        placement: 'FEED',
        displayType: 'INLINE',
        backgroundColor: '#6366f1',
        textColor: '#ffffff',
        buttonColor: '#ffffff',
        buttonTextColor: '#6366f1',
        priority: 4,
        startDate: now,
        endDate: oneMonthLater,
        isActive: true,
        isSponsored: true,
        sponsorName: 'PT Logistik Nusantara',
        sponsorLogo: 'https://via.placeholder.com/50x50?text=LN',
        targetRoles: ['MEMBER_FREE', 'MEMBER_PREMIUM', 'AFFILIATE', 'MENTOR', 'ADMIN'],
        createdBy: adminUser.id,
      },
    })
    console.log('✓ Sponsored banner created:', sponsoredBanner.id)

    // Dashboard Banner 2 - For carousel
    const dashboardBanner2 = await prisma.banner.create({
      data: {
        title: 'Event Webinar: Strategi Ekspor 2025',
        description: 'Pelajari tren pasar global dan strategi ekspor terkini dari para ahli industri.',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop',
        linkUrl: '/events',
        linkText: 'Daftar Sekarang',
        placement: 'DASHBOARD',
        displayType: 'CAROUSEL',
        backgroundColor: '#dc2626',
        textColor: '#ffffff',
        buttonColor: '#ffffff',
        buttonTextColor: '#dc2626',
        priority: 5,
        startDate: now,
        endDate: oneMonthLater,
        isActive: true,
        isSponsored: false,
        targetRoles: ['MEMBER_FREE', 'MEMBER_PREMIUM', 'AFFILIATE', 'MENTOR', 'ADMIN'],
        createdBy: adminUser.id,
      },
    })
    console.log('✓ Dashboard banner 2 created:', dashboardBanner2.id)

    console.log('\n✅ All sample banners created successfully!')
    console.log('\nBanner placements:')
    console.log('- DASHBOARD: 2 banners (carousel)')
    console.log('- FEED: 2 banners (shown every 5 posts)')
    console.log('- SIDEBAR: 1 banner')

  } catch (error) {
    console.error('Error creating banners:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleBanners()
