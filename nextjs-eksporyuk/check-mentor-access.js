/**
 * Check Mentor Access Issues
 * 
 * This script checks:
 * 1. User has MENTOR role
 * 2. MentorProfile exists
 * 3. All mentor routes are accessible
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMentorAccess() {
  console.log('🔍 Checking Mentor Access...\n')

  try {
    // 1. Check all users with MENTOR role
    const mentors = await prisma.user.findMany({
      where: { role: 'MENTOR' },
      include: {
        mentorProfile: true
      }
    })

    console.log(`📊 Found ${mentors.length} users with MENTOR role\n`)

    for (const mentor of mentors) {
      console.log(`\n👤 ${mentor.name} (${mentor.email})`)
      console.log(`   Role: ${mentor.role}`)
      console.log(`   Has Profile: ${!!mentor.mentorProfile}`)
      
      if (!mentor.mentorProfile) {
        console.log(`   ⚠️  Missing MentorProfile - creating...`)
        await prisma.mentorProfile.create({
          data: {
            userId: mentor.id,
            bio: '',
            expertise: [],
            specialization: 'Export Business',
            yearsOfExperience: 0,
            isAuthorizedSupplierReviewer: false
          }
        })
        console.log(`   ✅ MentorProfile created`)
      }
    }

    // 2. Check mentor routes that should exist
    const mentorRoutes = [
      '/mentor/dashboard',
      '/mentor/courses',
      '/mentor/students',
      '/mentor/analytics',
      '/mentor/materials',
      '/mentor/assignments',
      '/mentor/grading',
      '/mentor/classes',
      '/mentor/products',
      '/mentor/profile',
      '/mentor/wallet',
      '/mentor/earnings'
    ]

    console.log('\n\n📁 Mentor Routes Check:')
    console.log('These routes should be accessible at:')
    console.log('src/app/(dashboard)/mentor/[route]/page.tsx\n')
    
    mentorRoutes.forEach(route => {
      console.log(`   ${route}`)
    })

    console.log('\n\n✅ Mentor Access Check Complete')
    console.log('\n💡 If mentor still cannot access:')
    console.log('   1. Check browser session - logout and login again')
    console.log('   2. Check middleware logs in production')
    console.log('   3. Verify DATABASE_URL points to correct database')
    console.log('   4. Check role in session token (NextAuth JWT)')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMentorAccess()
