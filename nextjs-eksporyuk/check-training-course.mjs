import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const course = await prisma.course.findFirst({
    where: {
      slug: { in: ['traning-affiliate', 'training-affiliate'] }
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
  
  if (course) {
    console.log('✅ Found training course:')
    console.log(JSON.stringify(course, null, 2))
  } else {
    console.log('❌ Training course not found')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
