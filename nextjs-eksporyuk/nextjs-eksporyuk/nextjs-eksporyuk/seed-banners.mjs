import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const bannerData = [
  // 1. Dashboard - Carousel
  {
    title: 'Bergabung dengan Komunitas Eksportir Terbesar',
    description: 'Dapatkan akses ke ribuan eksportir sukses, tips ekspor, dan peluang bisnis global',
    imageUrl: 'https://images.pexels.com/photos/6169668/pexels-photo-6169668.jpeg?auto=compress&cs=tinysrgb&w=1920',
    linkUrl: '/community/groups',
    linkText: 'Join Sekarang',
    placement: 'DASHBOARD',
    displayType: 'CAROUSEL',
    backgroundColor: '#1e40af',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 10,
    isActive: true,
    isSponsored: false,
  },
  {
    title: 'Kursus Ekspor Gratis untuk Member Baru',
    description: 'Pelajari dasar-dasar ekspor dari mentor berpengalaman. Akses seumur hidup!',
    imageUrl: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1920',
    linkUrl: '/courses',
    linkText: 'Mulai Belajar',
    placement: 'DASHBOARD',
    displayType: 'CAROUSEL',
    backgroundColor: '#059669',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 9,
    isActive: true,
    isSponsored: false,
  },
  {
    title: 'Hubungkan dengan Buyer Internasional',
    description: 'Platform B2B matching dengan buyer dari 50+ negara. Mulai ekspor hari ini!',
    imageUrl: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1920',
    linkUrl: '/marketplace',
    linkText: 'Explore Marketplace',
    placement: 'DASHBOARD',
    displayType: 'CAROUSEL',
    backgroundColor: '#7c3aed',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 8,
    isActive: true,
    isSponsored: false,
  },

  // 2. Sidebar Banners
  {
    title: 'Upgrade ke Pro Member',
    description: 'Akses unlimited courses, mentoring, dan premium tools',
    imageUrl: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=600',
    linkUrl: '/membership',
    linkText: 'Upgrade Now',
    placement: 'SIDEBAR',
    displayType: 'STATIC',
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 10,
    isActive: true,
    isSponsored: false,
  },
  {
    title: 'Event Eksportir Minggu Ini',
    description: 'Webinar gratis: "Cara Mendapatkan Sertifikat Ekspor"',
    imageUrl: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=600',
    linkUrl: '/events',
    linkText: 'Daftar Gratis',
    placement: 'SIDEBAR',
    displayType: 'STATIC',
    backgroundColor: '#0891b2',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 8,
    isActive: true,
    isSponsored: false,
  },

  // 3. Feed Banners (inline setiap 5 posts)
  {
    title: 'Jasa Freight Forwarding Terpercaya',
    description: 'Kirim produk Anda ke seluruh dunia dengan aman dan cepat',
    imageUrl: 'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=1200',
    linkUrl: 'https://wa.me/628123456789',
    linkText: 'Hubungi Kami',
    placement: 'FEED',
    displayType: 'INLINE',
    backgroundColor: '#f59e0b',
    textColor: '#000000',
    buttonColor: '#000000',
    buttonTextColor: '#ffffff',
    priority: 7,
    isActive: true,
    isSponsored: true,
    sponsorName: 'Global Logistics',
    sponsorLogo: 'https://images.pexels.com/photos/1116302/pexels-photo-1116302.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    title: 'Software Accounting untuk Eksportir',
    description: 'Kelola invoice, PO, dan laporan keuangan ekspor dengan mudah',
    imageUrl: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1200',
    linkUrl: '/products/accounting-software',
    linkText: 'Coba Gratis 30 Hari',
    placement: 'FEED',
    displayType: 'INLINE',
    backgroundColor: '#6366f1',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 6,
    isActive: true,
    isSponsored: true,
    sponsorName: 'EksporPro',
    sponsorLogo: 'https://images.pexels.com/photos/39284/macbook-apple-imac-computer-39284.jpeg?auto=compress&cs=tinysrgb&w=200',
  },

  // 4. Group Sidebar
  {
    title: 'Mentor Ekspor Online',
    description: 'Konsultasi 1-on-1 dengan mentor berpengalaman',
    imageUrl: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600',
    linkUrl: '/mentors',
    linkText: 'Pilih Mentor',
    placement: 'GROUP',
    displayType: 'STATIC',
    backgroundColor: '#10b981',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 8,
    isActive: true,
    isSponsored: false,
  },
  {
    title: 'Template Dokumen Ekspor',
    description: 'Download 50+ template dokumen ekspor gratis',
    imageUrl: 'https://images.pexels.com/photos/3184431/pexels-photo-3184431.jpeg?auto=compress&cs=tinysrgb&w=600',
    linkUrl: '/resources/templates',
    linkText: 'Download Sekarang',
    placement: 'GROUP',
    displayType: 'STATIC',
    backgroundColor: '#8b5cf6',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 7,
    isActive: true,
    isSponsored: false,
  },

  // 5. Profile Sidebar
  {
    title: 'Lengkapi Profil Anda',
    description: 'Dapatkan lebih banyak peluang dengan profil yang lengkap',
    imageUrl: 'https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=600',
    linkUrl: '/profile/edit',
    linkText: 'Lengkapi Profil',
    placement: 'PROFILE',
    displayType: 'STATIC',
    backgroundColor: '#ec4899',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 9,
    isActive: true,
    isSponsored: false,
  },

  // 6. Floating Banner
  {
    title: 'Promo Membership 50% OFF',
    description: 'Hanya hari ini! Upgrade ke Pro Member dengan diskon 50%',
    imageUrl: 'https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=400',
    linkUrl: '/membership?promo=PROMO50',
    linkText: 'Klaim Promo',
    placement: 'FLOATING',
    displayType: 'FLOATING',
    backgroundColor: '#ef4444',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 10,
    isActive: true,
    isSponsored: false,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 hari dari sekarang
  },

  // 7. Popup Banner
  {
    title: 'Selamat Datang di EksporYuk!',
    description: 'Dapatkan ebook gratis "Panduan Lengkap Memulai Ekspor" untuk member baru',
    imageUrl: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    linkUrl: '/resources/ebook-panduan-ekspor',
    linkText: 'Download Gratis',
    placement: 'POPUP',
    displayType: 'POPUP',
    backgroundColor: '#0284c7',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 10,
    isActive: true,
    isSponsored: false,
    viewLimit: 1, // Hanya tampil 1x per user
  },
]

async function main() {
  console.log('🎨 Seeding banners...')

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@eksporyuk.com' }
  })

  if (!admin) {
    console.log('❌ Admin user not found')
    return
  }

  for (const banner of bannerData) {
    await prisma.banner.create({
      data: {
        ...banner,
        startDate: new Date(),
        endDate: banner.endDate ? new Date(banner.endDate) : new Date('2030-12-31'),
        targetRoles: banner.targetRoles || [],
        targetMemberships: banner.targetMemberships || [],
        targetProvinces: banner.targetProvinces || [],
        createdBy: admin.id,
      },
    })
    console.log(`✅ Created: ${banner.title} (${banner.placement})`)
  }

  const count = await prisma.banner.count()
  console.log(`\n✅ Total ${count} banners created!`)
  console.log('\n📍 Banner Placements:')
  console.log('- DASHBOARD: 3 carousel banners')
  console.log('- SIDEBAR: 2 static banners')
  console.log('- FEED: 2 inline sponsored banners')
  console.log('- GROUP: 2 sidebar banners')
  console.log('- PROFILE: 1 sidebar banner')
  console.log('- FLOATING: 1 floating promo banner')
  console.log('- POPUP: 1 welcome popup banner')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
