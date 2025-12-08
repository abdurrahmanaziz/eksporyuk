import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleProducts() {
  console.log('🚀 Creating sample products for affiliate testing...\n')

  try {
    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!admin) {
      console.error('❌ Admin user not found. Please create an admin user first.')
      return
    }

    console.log(`👤 Using admin: ${admin.email}\n`)

    // 1. MEMBERSHIP PLAN
    console.log('📦 Creating Membership Plan...')
    const membership = await prisma.membership.upsert({
      where: { slug: 'membership-silver' },
      update: {},
      create: {
        name: 'Membership Silver',
        slug: 'membership-silver',
        description: 'Akses ke semua course dan grup eksklusif selama 3 bulan',
        duration: 'THREE_MONTHS',
        price: 500000,
        originalPrice: 750000,
        discount: 33,
        affiliateCommissionRate: 30,
        isPopular: true,
        isBestSeller: false,
        isActive: true,
        salesPageUrl: '/membership/silver',
        features: [
          'Akses semua course',
          'Grup WhatsApp eksklusif',
          'Live session bulanan',
          'Sertifikat digital',
          'Lifetime support'
        ]
      }
    })
    console.log('✅ Membership created:', membership.name)

    // 2. DIGITAL PRODUCT
    console.log('\n📚 Creating Digital Product...')
    const product = await prisma.product.upsert({
      where: { slug: 'ebook-ekspor-pemula' },
      update: {},
      create: {
        name: 'Ebook Panduan Ekspor untuk Pemula',
        slug: 'ebook-ekspor-pemula',
        description: 'Panduan lengkap memulai bisnis ekspor dari nol hingga closing. Berisi 150+ halaman materi komprehensif dengan template dokumen ekspor.',
        productType: 'DIGITAL',
        productStatus: 'PUBLISHED',
        price: 150000,
        originalPrice: 250000,
        stock: 999,
        isActive: true,
        salesPageUrl: '/product/ebook-ekspor-pemula',
        thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800',
        affiliateCommissionRate: 25,
        creatorId: admin.id
      }
    })
    console.log('✅ Digital Product created:', product.name)

    // 3. EBOOK PRODUCT
    console.log('\n📦 Creating Ebook Product...')
    const ebookProduct = await prisma.product.upsert({
      where: { slug: 'paket-sampel-produk-ekspor' },
      update: {},
      create: {
        name: 'Katalog Produk Ekspor Indonesia',
        slug: 'paket-sampel-produk-ekspor',
        description: 'Katalog lengkap produk lokal berkualitas ekspor untuk presentasi ke buyer internasional. Termasuk spesifikasi, harga, dan contact supplier.',
        productType: 'EBOOK',
        productStatus: 'PUBLISHED',
        price: 350000,
        originalPrice: 500000,
        stock: 999,
        isActive: true,
        salesPageUrl: '/product/paket-sampel-produk-ekspor',
        thumbnail: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800',
        affiliateCommissionRate: 20,
        creatorId: admin.id
      }
    })
    console.log('✅ Ebook Product created:', ebookProduct.name)

    // 4. EVENT PRODUCT (Konsultasi)
    console.log('\n🛠️ Creating Event Product...')
    const eventProduct = await prisma.product.upsert({
      where: { slug: 'konsultasi-ekspor-private' },
      update: {},
      create: {
        name: 'Webinar: Strategi Ekspor 2024',
        slug: 'konsultasi-ekspor-private',
        description: 'Webinar eksklusif membahas strategi ekspor terkini bersama expert berpengalaman 10+ tahun. Termasuk sesi Q&A dan bonus template dokumen.',
        productType: 'EVENT',
        productStatus: 'PUBLISHED',
        price: 500000,
        originalPrice: 750000,
        stock: 50,
        isActive: true,
        salesPageUrl: '/product/konsultasi-ekspor-private',
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
        affiliateCommissionRate: 35,
        creatorId: admin.id,
        eventDate: new Date('2024-12-20T19:00:00'),
        eventDuration: 120
      }
    })
    console.log('✅ Event Product created:', eventProduct.name)

    // Create more products with different types
    console.log('\n📱 Creating Template Product...')
    const templateProduct = await prisma.product.upsert({
      where: { slug: 'template-proposal-ekspor' },
      update: {},
      create: {
        name: 'Template Proposal Ekspor Profesional',
        slug: 'template-proposal-ekspor',
        description: 'Kumpulan template proposal ekspor siap pakai dalam format editable. Hemat waktu dan tingkatkan profesionalitas penawaran Anda.',
        productType: 'TEMPLATE',
        productStatus: 'PUBLISHED',
        price: 250000,
        originalPrice: 400000,
        stock: 999,
        isActive: true,
        salesPageUrl: '/product/template-proposal-ekspor',
        thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800',
        affiliateCommissionRate: 30,
        creatorId: admin.id
      }
    })
    console.log('✅ Template Product created:', templateProduct.name)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✨ SAMPLE PRODUCTS CREATED SUCCESSFULLY!\n')
    console.log('📊 Summary:')
    console.log(`   • 1 Membership Plan: ${membership.name}`)
    console.log(`   • 1 Digital Product: ${product.name}`)
    console.log(`   • 1 Ebook Product: ${ebookProduct.name}`)
    console.log(`   • 1 Event Product: ${eventProduct.name}`)
    console.log(`   • 1 Template Product: ${templateProduct.name}`)
    console.log('\n💰 Affiliate Commission Rates:')
    console.log(`   • Membership: ${membership.affiliateCommissionRate}%`)
    console.log(`   • Digital Product: ${product.affiliateCommissionRate}%`)
    console.log(`   • Ebook Product: ${ebookProduct.affiliateCommissionRate}%`)
    console.log(`   • Event Product: ${eventProduct.affiliateCommissionRate}%`)
    console.log(`   • Template Product: ${templateProduct.affiliateCommissionRate}%`)
    console.log('\n🔗 All products are ready for affiliate promotion!')
    console.log('💡 Affiliates can now create links for these products')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Error creating sample products:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createSampleProducts()
