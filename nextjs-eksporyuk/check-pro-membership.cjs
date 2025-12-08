const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== CHECKING PRO MEMBERSHIP ===\n')
  
  const membership = await prisma.membership.findUnique({
    where: { slug: 'pro' },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      originalPrice: true,
      discount: true,
      duration: true,
      features: true,
      isActive: true,
      checkoutSlug: true
    }
  })
  
  if (!membership) {
    console.log('❌ Membership "pro" not found!')
    return
  }
  
  console.log('📦 Membership Data:')
  console.log(JSON.stringify(membership, null, 2))
  
  console.log('\n📊 Analysis:')
  console.log('- Name:', membership.name)
  console.log('- Slug:', membership.slug)
  console.log('- Price:', membership.price)
  console.log('- Features:', typeof membership.features, '=', JSON.stringify(membership.features))
  console.log('- Is Active:', membership.isActive)
  
  console.log('\n🔍 Issue:')
  if (membership.features === null) {
    console.log('❌ Features is NULL - this causes the fallback to single price!')
    console.log('   API will use database price field:', membership.price)
  }
  
  console.log('\n💡 Solution:')
  console.log('Set features to an empty array [] or proper pricing structure')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
