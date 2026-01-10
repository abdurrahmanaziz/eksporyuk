import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking users and their roles...\n')
  
  // Count users by role (only valid roles from schema)
  const roles = ['ADMIN', 'MENTOR', 'AFFILIATE', 'MEMBER_PREMIUM', 'MEMBER_FREE']
  
  for (const role of roles) {
    const count = await prisma.user.count({ where: { role } })
    console.log(`${role}: ${count}`)
  }
  
  console.log('\n📋 Recent users (last 10):')
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  users.forEach(u => {
    console.log(`- ${u.email} | Role: ${u.role} | Created: ${u.createdAt.toLocaleDateString()}`)
  })
  
  // Check if there's enrollment for training-affiliate
  console.log('\n📝 Enrollments for training-affiliate:')
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      courseId: 'crs_1766908122543_3e6hl9v59'
    }
  })
  
  if (enrollments.length > 0) {
    for (const e of enrollments) {
      const user = await prisma.user.findUnique({
        where: { id: e.userId },
        select: { email: true, role: true }
      })
      console.log(`- ${user?.email || 'Unknown'} (${user?.role || 'N/A'}) - Progress: ${e.progress}%`)
    }
  } else {
    console.log('❌ No enrollments found')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
