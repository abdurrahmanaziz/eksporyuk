const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedProducts() {
  try {
    console.log('🌱 Starting products seeding...')

    // Sample products for recommendation
    const productsData = [
      {
        id: 'prod-1',
        name: 'Panduan Ekspor Lengkap 2026',
        slug: 'panduan-ekspor-lengkap-2026',
        description: 'Panduan step-by-step untuk memulai bisnis ekspor dari nol hingga sukses. Termasuk template dokumen dan kontak buyer internasional.',
        content: '<p>Panduan komprehensif untuk eksportir pemula dan profesional...</p>',
        price: 299000,
        originalPrice: 499000,
        thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
        productType: 'DIGITAL',
        productStatus: 'PUBLISHED',
        isActive: true,
        categoryId: null,
        authorId: null, // Will be set to admin
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prod-2', 
        name: 'Database Buyer Premium',
        slug: 'database-buyer-premium',
        description: 'Database kontak buyer international terlengkap dengan 10,000+ kontak verified dari 50+ negara. Update bulanan guaranteed.',
        content: '<p>Database buyer premium dengan kontak yang sudah diverifikasi...</p>',
        price: 199000,
        originalPrice: 299000,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        productType: 'DIGITAL',
        productStatus: 'PUBLISHED',
        isActive: true,
        categoryId: null,
        authorId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prod-3',
        name: 'Template Kontrak Ekspor',
        slug: 'template-kontrak-ekspor',
        description: 'Kumpulan template kontrak ekspor-impor yang legal dan aman. Disusun oleh lawyer international trade berpengalaman.',
        content: '<p>Template kontrak yang sudah teruji dan legal...</p>',
        price: 149000,
        originalPrice: 249000,
        thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
        productType: 'DIGITAL', 
        productStatus: 'PUBLISHED',
        isActive: true,
        categoryId: null,
        authorId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Get admin user for authorId
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('❌ No admin user found, creating products without author')
    }

    // Create products
    for (const product of productsData) {
      if (adminUser) {
        product.authorId = adminUser.id
      }

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