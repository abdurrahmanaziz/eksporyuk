import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying Database Connection...\n')

  // Get database URL from env
  const dbUrl = process.env.DATABASE_URL
  console.log('📊 DATABASE_URL:')
  console.log(`   ${dbUrl}\n`)

  // Extract host
  const host = dbUrl?.match(/@([^/]+)/)?.[1] || 'unknown'
  console.log(`🌐 Connected Host: ${host}\n`)

  // Check production indicators
  const isProduction = host.includes('ep-square-wind-a189qpum')
  console.log(`${isProduction ? '✅' : '❌'} Using PRODUCTION database: ${isProduction}\n`)

  // Count affiliates
  const affiliateCount = await prisma.user.count({
    where: { role: 'AFFILIATE' }
  })
  console.log(`👥 Affiliate users: ${affiliateCount}`)

  // Count enrollments for training
  const trainingEnrollments = await prisma.courseEnrollment.count({
    where: {
      courseId: 'crs_1766908122543_3e6hl9v59'
    }
  })
  console.log(`📚 Training enrollments: ${trainingEnrollments}`)

  // Expected production values
  console.log('\n📋 Expected Production Values:')
  console.log(`   Affiliates: 99`)
  console.log(`   Enrollments: 99`)

  const isCorrectDB = affiliateCount === 99 && trainingEnrollments === 99 && isProduction
  
  console.log(`\n${isCorrectDB ? '✅ ✅ ✅' : '❌ ❌ ❌'} Database Verification: ${isCorrectDB ? 'CORRECT (Production)' : 'WRONG DATABASE!'}`)

  await prisma.$disconnect()
}

main().catch(console.error)
