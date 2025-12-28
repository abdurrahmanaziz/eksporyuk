import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 EXECUTING AUTO-ENROLL FOR ALL AFFILIATES...\n')

  // 1. Get training courses
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

  console.log(`📚 Found ${trainingCourses.length} training courses`)

  // 2. Get all active affiliates
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

  console.log(`👥 Found ${affiliates.length} active affiliates`)

  // 3. Auto-enroll all affiliates
  let enrolledCount = 0
  let skippedCount = 0

  for (const affiliate of affiliates) {
    for (const course of trainingCourses) {
      // Check if already enrolled
      const existing = await prisma.courseEnrollment.findFirst({
        where: {
          userId: affiliate.id,
          courseId: course.id
        }
      })

      if (existing) {
        skippedCount++
      } else {
        // Create enrollment
        await prisma.courseEnrollment.create({
          data: {
            id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId: affiliate.id,
            courseId: course.id,
            progress: 0,
            completed: false,
            updatedAt: new Date()
          }
        })
        enrolledCount++
        
        if (enrolledCount % 10 === 0) {
          console.log(`  ✅ Enrolled ${enrolledCount} affiliates...`)
        }
      }
    }
  }

  console.log(`\n📊 RESULTS:`)
  console.log(`  ✅ New enrollments: ${enrolledCount}`)
  console.log(`  ⏭️  Already enrolled: ${skippedCount}`)
  console.log(`  📈 Total processed: ${enrolledCount + skippedCount}`)

  // 4. Verify final count
  const finalCount = await prisma.courseEnrollment.count({
    where: {
      courseId: { in: trainingCourses.map(c => c.id) }
    }
  })

  console.log(`\n🎯 Total enrollments in training courses: ${finalCount}`)

  await prisma.$disconnect()
}

main().catch(console.error)
