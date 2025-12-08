// Script untuk membuat banner sample untuk dashboard member premium
// Run: node seed-premium-banners.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🎨 Creating sample banners for Premium Member Dashboard...')

  // Get admin user for createdBy
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.log('❌ No admin user found. Creating banners with placeholder ID.')
  }

  const createdBy = adminUser?.id || 'system'

  // Delete existing sample banners
  await prisma.banner.deleteMany({
    where: {
      title: {
        startsWith: '[SAMPLE]'
      }
    }
  })

  const now = new Date()
  const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year from now

  const banners = [
    {
      title: '[SAMPLE] Webinar Ekspor Gratis - Strategi Ekspor 2025',
      description: 'Ikuti webinar eksklusif bersama pakar ekspor Indonesia. Pelajari strategi dan tips terbaru untuk menembus pasar internasional. Gratis untuk member premium!',
      imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      linkUrl: '/events',
      linkText: 'Daftar Sekarang',
      targetRoles: ['MEMBER_PREMIUM', 'ADMIN', 'MENTOR'],
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      backgroundColor: '#1E40AF',
      textColor: '#FFFFFF',
      buttonColor: '#FCD34D',
      buttonTextColor: '#1E3A8A',
      priority: 10,
      startDate: now,
      endDate: endDate,
      isActive: true,
      isSponsored: false,
      createdBy,
    },
    {
      title: '[SAMPLE] Template Dokumen Ekspor Premium',
      description: 'Akses 50+ template dokumen ekspor siap pakai. Invoice, Packing List, COO, Bill of Lading, dan lainnya. Download unlimited!',
      imageUrl: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      linkUrl: '/documents/export',
      linkText: 'Lihat Template',
      targetRoles: ['MEMBER_PREMIUM', 'ADMIN', 'MENTOR'],
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      backgroundColor: '#059669',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#059669',
      priority: 9,
      startDate: now,
      endDate: endDate,
      isActive: true,
      isSponsored: false,
      createdBy,
    },
    {
      title: '[SAMPLE] Database 10.000+ Buyer Internasional',
      description: 'Temukan buyer potensial dari 50+ negara. Data lengkap dengan kontak, produk yang dicari, dan volume pembelian.',
      imageUrl: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      linkUrl: '/databases/buyers',
      linkText: 'Akses Database',
      targetRoles: ['MEMBER_PREMIUM', 'ADMIN', 'MENTOR'],
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      backgroundColor: '#7C3AED',
      textColor: '#FFFFFF',
      buttonColor: '#FDE68A',
      buttonTextColor: '#5B21B6',
      priority: 8,
      startDate: now,
      endDate: endDate,
      isActive: true,
      isSponsored: false,
      createdBy,
    },
    {
      title: '[SAMPLE] Promo Kursus Ekspor - Diskon 50%',
      description: 'Tingkatkan skill ekspor Anda dengan kursus premium. Dibimbing langsung oleh praktisi ekspor berpengalaman. Diskon 50% khusus member!',
      imageUrl: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      linkUrl: '/courses',
      linkText: 'Lihat Kursus',
      targetRoles: ['MEMBER_PREMIUM', 'ADMIN', 'MENTOR'],
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      backgroundColor: '#DC2626',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#DC2626',
      priority: 7,
      startDate: now,
      endDate: endDate,
      isActive: true,
      isSponsored: true,
      sponsorName: 'EksporYuk Academy',
      createdBy,
    },
  ]

  for (const banner of banners) {
    await prisma.banner.create({
      data: banner
    })
    console.log(`✅ Created: ${banner.title}`)
  }

  console.log('\n🎉 Successfully created', banners.length, 'sample banners!')
  console.log('📍 Placement: DASHBOARD')
  console.log('👥 Target: MEMBER_PREMIUM, ADMIN, MENTOR')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
