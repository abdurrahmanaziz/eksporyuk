import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing Affiliate Course Access\n')

  // 1. Get training course
  const course = await prisma.course.findFirst({
    where: { slug: 'training-affiliate' }
  })

  if (!course) {
    console.log('❌ Course not found!')
    return
  }

  console.log(`📚 Course: ${course.title}`)
  console.log(`   ID: ${course.id}`)
  console.log(`   Status: ${course.status}`)
  console.log(`   Published: ${course.isPublished}`)

  // 2. Get sample affiliate
  const affiliate = await prisma.user.findFirst({
    where: {
      role: 'AFFILIATE',
      isActive: true
    }
  })

  if (!affiliate) {
    console.log('❌ No affiliate found!')
    return
  }

  console.log(`\n👤 Test Affiliate: ${affiliate.name}`)
  console.log(`   Email: ${affiliate.email}`)
  console.log(`   Role: ${affiliate.role}`)

  // 3. Check enrollment
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userId: affiliate.id,
      courseId: course.id
    }
  })

  console.log(`\n📊 Enrollment Status:`)
  if (enrollment) {
    console.log(`   ✅ Enrolled`)
    console.log(`   Progress: ${enrollment.progress}%`)
    console.log(`   Completed: ${enrollment.completed}`)
    console.log(`   Created: ${enrollment.createdAt}`)
  } else {
    console.log(`   ❌ NOT Enrolled`)
  }

  // 4. Get modules and lessons
  const modules = await prisma.courseModule.findMany({
    where: { courseId: course.id },
    orderBy: { order: 'asc' }
  })

  console.log(`\n📖 Course Content:`)
  console.log(`   Modules: ${modules.length}`)

  for (const mod of modules) {
    const lessons = await prisma.courseLesson.findMany({
      where: { moduleId: mod.id },
      orderBy: { order: 'asc' }
    })
    
    console.log(`\n   ${mod.order}. ${mod.title}`)
    console.log(`      Lessons: ${lessons.length}`)
    
    for (const lesson of lessons) {
      console.log(`        - ${lesson.title}`)
      console.log(`          Video: ${lesson.videoUrl ? '✅' : '❌'}`)
      console.log(`          Free: ${lesson.isFree ? '✅' : '❌'}`)
    }
  }

  // 5. Simulate API response
  console.log(`\n🚀 Expected API Response:`)
  console.log(`   - Course found: ✅`)
  console.log(`   - User is AFFILIATE: ✅`)
  console.log(`   - Has access: ${enrollment ? '✅' : '⚠️ Will auto-enroll'}`)
  console.log(`   - Content available: ${modules.length > 0 ? '✅' : '❌'}`)

  // 6. Test access control
  console.log(`\n🔐 Access Control Check:`)
  const checks = {
    'Course is PUBLISHED': course.status === 'PUBLISHED' && course.isPublished,
    'Course is Affiliate Training': course.isAffiliateTraining,
    'User has AFFILIATE role': affiliate.role === 'AFFILIATE',
    'User is active': affiliate.isActive,
    'Enrollment exists OR will auto-create': !!enrollment || course.isAffiliateTraining
  }

  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`)
  })

  const allPassed = Object.values(checks).every(Boolean)
  
  console.log(`\n${allPassed ? '✅ ✅ ✅' : '⚠️ ⚠️ ⚠️'} ${allPassed ? 'AFFILIATE CAN ACCESS!' : 'ACCESS DENIED'}`)

  await prisma.$disconnect()
}

main().catch(console.error)
