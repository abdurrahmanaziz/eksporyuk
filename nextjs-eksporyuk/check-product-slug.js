const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: 'tools-kalkulasi-ekspor' },
        { slug: { contains: 'tools' } },
        { name: { contains: 'Tools' } },
        { name: { contains: 'tools' } },
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
    }
  })
  
  console.log('Product found:', product)
  
  if (!product) {
    console.log('\nNo product with slug "tools-kalkulasi-ekspor" found.')
    console.log('Checking all products...')
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 10,
    })
    console.log('Sample products:', allProducts)
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
