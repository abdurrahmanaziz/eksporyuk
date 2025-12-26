const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedMemberships() {
  console.log('🌱 Seeding memberships (dari PRD)...')

  // Delete existing memberships
  await prisma.membership.deleteMany()

  // Create memberships based on PRD (5093-5380)
  const memberships = [
    {
      name: 'Lifetime - Ekspor',
      slug: 'lifetime-ekspor',
      checkoutSlug: 'lifetime-ekspor',
      checkoutTemplate: 'modern',
      description: 'Lifetime membership dengan akses ke semua kelas ekspor dan website, serta 2 grup support',
      duration: 'LIFETIME',
      price: 5000000,
      originalPrice: 5000000,
      discount: 0,
      features: {
        classAccess: ['Kelas Ekspor', 'Kelas Website'],
        groupAccess: ['Grup Support Ekspor', 'Grup VIP'],
        unlimitedAccess: true,
      },
      isBestSeller: true,
      isPopular: true,
      isActive: true,
      commissionType: 'FLAT',
      affiliateCommissionRate: 300000,
    },
    {
      name: '12 Bulan - Ekspor',
      slug: '12bulan-ekspor',
      checkoutSlug: '12bulan-ekspor',
      checkoutTemplate: 'modern',
      description: 'Membership 12 bulan dengan akses ke kelas ekspor dan grup support',
      duration: '12_BULAN',
      price: 2000000,
      originalPrice: 2000000,
      discount: 0,
      features: {
        classAccess: ['Kelas Ekspor'],
        groupAccess: ['Grup Support Ekspor'],
        duration: '12 months',
      },
      isBestSeller: false,
      isPopular: true,
      isActive: true,
      commissionType: 'FLAT',
      affiliateCommissionRate: 300000,
    },
    {
      name: '6 Bulan - Ekspor',
      slug: '6bulan-ekspor',
      checkoutSlug: '6bulan-ekspor',
      checkoutTemplate: 'modern',
      description: 'Membership 6 bulan dengan akses ke kelas ekspor dan grup support',
      duration: '6_BULAN',
      price: 1200000,
      originalPrice: 1200000,
      discount: 0,
      features: {
        classAccess: ['Kelas Ekspor'],
        groupAccess: ['Grup Support Ekspor'],
        duration: '6 months',
      },
      isBestSeller: false,
      isPopular: false,
      isActive: true,
      commissionType: 'FLAT',
      affiliateCommissionRate: 250000,
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
