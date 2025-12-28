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
      roleAccess: true,
    }
  })
  
  if (course) {
    console.log('✅ Found training course:')
    console.log(JSON.stringify(course, null, 2))
    
    // Check modules count
    const modulesCount = await prisma.courseModule.count({
      where: { courseId: course.id }
    })
    console.log(`\n📚 Modules count: ${modulesCount}`)
    
    // Check who can access
    const affiliates = await prisma.user.count({
      where: { role: 'AFFILIATE' }
    })
    console.log(`\n👥 Total affiliates: ${affiliates}`)
    
    // Check enrollments
    const enrollments = await prisma.courseEnrollment.count({
      where: { courseId: course.id }
    })
    console.log(`📝 Total enrollments: ${enrollments}`)
    
  } else {
    console.log('❌ Training course not found')
  }
}


main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
