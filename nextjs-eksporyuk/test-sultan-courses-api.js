const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testMembershipCoursesAPI() {
  try {
    console.log('\n=== TESTING MEMBERSHIP COURSES API LOGIC ===\n')

    const userId = 'cmjggqx1p0000lg04lexkhou4' // Sultan Aziz

    // Replicate exact API logic
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'EXPIRED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        membership: {
          include: {
            membershipCourses: {
              include: {
                course: {
                  include: {
                    modules: {
                      include: {
                        lessons: true,
                      },
                    },
                    mentor: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            avatar: true,
                          },
                        },
                      },
                    },
                    enrollments: {
                      where: { userId },
                    },
                    userProgress: {
                      where: { userId },
                    },
                    _count: {
                      select: {
                        enrollments: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!userMembership) {
      console.log('❌ No membership found!')
      return
    }

    console.log(`✅ Found Membership: ${userMembership.membership.name}`)
    console.log(`   Status: ${userMembership.status}`)
    console.log(`   Membership Courses Count: ${userMembership.membership.membershipCourses.length}`)

    // Transform courses exactly like API does
    const membershipPackageCourses =
      userMembership.membership.membershipCourses.map((mc) => {
        const course = mc.course

        const totalModules = course.modules.length
        const totalLessons = course.modules.reduce(
          (sum, m) => sum + m.lessons.length,
          0
        )
        const totalDuration = course.modules.reduce(
          (sum, m) =>
            sum + m.lessons.reduce((lsum, l) => lsum + (l.duration || 0), 0),
          0
        )

        const userProgress = course.userProgress[0]
        const enrollment = course.enrollments[0]

        let progress = 0
        let completedLessons = 0
        if (userProgress) {
          const completedLessonsData = userProgress.completedLessons
          completedLessons = completedLessonsData
            ? completedLessonsData.length
            : 0
          progress =
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0
        }

        return {
          id: course.id,
          title: course.title,
          slug: course.slug,
          thumbnail: course.thumbnail,
          description: course.description,
          level: course.level || 'BEGINNER',
          totalModules,
          totalLessons,
          totalDuration,
          enrollmentCount: course._count.enrollments,
          instructor: course.mentor?.user
            ? {
                id: course.mentor.user.id,
                name: course.mentor.user.name,
                avatar: course.mentor.user.avatar,
              }
            : null,
          isEnrolled: !!enrollment,
          isFreeForMember: true,
          userProgress: userProgress
            ? {
                progress,
                completedLessons,
                lastAccessedAt: userProgress.updatedAt?.toISOString() || null,
              }
            : null,
        }
      })

    console.log(`\n📚 Transformed Courses: ${membershipPackageCourses.length}`)
    membershipPackageCourses.forEach((course, idx) => {
      console.log(`\n${idx + 1}. ${course.title}`)
      console.log(`   ID: ${course.id}`)
      console.log(`   Slug: ${course.slug}`)
      console.log(`   Level: ${course.level}`)
      console.log(`   Modules: ${course.totalModules}`)
      console.log(`   Lessons: ${course.totalLessons}`)
      console.log(`   Duration: ${course.totalDuration} minutes`)
      console.log(`   Enrolled: ${course.isEnrolled ? 'YES' : 'NO'}`)
      console.log(`   Instructor: ${course.instructor?.name || 'N/A'}`)
      if (course.userProgress) {
        console.log(
          `   Progress: ${course.userProgress.progress}% (${course.userProgress.completedLessons} lessons)`
        )
      }
    })

    // Check membershipIncluded courses
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
      },
    })

    console.log(
      `\n📚 Global Membership Courses: ${membershipIncludedCourses.length}`
    )

    // Final result
    const now = new Date()
    const isActive =
      userMembership.status === 'ACTIVE' &&
      (!userMembership.endDate || new Date(userMembership.endDate) > now)

    console.log('\n\n=== FINAL API RESPONSE ===')
    console.log(`Membership: ${userMembership.membership.name}`)
    console.log(`Is Active: ${isActive}`)
    console.log(`Total Courses: ${membershipPackageCourses.length + membershipIncludedCourses.length}`)
    console.log('\n✅ API should return courses successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMembershipCoursesAPI()
