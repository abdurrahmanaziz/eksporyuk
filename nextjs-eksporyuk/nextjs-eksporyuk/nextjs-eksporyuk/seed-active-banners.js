/**
 * Seed Active Banners for Premium Dashboard
 * Run with: node seed-active-banners.js
 * 
 * Creates banners that are active NOW for testing the dashboard
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Seeding active banners...\n')
  
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  // Delete old test banners
  await prisma.banner.deleteMany({
    where: {
      id: { startsWith: 'test-banner-' }
    }
  })
  console.log('✓ Cleaned old test banners')
  
  // Get admin user for createdBy
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (!admin) {
    console.error('❌ No admin user found!')
    return
  }
  
  const banners = [
    {
      id: 'test-banner-active-1',
      title: '🎯 Selamat Tahun Baru 2026!',
      description: 'Dapatkan diskon 50% untuk semua kursus ekspor premium. Promo spesial awal tahun hanya sampai 10 Januari!',
      linkUrl: '/learn',
      linkText: 'Lihat Promo',
      backgroundColor: '#2563EB',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#2563EB',
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      targetRoles: ['MEMBER_PREMIUM', 'MEMBER_FREE'],
      priority: 100,
      startDate: now,
      endDate: thirtyDaysLater,
      isActive: true,
      createdBy: admin.id,
      updatedAt: now
    },
    {
      id: 'test-banner-active-2',
      title: '🚀 Live Zoom Minggu Ini: Strategi Ekspor 2026',
      description: 'Bergabunglah bersama mentor berpengalaman. Sharing rahasia menembus pasar internasional.',
      linkUrl: '/events',
      linkText: 'Join Sekarang',
      backgroundColor: '#7C3AED',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#7C3AED',
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      targetRoles: ['MEMBER_PREMIUM'],
      priority: 99,
      startDate: now,
      endDate: sevenDaysLater,
      isActive: true,
      createdBy: admin.id,
      updatedAt: now
    },
    {
      id: 'test-banner-active-3',
      title: '📚 Kursus Baru: Mastering Export Documentation',
      description: 'Kuasai semua dokumen ekspor: Invoice, Packing List, COO, B/L dalam 4 minggu intensif.',
      linkUrl: '/learn',
      linkText: 'Mulai Belajar',
      backgroundColor: '#059669',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#059669',
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      targetRoles: ['MEMBER_PREMIUM', 'MEMBER_FREE'],
      priority: 98,
      startDate: now,
      endDate: thirtyDaysLater,
      isActive: true,
      createdBy: admin.id,
      updatedAt: now
    },
    {
      id: 'test-banner-active-4',
      title: '💼 Workshop: Cara Mendapatkan Buyer Internasional',
      description: 'Pelajari teknik prospecting dan closing deal dengan buyer dari Alibaba, Global Sources, dan marketplace lainnya.',
      linkUrl: '/events/workshop-buyer',
      linkText: 'Daftar Workshop',
      backgroundColor: '#DC2626',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#DC2626',
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      targetRoles: ['MEMBER_PREMIUM'],
      priority: 97,
      startDate: now,
      endDate: sevenDaysLater,
      isActive: true,
      createdBy: admin.id,
      updatedAt: now
    }
  ]
  
  for (const banner of banners) {
    try {
      await prisma.banner.upsert({
        where: { id: banner.id },
        update: banner,
        create: banner
      })
      console.log(`✓ Created: ${banner.title}`)
    } catch (error) {
      console.error(`✗ Error creating ${banner.title}:`, error.message)
    }
  }
  
  // Verify active banners
  const activeBanners = await prisma.banner.findMany({
    where: {
      isActive: true,
      placement: 'DASHBOARD',
      startDate: { lte: now },
      endDate: { gte: now }
    },
    orderBy: { priority: 'desc' }
  })
  
  console.log('\n📊 Active DASHBOARD banners:')
  console.log('─'.repeat(60))
  activeBanners.forEach((b, i) => {
    console.log(`${i+1}. [P:${b.priority}] ${b.title}`)
    console.log(`   Color: ${b.backgroundColor} | Link: ${b.linkUrl}`)
  })
  console.log('─'.repeat(60))
  console.log(`Total: ${activeBanners.length} banners\n`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
