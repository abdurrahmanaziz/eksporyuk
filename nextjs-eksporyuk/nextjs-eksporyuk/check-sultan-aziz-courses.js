const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSultanAzizCourses() {
  try {
    console.log('\n=== SULTAN AZIZ COURSE DIAGNOSTIC ===\n')

    // Find Sultan Aziz
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Sultan Aziz', mode: 'insensitive' } },
          { email: { contains: 'sultanaziz', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      console.log('❌ Sultan Aziz not found!')
      return
    }

    console.log('✅ User Found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)

    // Get user membership
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: user.id,
        status: { in: ['ACTIVE', 'EXPIRED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        membership: {
          include: {
            membershipCourses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!userMembership) {
      console.log('\n❌ No membership found for Sultan Aziz!')
      return
    }

    console.log('\n✅ User Membership Found:')
    console.log(`   Membership: ${userMembership.membership.name}`)
    console.log(`   Status: ${userMembership.status}`)
    console.log(`   Start Date: ${userMembership.startDate}`)
    console.log(`   End Date: ${userMembership.endDate || 'N/A (Lifetime)'}`)

    const now = new Date()
    const isActive =
      userMembership.status === 'ACTIVE' &&
      (!userMembership.endDate || new Date(userMembership.endDate) > now)
    console.log(`   Is Active: ${isActive ? '✅ YES' : '❌ NO'}`)

    // Check courses in membership
    console.log(
      `\n📚 Courses in Membership Package (${userMembership.membership.membershipCourses.length}):`
    )
    if (userMembership.membership.membershipCourses.length === 0) {
      console.log('   ⚠️  No courses assigned to this membership package!')
    } else {
      userMembership.membership.membershipCourses.forEach((mc, idx) => {
        console.log(
          `   ${idx + 1}. ${mc.course.title} (${mc.course.status})`
        )
      })
    }

    // Check for membershipIncluded courses
    const membershipIncludedCourses = await prisma.course.findMany({
      where: {
        membershipIncluded: true,
        status: { in: ['PUBLISHED', 'APPROVED'] },
        affiliateOnly: false,
        isAffiliateTraining: false,
        isAffiliateMaterial: false,
        roleAccess: { not: 'AFFILIATE' },
      },
      select: {
        id: true,
        title: true,
        status: true,
        membershipIncluded: true,
      },
    })

    console.log(
      `\n📚 Global Membership Courses (membershipIncluded=true): ${membershipIncludedCourses.length}`
    )
    if (membershipIncludedCourses.length > 0) {
      membershipIncludedCourses.forEach((course, idx) => {
        console.log(`   ${idx + 1}. ${course.title} (${course.status})`)
      })
    }

    // Check enrollments
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        course: {
          select: {
            title: true,
            status: true,
          },
        },
      },
    })

    console.log(`\n📝 User Enrollments: ${enrollments.length}`)
    if (enrollments.length > 0) {
      enrollments.forEach((enrollment, idx) => {
        console.log(
          `   ${idx + 1}. ${enrollment.course.title} (${enrollment.enrollmentType})`
        )
      })
    } else {
      console.log('   ⚠️  No enrollments found!')
    }

    // Check user progress
    const userProgress = await prisma.userProgress.findMany({
      where: {
        userId: user.id,
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    })

    console.log(`\n📊 User Progress Records: ${userProgress.length}`)
    if (userProgress.length > 0) {
      userProgress.forEach((progress, idx) => {
        const completed = progress.completedLessons
          ? progress.completedLessons.length
          : 0
        console.log(`   ${idx + 1}. ${progress.course.title} (${completed} lessons completed)`)
      })
    }

    // Diagnosis
    console.log('\n\n=== DIAGNOSIS ===')
    if (userMembership.membership.membershipCourses.length === 0) {
      console.log('❌ PROBLEM FOUND: No courses assigned to the membership package!')
      console.log('   SOLUTION: Assign courses to the membership package in admin panel')
    } else if (!isActive) {
      console.log('❌ PROBLEM FOUND: Membership is not active or expired!')
      console.log(`   Status: ${userMembership.status}`)
      if (userMembership.endDate && new Date(userMembership.endDate) <= now) {
        console.log(`   End Date: ${userMembership.endDate} (expired)`)
      }
    } else {
      console.log('✅ Everything looks good!')
      console.log(`   - Membership is active`)
      console.log(`   - ${userMembership.membership.membershipCourses.length} courses available`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSultanAzizCourses()
