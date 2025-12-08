const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function restorePaketPro() {
  try {
    // Check if "Paket Pro" with slug "pro" exists
    let paketPro = await prisma.membership.findFirst({
      where: { slug: 'pro' }
    })

    if (paketPro) {
      console.log('✓ Paket Pro sudah ada dengan ID:', paketPro.id)
      console.log('  Name:', paketPro.name)
      console.log('  Slug:', paketPro.slug)
      console.log('  Checkout Slug:', paketPro.checkoutSlug)
      console.log('  isActive:', paketPro.isActive)
      
      // Update to ensure it has correct settings
      await prisma.membership.update({
        where: { id: paketPro.id },
        data: {
          name: 'Paket Pro',
          slug: 'pro',
          checkoutSlug: 'pro',
          checkoutTemplate: 'checkout-umum',
          duration: 'ONE_MONTH', // Dummy duration
          price: 0, // Ini bukan paket sebenarnya, hanya redirect
          features: [], // Empty features untuk checkout umum
          isActive: true,
          description: 'Checkout Umum - Kumpulan Semua Paket'
        }
      })
      console.log('\n✓ Paket Pro telah diperbarui!')
    } else {
      // Create new "Paket Pro"
      paketPro = await prisma.membership.create({
        data: {
          name: 'Paket Pro',
          slug: 'pro',
          checkoutSlug: 'pro',
          checkoutTemplate: 'checkout-umum',
          duration: 'ONE_MONTH', // Dummy duration
          price: 0,
          features: [], // Empty features untuk checkout umum
          isActive: true,
          isBestSeller: false,
          isMostPopular: false,
          description: 'Checkout Umum - Kumpulan Semua Paket'
        }
      })
      console.log('\n✓ Paket Pro berhasil dibuat!')
      console.log('  ID:', paketPro.id)
      console.log('  Name:', paketPro.name)
      console.log('  Slug:', paketPro.slug)
    }

    console.log('\n✓ Selesai! Paket Pro sekarang tersedia di /checkout/pro')
    console.log('✓ Paket ini TIDAK akan tampil di halaman checkout biasa')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

restorePaketPro()
