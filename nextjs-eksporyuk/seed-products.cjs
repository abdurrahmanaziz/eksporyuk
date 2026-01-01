const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedProducts() {
  try {
    console.log('🌱 Starting products seeding...')

    // Sample products for recommendation
    const productsData = [
      {
        id: 'prod-1',
        creatorId: 'admin_test_1766965516934', // Use existing admin ID
        name: 'Panduan Ekspor Lengkap 2026',
        slug: 'panduan-ekspor-lengkap-2026',
        description: 'Panduan step-by-step untuk memulai bisnis ekspor dari nol hingga sukses. Termasuk template dokumen dan kontak buyer internasional.',
        shortDescription: 'Panduan komprehensif untuk eksportir pemula dan profesional',
        price: 299000,
        originalPrice: 499000,
        thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
        category: 'business',
        productType: 'DIGITAL',
        productStatus: 'PUBLISHED',
        accessLevel: 'PUBLIC',
        isActive: true,
        isFeatured: true,
        affiliateCommissionRate: 30,
        affiliateEnabled: true,
        tags: ['ekspor', 'bisnis', 'panduan'],
        updatedAt: new Date()
      },
      {
        id: 'prod-2',
        creatorId: 'admin_test_1766965516934',
        name: 'Database Buyer Premium',
        slug: 'database-buyer-premium',
        description: 'Database kontak buyer international terlengkap dengan 10,000+ kontak verified dari 50+ negara. Update bulanan guaranteed.',
        shortDescription: 'Database buyer premium dengan kontak verified',
        price: 199000,
        originalPrice: 299000,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        category: 'database',
        productType: 'DIGITAL',
        productStatus: 'PUBLISHED',
        accessLevel: 'PREMIUM_ONLY',
        isActive: true,
        isFeatured: true,
        affiliateCommissionRate: 25,
        affiliateEnabled: true,
        tags: ['database', 'buyer', 'kontak'],
        updatedAt: new Date()
      },
      {
        id: 'prod-3',
        creatorId: 'admin_test_1766965516934',
        name: 'Template Kontrak Ekspor',
        slug: 'template-kontrak-ekspor',
        description: 'Kumpulan template kontrak ekspor-impor yang legal dan aman. Disusun oleh lawyer international trade berpengalaman.',
        shortDescription: 'Template kontrak yang sudah teruji dan legal',
        price: 149000,
        originalPrice: 249000,
        thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
        category: 'legal',
        productType: 'DIGITAL', 
        productStatus: 'PUBLISHED',
        accessLevel: 'PUBLIC',
        isActive: true,
        isFeatured: false,
        affiliateCommissionRate: 20,
        affiliateEnabled: true,
        tags: ['template', 'kontrak', 'legal'],
        updatedAt: new Date()
      }
    ]

    // Create products directly with fixed creatorId
    for (const product of productsData) {
      const existing = await prisma.product.findUnique({
        where: { id: product.id }
      })

      if (existing) {
        console.log(`⚠️ Product ${product.name} already exists, updating...`)
        await prisma.product.update({
          where: { id: product.id },
          data: {
            ...product,
            updatedAt: new Date()
          }
        })
      } else {
        console.log(`✅ Creating product: ${product.name}`)
        await prisma.product.create({
          data: product
        })
      }
    }

    // Verify created products
    const count = await prisma.product.count({
      where: { 
        isActive: true,
        productStatus: 'PUBLISHED' 
      }
    })

    console.log(`🎉 Products seeding completed! Active products: ${count}`)

  } catch (error) {
    console.error('❌ Error seeding products:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedProducts()