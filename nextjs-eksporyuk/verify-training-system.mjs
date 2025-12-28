import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 FINAL VERIFICATION - Training Affiliate System\n')

  // 1. Check training course
  const course = await prisma.course.findFirst({
    where: {
      slug: 'training-affiliate'
    },
    select: {
      id: true,
      title: true,
      slug: true,
      isAffiliateTraining: true,
      affiliateOnly: true,
      isPublished: true,
      status: true,
      roleAccess: true
    }
  })

  console.log('📚 Training Course:')
  console.log(course)

  // 2. Check affiliates
  const affiliateCount = await prisma.user.count({
    where: {
      role: 'AFFILIATE',
      isActive: true
    }
  })

  console.log(`\n👥 Active AFFILIATE users: ${affiliateCount}`)

  // 3. Check enrollments
  const enrollmentCount = await prisma.courseEnrollment.count({
    where: {
      courseId: course.id
    }
  })

  console.log(`\n📊 Total enrollments: ${enrollmentCount}`)

  // 4. Sample enrollments
  const sampleEnrollments = await prisma.courseEnrollment.findMany({
    where: {
      courseId: course.id
    },
    take: 5,
    select: {
      id: true,
      userId: true,
      progress: true,
      completed: true,
      createdAt: true
    }
  })

  console.log(`\n📋 Sample enrollments:`)
  for (const enroll of sampleEnrollments) {
    const user = await prisma.user.findUnique({
      where: { id: enroll.userId },
      select: { name: true, email: true, role: true }
    })
    console.log(`  - ${user.name} (${user.role}) - Progress: ${enroll.progress}%`)
  }

  // 5. Check if all affiliates are enrolled
  const notEnrolledAffiliates = await prisma.user.findMany({
    where: {
      role: 'AFFILIATE',
      isActive: true,
      id: {
        notIn: await prisma.courseEnrollment.findMany({
          where: { courseId: course.id },
          select: { userId: true }
        }).then(enrolls => enrolls.map(e => e.userId))
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  })

  console.log(`\n⚠️  Affiliates NOT enrolled: ${notEnrolledAffiliates.length}`)
  if (notEnrolledAffiliates.length > 0) {
    notEnrolledAffiliates.slice(0, 5).forEach(a => {
      console.log(`  - ${a.name} (${a.email})`)
    })
  }

  // 6. Summary
  console.log(`\n📈 SUMMARY:`)
  console.log(`  ✅ Training course exists: ${!!course}`)
  console.log(`  ✅ Course is published: ${course.isPublished}`)
  console.log(`  ✅ Course is affiliate training: ${course.isAffiliateTraining}`)
  console.log(`  ✅ Total affiliates: ${affiliateCount}`)
  console.log(`  ✅ Total enrollments: ${enrollmentCount}`)
  console.log(`  ${enrollmentCount === affiliateCount ? '✅' : '❌'} All affiliates enrolled: ${enrollmentCount === affiliateCount}`)

  await prisma.$disconnect()
}

main().catch(console.error)
