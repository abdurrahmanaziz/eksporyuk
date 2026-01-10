import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking ADMIN user and course access...\n')
  
  // Get ADMIN user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, role: true }
  })
  
  if (!admin) {
    console.log('❌ No ADMIN user found!')
    return
  }
  
  console.log('✅ ADMIN found:', admin.email)
  
  // Get training-affiliate course
  const course = await prisma.course.findUnique({
    where: { slug: 'training-affiliate' },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      affiliateOnly: true,
      isAffiliateTraining: true
    }
  })
  
  if (!course) {
    console.log('❌ Training course not found!')
    return
  }
  
  console.log('\n📚 Course details:')
  console.log(JSON.stringify(course, null, 2))
  
  // Check if ADMIN already enrolled
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userId: admin.id,
      courseId: course.id
    }
  })
  
  if (enrollment) {
    console.log('\n✅ ADMIN already enrolled!')
    console.log('Progress:', enrollment.progress + '%')
  } else {
    console.log('\n❌ ADMIN not enrolled yet')
    console.log('💡 Will auto-enroll when ADMIN accesses /learn/training-affiliate')
  }
  
  // Check total AFFILIATE users
  const affiliateCount = await prisma.user.count({
    where: { role: 'AFFILIATE' }
  })
  
  console.log('\n📊 AFFILIATE users count:', affiliateCount)
  if (affiliateCount === 0) {
    console.log('⚠️  No AFFILIATE users exist - auto-enroll API will have nothing to enroll')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
