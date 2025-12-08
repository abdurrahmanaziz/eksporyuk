const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createProMembership() {
  try {
    // Check if Pro membership already exists
    const existing = await prisma.membership.findFirst({
      where: { slug: 'pro' }
    })

    if (existing) {
      console.log('✅ Paket Pro sudah ada:')
      console.log(JSON.stringify({
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        checkoutSlug: existing.checkoutSlug,
        isActive: existing.isActive
      }, null, 2))
      
      // Update to ensure it has correct settings
      const updated = await prisma.membership.update({
        where: { id: existing.id },
        data: {
          checkoutTemplate: 'all',
          description: 'Halaman checkout umum untuk memilih semua paket membership yang tersedia. User dapat membandingkan dan memilih paket yang sesuai dengan kebutuhan mereka.',
          formDescription: 'Pilih paket membership yang sesuai dengan kebutuhan Anda',
          price: 0,
          affiliateCommissionRate: 0,
          isActive: true
        }
      })
      
      console.log('\n✅ Paket Pro telah diperbarui dengan konfigurasi terbaru')
      
    } else {
      console.log('❌ Paket Pro belum ada, membuat paket baru...\n')
      
      const pro = await prisma.membership.create({
        data: {
          name: 'Pro - Checkout Umum',
          slug: 'pro',
          checkoutSlug: 'pro',
          checkoutTemplate: 'all',
          description: 'Halaman checkout umum untuk memilih semua paket membership yang tersedia. User dapat membandingkan dan memilih paket yang sesuai dengan kebutuhan mereka.',
          duration: 'ONE_MONTH',
          price: 0,
          originalPrice: 0,
          discount: 0,
          features: [],
          isBestSeller: false,
          isPopular: false,
          isMostPopular: false,
          isActive: true,
          affiliateCommissionRate: 0,
          commissionType: 'PERCENTAGE',
          formDescription: 'Pilih paket membership yang sesuai dengan kebutuhan Anda'
        }
      })
      
      console.log('✅ Paket Pro berhasil dibuat:')
      console.log(JSON.stringify({
        id: pro.id,
        name: pro.name,
        slug: pro.slug,
        checkoutSlug: pro.checkoutSlug,
        checkoutTemplate: pro.checkoutTemplate
      }, null, 2))
    }
    
    console.log('\n📋 Info:')
    console.log('- URL Checkout: http://localhost:3000/checkout/pro')
    console.log('- Paket ini akan menampilkan semua membership yang aktif')
    console.log('- User dapat membandingkan fitur dan memilih paket yang sesuai')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createProMembership()
