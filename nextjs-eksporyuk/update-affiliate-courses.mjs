import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking affiliate courses...\n')
  
  // Get all affiliate courses
  const affiliateCourses = await prisma.course.findMany({
    where: {
      affiliateOnly: true
    },
    select: {
      id: true,
      title: true,
      slug: true,
      affiliateOnly: true,
      isAffiliateTraining: true,
      isAffiliateMaterial: true
    }
  })
  
  console.log(`📚 Found ${affiliateCourses.length} affiliate courses:\n`)
  affiliateCourses.forEach((course, index) => {
    console.log(`${index + 1}. ${course.title}`)
    console.log(`   Slug: ${course.slug}`)
    console.log(`   isAffiliateTraining: ${course.isAffiliateTraining}`)
    console.log(`   isAffiliateMaterial: ${course.isAffiliateMaterial}`)
    console.log('')
  })
  
  // Update training-affiliate course to be training wajib
  const trainingAffiliate = affiliateCourses.find(c => c.slug === 'training-affiliate' || c.slug === 'traning-affiliate')
  
  if (trainingAffiliate) {
    console.log('✏️ Updating training-affiliate to be training wajib...')
    await prisma.course.update({
      where: { id: trainingAffiliate.id },
      data: {
        isAffiliateTraining: true,
        isAffiliateMaterial: false
      }
    })
    console.log('✅ Updated training-affiliate\n')
  }
  
  // Show final state
  console.log('\n📊 Final categorization:')
  const updated = await prisma.course.findMany({
    where: { affiliateOnly: true },
    select: {
      title: true,
      slug: true,
      isAffiliateTraining: true,
      isAffiliateMaterial: true
    }
  })
  
  const trainingWajib = updated.filter(c => c.isAffiliateTraining)
  const materiBelajar = updated.filter(c => c.isAffiliateMaterial)
  const lainnya = updated.filter(c => !c.isAffiliateTraining && !c.isAffiliateMaterial)
  
  console.log(`\n🎯 Training Wajib (${trainingWajib.length}):`)
  trainingWajib.forEach(c => console.log(`   - ${c.title} (${c.slug})`))
  
  console.log(`\n📖 Materi Belajar (${materiBelajar.length}):`)
  materiBelajar.forEach(c => console.log(`   - ${c.title} (${c.slug})`))
  
  console.log(`\n📦 Lainnya (${lainnya.length}):`)
  lainnya.forEach(c => console.log(`   - ${c.title} (${c.slug})`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
