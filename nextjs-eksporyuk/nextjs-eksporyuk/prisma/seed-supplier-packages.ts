import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding supplier packages...')

  // Check if packages already exist
  const existingPackages = await prisma.supplierPackage.count()
  
  if (existingPackages > 0) {
    console.log('✅ Supplier packages already exist. Skipping seed.')
    return
  }

  // Create FREE package
  const freePackage = await prisma.supplierPackage.create({
    data: {
      name: 'Supplier Free',
      slug: 'supplier-free',
      type: 'FREE',
      duration: 'LIFETIME',
      price: 0,
      originalPrice: 0,
      features: {
        maxProducts: 1,
        chatEnabled: false,
        verifiedBadge: false,
        customURL: false,
        statistics: false,
        ranking: false,
        priority: false,
        catalogDownload: false,
        multiLanguage: false,
      },
      description: 'Paket gratis untuk memulai sebagai supplier dengan akses terbatas.',
      isActive: true,
      displayOrder: 1,
    },
  })

  console.log('✅ Created FREE package:', freePackage.name)

  // Create PREMIUM Monthly package
  const premiumMonthly = await prisma.supplierPackage.create({
    data: {
      name: 'Supplier Premium Monthly',
      slug: 'supplier-premium-monthly',
      type: 'PREMIUM',
      duration: 'MONTHLY',
      price: 299000,
      originalPrice: 399000,
      features: {
        maxProducts: -1, // unlimited
        chatEnabled: true,
        verifiedBadge: true,
        customURL: true,
        statistics: true,
        ranking: true,
        priority: true,
        catalogDownload: true,
        multiLanguage: true,
        autoReply: true,
        linkToGroups: true,
      },
      description: 'Paket premium bulanan dengan semua fitur lengkap untuk mengembangkan bisnis Anda.',
      isActive: true,
      displayOrder: 2,
    },
  })

  console.log('✅ Created PREMIUM Monthly package:', premiumMonthly.name)

  // Create PREMIUM Yearly package
  const premiumYearly = await prisma.supplierPackage.create({
    data: {
      name: 'Supplier Premium Yearly',
      slug: 'supplier-premium-yearly',
      type: 'PREMIUM',
      duration: 'YEARLY',
      price: 2999000,
      originalPrice: 3588000, // Save 2 months
      features: {
        maxProducts: -1, // unlimited
        chatEnabled: true,
        verifiedBadge: true,
        customURL: true,
        statistics: true,
        ranking: true,
        priority: true,
        catalogDownload: true,
        multiLanguage: true,
        autoReply: true,
        linkToGroups: true,
        dedicatedSupport: true,
      },
      description: 'Paket premium tahunan dengan hemat 2 bulan dan dukungan prioritas.',
      isActive: true,
      displayOrder: 3,
    },
  })

  console.log('✅ Created PREMIUM Yearly package:', premiumYearly.name)

  console.log('\n🎉 Supplier packages seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding supplier packages:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
