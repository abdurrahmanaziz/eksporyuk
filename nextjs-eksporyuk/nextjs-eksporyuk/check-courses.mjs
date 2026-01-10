import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const courses = await prisma.course.findMany({
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
  
  console.log('📚 Affiliate Courses:')
  console.log(JSON.stringify(courses, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
