import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const courses = await prisma.course.findMany({
    where: {},
    select: {
      title: true,
      slug: true,
      affiliateOnly: true,
      isAffiliateTraining: true,
      isAffiliateMaterial: true
    }
  })
  
  console.log('All courses:')
  courses.forEach(c => {
    console.log(`- ${c.title} (${c.slug})`)
    console.log(`  affiliateOnly: ${c.affiliateOnly}, training: ${c.isAffiliateTraining}, material: ${c.isAffiliateMaterial}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
