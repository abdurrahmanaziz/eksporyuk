const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedMemberships() {
  console.log('🌱 Seeding memberships...')

  // Delete existing memberships
  await prisma.membership.deleteMany()

  // Create memberships based on the reference
  const memberships = [
    {
      name: 'Pro',
      slug: 'pro',
      checkoutSlug: 'pro',
      checkoutTemplate: 'modern',
      description: 'Checkout General - Pilih paket membership yang sesuai kebutuhan Anda',
      duration: 'ONE_MONTH',
      price: 200000,
      originalPrice: 300000,
      discount: 33,
      features: [], // EMPTY ARRAY = General checkout (show all memberships)
      isBestSeller: false,
      isPopular: true,
      isActive: true,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 30,
    },
    {
      name: 'Paket 1 Bulan',
      slug: 'paket-1bulan',
      checkoutSlug: 'beli-paket-1bulan',
      checkoutTemplate: 'modern',
      description: 'Akses semua fitur untuk 1 bulan',
      duration: 'ONE_MONTH',
      price: 150000,
      originalPrice: 250000,
      discount: 40,
      features: [
        'Akses Database (20 view/bulan)',
        'Template Dokumen Basic',
        'Akses Kursus Basic',
        'Grup WhatsApp',
        'Email Support'
      ],
      isBestSeller: false,
      isActive: true,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 25,
    },
    {
      name: 'Paket 3 Bulan',
      slug: 'paket-3bulan',
      checkoutSlug: 'beli-paket-3bulan',
      checkoutTemplate: 'modern',
      description: 'Paket paling populer dengan diskon besar',
      duration: 'THREE_MONTHS',
      price: 360000,
      originalPrice: 600000,
      discount: 40,
      features: [
        'Akses Database (50 view/bulan)',
        'Download CSV',
        'Template Dokumen Lengkap',
        'Akses Semua Kursus',
        'Konsultasi 1-on-1 (2x)',
        'Webinar Bulanan',
        'Priority Support'
      ],
      isBestSeller: false,
      isPopular: false,
      isMostPopular: true,
      isActive: true,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 28,
    },
    {
      name: 'Paket 6 Bulan',
      slug: 'paket-6bulan',
      checkoutSlug: 'beli-paket-6bulan',
      checkoutTemplate: 'modern',
      description: 'Hemat maksimal untuk 6 bulan',
      duration: 'SIX_MONTHS',
      price: 630000,
      originalPrice: 1000000,
      discount: 37,
      features: [
        'Akses Database (100 view/bulan)',
        'Download CSV',
        'API Access',
        'Template Premium',
        'Konsultasi 1-on-1 (5x)',
        'Webinar Bulanan',
        'Review Bisnis Gratis',
        'Certified Badge'
      ],
      isBestSeller: false,
      isActive: true,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 30,
    },
    {
      name: 'Paket 12 Bulan',
      slug: 'paket-12bulan',
      checkoutSlug: 'beli-paket-12bulan',
      checkoutTemplate: 'modern',
      description: 'Hemat 40% dengan paket tahunan',
      duration: 'TWELVE_MONTHS',
      price: 1080000,
      originalPrice: 1800000,
      discount: 40,
      features: [
        'Unlimited Database Access',
        'API Access Full',
        'Priority Support',
        'Konsultasi Unlimited',
        'Template Premium',
        'Webinar + Workshop',
        'Verified Badge',
        'Early Access Fitur Baru'
      ],
      isBestSeller: true,
      isActive: true,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 35,
    },
    {
      name: 'Paket Lifetime',
      slug: 'paket-lifetime',
      checkoutSlug: 'beli-paket-lifetime',
      checkoutTemplate: 'modern',
      description: 'Akses selamanya dengan benefit terlengkap',
      duration: 'LIFETIME',
      price: 2500000,
      originalPrice: 5000000,
      discount: 50,
      features: [
        'Lifetime Access',
        'Unlimited Database',
        'API Access Full',
        'Priority Support 24/7',
        'Konsultasi Unlimited',
        'Mentoring 1-on-1',
        'Update Konten Gratis Selamanya',
        'Verified Badge',
        'Early Access Fitur Baru'
      ],
      isBestSeller: true,
      isActive: true,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 40,
    },
  ]

  for (const membership of memberships) {
    const created = await prisma.membership.create({
      data: membership,
    })
    console.log(`✅ Created: ${created.name} - Rp ${created.price.toLocaleString('id-ID')}`)
  }

  console.log('\n✨ Memberships seeded successfully!')
  console.log('\n📝 Next steps:')
  console.log('1. Buka /admin/membership/settings')
  console.log('2. Edit setiap paket dan isi "URL Salespage Eksternal"')
  console.log('3. Contoh: https://kelaseksporyuk.com/landing-premium')
}

seedMemberships()
  .catch((e) => {
    console.error('❌ Error seeding memberships:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
