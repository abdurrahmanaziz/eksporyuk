import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing Auto-Enroll Affiliates...\n')

  // 1. Check training courses
  const trainingCourses = await prisma.course.findMany({
    where: {
      isAffiliateTraining: true,
      status: 'PUBLISHED',
      isPublished: true
    },
    select: {
      id: true,
      title: true,
      slug: true
    }
  })

  console.log(`📚 Training courses: ${trainingCourses.length}`)
  trainingCourses.forEach(c => console.log(`  - ${c.title} (${c.slug})`))

  // 2. Check affiliates
  const affiliates = await prisma.user.findMany({
    where: {
      role: 'AFFILIATE',
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  })

  console.log(`\n👥 Active affiliates: ${affiliates.length}`)

  // 3. Check current enrollments
  const currentEnrollments = await prisma.courseEnrollment.count({
    where: {
      courseId: { in: trainingCourses.map(c => c.id) },
      userId: { in: affiliates.map(a => a.id) }
    }
  })

  console.log(`\n📊 Current enrollments: ${currentEnrollments}`)

  // 4. Simulate auto-enroll (dry run)
  console.log('\n🔄 Simulating auto-enroll...')
  
  let wouldEnroll = 0
  let alreadyEnrolled = 0

  for (const affiliate of affiliates.slice(0, 5)) { // Test first 5
    for (const course of trainingCourses) {
      const existing = await prisma.courseEnrollment.findFirst({
        where: {
          userId: affiliate.id,
          courseId: course.id
        }
      })

      if (existing) {
        alreadyEnrolled++
      } else {
        wouldEnroll++
        console.log(`  ✅ Would enroll ${affiliate.name} to ${course.title}`)
      }
    }
  }

  console.log(`\n📈 Results (first 5 affiliates):`)
  console.log(`  - Would enroll: ${wouldEnroll}`)
  console.log(`  - Already enrolled: ${alreadyEnrolled}`)
  
  const totalPossible = affiliates.length * trainingCourses.length
  console.log(`\n🎯 Total possible enrollments for all ${affiliates.length} affiliates: ${totalPossible}`)

  await prisma.$disconnect()
}

main().catch(console.error)
