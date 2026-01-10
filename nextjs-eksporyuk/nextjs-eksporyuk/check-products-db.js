const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkProducts() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        productType: true,
      },
    })

    console.log('\n📦 PRODUCTS IN DATABASE:\n')

    if (products.length === 0) {
      console.log('❌ No products found! Need to run seed-products.js\n')
    } else {
      products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`)
        console.log(`   Slug: ${p.slug}`)
        console.log(`   Active: ${p.isActive}`)
        console.log(`   Type: ${p.productType}`)
        console.log('')
      })
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkProducts()
