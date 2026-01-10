import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking training courses in detail...\n')
  
  // Get all affiliate courses
  const courses = await prisma.course.findMany({
    where: {
      affiliateOnly: true,
      isPublished: true,
      status: 'PUBLISHED'
    },
    select: {
      id: true,
      title: true,
      slug: true,
      affiliateOnly: true,
      isAffiliateTraining: true,
      isAffiliateMaterial: true,
      isPublished: true,
      status: true,
      modules: {
        select: {
          id: true,
          title: true
        }
      }
    }
  })
  
  console.log(`📚 Found ${courses.length} published affiliate courses:\n`)
  
  courses.forEach((course, index) => {
    console.log(`${index + 1}. ${course.title}`)
    console.log(`   Slug: ${course.slug}`)
    console.log(`   affiliateOnly: ${course.affiliateOnly}`)
    console.log(`   isAffiliateTraining: ${course.isAffiliateTraining}`)
    console.log(`   isAffiliateMaterial: ${course.isAffiliateMaterial}`)
    console.log(`   isPublished: ${course.isPublished}`)
    console.log(`   status: ${course.status}`)
    console.log(`   modules: ${course.modules.length}`)
    console.log('')
  })
  
  const training = courses.filter(c => c.isAffiliateTraining)
  const materials = courses.filter(c => c.isAffiliateMaterial)
  
  console.log('\n📊 Summary:')
  console.log(`🎯 Training Wajib: ${training.length}`)
  training.forEach(c => console.log(`   - ${c.title} (${c.slug})`))
  
  console.log(`\n📖 Materi Belajar: ${materials.length}`)
  materials.forEach(c => console.log(`   - ${c.title} (${c.slug})`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
