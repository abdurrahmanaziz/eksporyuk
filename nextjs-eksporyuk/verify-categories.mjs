import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📊 Final Affiliate Training Status:\n')
  
  const allAffiliate = await prisma.course.findMany({
    where: {
      affiliateOnly: true,
      isPublished: true,
      status: 'PUBLISHED'
    },
    select: {
      title: true,
      slug: true,
      isAffiliateTraining: true,
      isAffiliateMaterial: true,
      modules: {
        select: {
          id: true
        }
      }
    },
    orderBy: [
      { isAffiliateTraining: 'desc' },
      { createdAt: 'asc' }
    ]
  })
  
  const training = allAffiliate.filter(c => c.isAffiliateTraining)
  const materials = allAffiliate.filter(c => c.isAffiliateMaterial)
  
  console.log(`🎯 Training Wajib (${training.length}):`)
  training.forEach(c => {
    console.log(`   ✓ ${c.title}`)
    console.log(`     Slug: ${c.slug}`)
    console.log(`     Modules: ${c.modules.length}`)
  })
  
  console.log(`\n📖 Materi Belajar (${materials.length}):`)
  materials.forEach(c => {
    console.log(`   ✓ ${c.title}`)
    console.log(`     Slug: ${c.slug}`)
    console.log(`     Modules: ${c.modules.length}`)
  })
  
  console.log('\n✅ Kategorisasi aktif! Refresh /affiliate/training untuk melihat perubahan')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
