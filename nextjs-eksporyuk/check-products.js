const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkProducts() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        salesPageUrl: true,
        externalSalesUrl: true,
        price: true,
        isActive: true
      },
      take: 10
    })

    console.log('\n=== PRODUK DI DATABASE ===\n')
    
    if (products.length === 0) {
      console.log('Tidak ada produk di database')
    } else {
      products.forEach((p, i) => {
        console.log(`${i+1}. ${p.name}`)
        console.log(`   ID: ${p.id}`)
        console.log(`   Slug: ${p.slug || '(kosong)'}`)
        console.log(`   Sales Page URL: ${p.salesPageUrl || '(kosong)'}`)
        console.log(`   External URL: ${p.externalSalesUrl || '(kosong)'}`)
        console.log(`   Price: Rp ${parseInt(p.price).toLocaleString('id-ID')}`)
        console.log(`   Status: ${p.isActive ? 'Aktif' : 'Nonaktif'}`)
        console.log()
      })
    }

    console.log('Total produk:', products.length)
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkProducts()
