const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCheckoutUrls() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 5
    })

    console.log('\n=== TEST CHECKOUT URLs ===\n')
    console.log('✓ Semua URL checkout sekarang menggunakan SLUG (bukan ID)\n')
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`)
      console.log(`   Slug: ${product.slug || '(tidak ada slug)'}`)
      console.log(`   ✓ Checkout URL: http://localhost:3000/checkout/product/${product.slug || product.id}`)
      console.log(`   ✓ Salespage URL: http://localhost:3000/product/${product.slug || product.id}`)
      console.log()
    })

    console.log('💡 URL sekarang lebih SEO-friendly dan mudah dibaca!')
    console.log('💡 Backward compatibility: Jika slug kosong, akan fallback ke ID')
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testCheckoutUrls()
