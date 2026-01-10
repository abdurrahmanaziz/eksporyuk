const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const templates = await prisma.brandedTemplate.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('\n=== BRANDED TEMPLATES DI DATABASE ===\n')
  
  if (templates.length === 0) {
    console.log('❌ Tidak ada template di database!')
  } else {
    templates.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name}`)
      console.log(`   Slug: ${t.slug}`)
      console.log(`   Type: ${t.type}`)
      console.log(`   Active: ${t.isActive ? '✅' : '❌'}`)
      console.log(`   Created: ${t.createdAt.toISOString().split('T')[0]}\n`)
    })
  }
  
  console.log(`Total: ${templates.length} branded templates\n`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
