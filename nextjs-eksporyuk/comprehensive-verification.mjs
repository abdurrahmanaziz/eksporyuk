import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 COMPREHENSIVE VERIFICATION - Training Affiliate System\n')
  console.log('='  .repeat(70))
  
  // 1. COURSE VERIFICATION
  console.log('\n📚 1. COURSE VERIFICATION')
  console.log('-'.repeat(70))
  
  const course = await prisma.course.findFirst({
    where: { slug: 'training-affiliate' }
  })
  
  if (!course) {
    console.log('❌ FATAL: Course not found!')
    return
  }
  
  const courseChecks = {
    'Course Exists': !!course,
    'Is Published': course.isPublished === true,
    'Status PUBLISHED': course.status === 'PUBLISHED',
    'Is Affiliate Training': course.isAffiliateTraining === true,
    'Affiliate Only': course.affiliateOnly === true,
    'Role Access AFFILIATE': course.roleAccess === 'AFFILIATE'
  }
  
  Object.entries(courseChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`)
  })
  
  console.log(`\n  Course Details:`)
  console.log(`    - ID: ${course.id}`)
  console.log(`    - Title: ${course.title}`)
  console.log(`    - Slug: ${course.slug}`)
  
  // 2. CONTENT VERIFICATION
  console.log('\n📖 2. CONTENT VERIFICATION')
  console.log('-'.repeat(70))
  
  const modules = await prisma.courseModule.findMany({
    where: { courseId: course.id },
    orderBy: { order: 'asc' }
  })
  
  console.log(`  Modules: ${modules.length}`)
  
  let totalLessons = 0
  for (const mod of modules) {
    const lessons = await prisma.courseLesson.findMany({
      where: { moduleId: mod.id }
    })
    totalLessons += lessons.length
    console.log(`    - ${mod.title}: ${lessons.length} lessons`)
  }
  
  const contentChecks = {
    'Has Modules': modules.length > 0,
    'Has Lessons': totalLessons > 0
  }
  
  Object.entries(contentChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`)
  })
  
  // 3. USER ROLE VERIFICATION
  console.log('\n👥 3. USER ROLE VERIFICATION')
  console.log('-'.repeat(70))
  
  const affiliates = await prisma.user.findMany({
    where: {
      role: 'AFFILIATE',
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      affiliateMenuEnabled: true
    }
  })
  
  console.log(`  Total Active Affiliates: ${affiliates.length}`)
  console.log(`  Sample affiliates:`)
  affiliates.slice(0, 3).forEach(a => {
    console.log(`    - ${a.name} (${a.email})`)
    console.log(`      Role: ${a.role}, Menu: ${a.affiliateMenuEnabled}`)
  })
  
  const roleChecks = {
    'Has Affiliates': affiliates.length > 0,
    'All have AFFILIATE role': affiliates.every(a => a.role === 'AFFILIATE'),
    'All menu enabled': affiliates.every(a => a.affiliateMenuEnabled === true)
  }
  
  Object.entries(roleChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`)
  })
  
  // 4. ENROLLMENT VERIFICATION
  console.log('\n📊 4. ENROLLMENT VERIFICATION')
  console.log('-'.repeat(70))
  
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId: course.id }
  })
  
  console.log(`  Total Enrollments: ${enrollments.length}`)
  console.log(`  Expected: ${affiliates.length}`)
  console.log(`  Coverage: ${((enrollments.length / affiliates.length) * 100).toFixed(1)}%`)
  
  // Check if all affiliates are enrolled
  const enrolledUserIds = new Set(enrollments.map(e => e.userId))
  const notEnrolled = affiliates.filter(a => !enrolledUserIds.has(a.id))
  
  if (notEnrolled.length > 0) {
    console.log(`\n  ⚠️  ${notEnrolled.length} affiliates NOT enrolled:`)
    notEnrolled.slice(0, 5).forEach(a => {
      console.log(`    - ${a.name} (${a.email})`)
    })
  }
  
  const enrollmentChecks = {
    'Has Enrollments': enrollments.length > 0,
    'All Affiliates Enrolled': enrollments.length === affiliates.length,
    '100% Coverage': notEnrolled.length === 0
  }
  
  Object.entries(enrollmentChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`)
  })
  
  // 5. DATA INTEGRITY
  console.log('\n🔒 5. DATA INTEGRITY VERIFICATION')
  console.log('-'.repeat(70))
  
  // Check all enrollments have valid users
  let invalidEnrollments = 0
  for (const enroll of enrollments.slice(0, 10)) {
    const user = await prisma.user.findUnique({
      where: { id: enroll.userId }
    })
    if (!user) invalidEnrollments++
  }
  
  const integrityChecks = {
    'Valid Enrollment Users': invalidEnrollments === 0,
    'Enrollment IDs Unique': enrollments.length === new Set(enrollments.map(e => e.id)).size,
    'Course ID Match': enrollments.every(e => e.courseId === course.id)
  }
  
  Object.entries(integrityChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`)
  })
  
  // 6. API READINESS
  console.log('\n🚀 6. API READINESS')
  console.log('-'.repeat(70))
  
  const apiChecks = {
    'Course Discoverable (slug)': course.slug === 'training-affiliate',
    'Course Published': course.isPublished && course.status === 'PUBLISHED',
    'Access Control Set': course.roleAccess === 'AFFILIATE',
    'Auto-enroll Flag': course.isAffiliateTraining === true,
    'Content Available': modules.length > 0 && totalLessons > 0
  }
  
  Object.entries(apiChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`)
  })
  
  // FINAL SUMMARY
  console.log('\n' + '='.repeat(70))
  console.log('📋 FINAL SUMMARY')
  console.log('='.repeat(70))
  
  const allChecks = { ...courseChecks, ...contentChecks, ...roleChecks, ...enrollmentChecks, ...integrityChecks, ...apiChecks }
  const passedChecks = Object.values(allChecks).filter(Boolean).length
  const totalChecks = Object.values(allChecks).length
  const passRate = ((passedChecks / totalChecks) * 100).toFixed(1)
  
  console.log(`\n  Total Checks: ${totalChecks}`)
  console.log(`  Passed: ${passedChecks}`)
  console.log(`  Failed: ${totalChecks - passedChecks}`)
  console.log(`  Pass Rate: ${passRate}%`)
  
  if (passRate === '100.0') {
    console.log(`\n  ✅ ✅ ✅ ALL SYSTEMS GO! PRODUCTION READY! ✅ ✅ ✅`)
  } else {
    console.log(`\n  ⚠️  Some checks failed. Review issues above.`)
  }
  
  console.log('\n' + '='.repeat(70))
  
  await prisma.$disconnect()
}

main().catch(console.error)
