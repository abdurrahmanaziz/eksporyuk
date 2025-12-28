import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking /learn/training-affiliate status...\n')

  // 1. Check course exists and published
  const course = await prisma.course.findFirst({
    where: { slug: 'training-affiliate' }
  })

  if (!course) {
    console.log('❌ Course NOT FOUND!')
    return
  }

  console.log('📚 Course Found:')
  console.log(`  - ID: ${course.id}`)
  console.log(`  - Title: ${course.title}`)
  console.log(`  - Status: ${course.status}`)
  console.log(`  - Published: ${course.isPublished}`)
  console.log(`  - Affiliate Training: ${course.isAffiliateTraining}`)
  console.log(`  - Affiliate Only: ${course.affiliateOnly}`)
  console.log(`  - Role Access: ${course.roleAccess}`)
  
  // Get modules separately
  const modules = await prisma.courseModule.findMany({
    where: { courseId: course.id },
    orderBy: { order: 'asc' }
  })
  
  console.log(`  - Modules: ${modules.length}`)
  
  if (modules.length > 0) {
    console.log(`\n📖 Module Details:`)
    for (const mod of modules) {
      const lessons = await prisma.courseLesson.findMany({
        where: { moduleId: mod.id },
        orderBy: { order: 'asc' }
      })
      console.log(`  ${mod.order}. ${mod.title}`)
      console.log(`     - Lessons: ${lessons.length}`)
      if (lessons.length > 0) {
        lessons.forEach((lesson, idx) => {
          console.log(`       ${idx + 1}. ${lesson.title} ${lesson.isFree ? '(FREE)' : ''}`)
        })
      }
    }
  }

  // 2. Check affiliates
  const affiliates = await prisma.user.count({
    where: {
      role: 'AFFILIATE',
      isActive: true
    }
  })
  console.log(`\n👥 Active Affiliates: ${affiliates}`)

  // 3. Check enrollments
  const enrollments = await prisma.courseEnrollment.count({
    where: { courseId: course.id }
  })
  console.log(`📊 Total Enrollments: ${enrollments}`)

  // 4. Sample enrollment check
  const sampleEnroll = await prisma.courseEnrollment.findFirst({
    where: { courseId: course.id }
  })

  if (sampleEnroll) {
    const user = await prisma.user.findUnique({
      where: { id: sampleEnroll.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    console.log(`\n✅ Sample Enrollment:`)
    console.log(`  - User: ${user?.name} (${user?.role})`)
    console.log(`  - Progress: ${sampleEnroll.progress}%`)
    console.log(`  - Completed: ${sampleEnroll.completed}`)
  }

  // 5. Check for issues
  console.log(`\n🔍 System Check:`)
  const issues = []

  if (!course.isPublished) issues.push('❌ Course not published')
  if (course.status !== 'PUBLISHED') issues.push('❌ Course status not PUBLISHED')
  if (!course.isAffiliateTraining) issues.push('⚠️  isAffiliateTraining is false')
  if (modules.length === 0) issues.push('⚠️  No modules found')
  if (enrollments !== affiliates) issues.push(`⚠️  Enrollment mismatch: ${enrollments}/${affiliates}`)

  if (issues.length === 0) {
    console.log('✅ All checks passed!')
  } else {
    console.log('Issues found:')
    issues.forEach(issue => console.log(`  ${issue}`))
  }

  await prisma.$disconnect()
}

main().catch(console.error)
