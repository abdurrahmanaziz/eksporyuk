import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing training affiliate course...\n')
  
  const updated = await prisma.course.update({
    where: {
      slug: 'traning-affiliate'
    },
    data: {
      isPublished: true,
      status: 'PUBLISHED',
      publishedAt: new Date()
    }
  })
  
  console.log('✅ Updated course:')
  console.log(`   Title: ${updated.title}`)
  console.log(`   Slug: ${updated.slug}`)
  console.log(`   isPublished: ${updated.isPublished}`)
  console.log(`   status: ${updated.status}`)
  console.log(`   affiliateOnly: ${updated.affiliateOnly}`)
  console.log(`   isAffiliateTraining: ${updated.isAffiliateTraining}`)
  console.log('\n✨ Training course sekarang aktif!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
