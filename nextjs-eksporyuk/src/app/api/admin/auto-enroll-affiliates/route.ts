import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/auto-enroll-affiliates
 * Auto-enroll ALL affiliates to mandatory training courses
 * Only ADMIN can trigger this
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can trigger auto-enrollment
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    console.log('🚀 [AUTO-ENROLL] Starting auto-enrollment for affiliates...')

    // 1. Get all affiliate training courses (isAffiliateTraining = true)
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

    console.log(`📚 Found ${trainingCourses.length} affiliate training courses:`, trainingCourses.map(c => c.title))

    if (trainingCourses.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No affiliate training courses found',
        enrolled: 0
      })
    }

    // 2. Get all users with AFFILIATE role
    const affiliates = await prisma.user.findMany({
      where: {
        role: 'AFFILIATE'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    console.log(`👥 Found ${affiliates.length} affiliates`)

    if (affiliates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No affiliates found to enroll',
        enrolled: 0
      })
    }

    // 3. Auto-enroll each affiliate to each training course
    let enrolledCount = 0
    let skippedCount = 0

    for (const affiliate of affiliates) {
      for (const course of trainingCourses) {
        // Check if already enrolled
        const existingEnrollment = await prisma.courseEnrollment.findFirst({
          where: {
            userId: affiliate.id,
            courseId: course.id
          }
        })

        if (!existingEnrollment) {
          // Create enrollment
          await prisma.courseEnrollment.create({
            data: {
              userId: affiliate.id,
              courseId: course.id,
              enrolledAt: new Date(),
              progress: 0
            }
          })
          
          console.log(`✅ Enrolled: ${affiliate.email} → ${course.title}`)
          enrolledCount++
        } else {
          console.log(`⏭️  Skipped (already enrolled): ${affiliate.email} → ${course.title}`)
          skippedCount++
        }
      }
    }

    console.log(`\n🎉 [AUTO-ENROLL] Complete!`)
    console.log(`   Enrolled: ${enrolledCount}`)
    console.log(`   Skipped: ${skippedCount}`)
    console.log(`   Total affiliates: ${affiliates.length}`)
    console.log(`   Total courses: ${trainingCourses.length}`)

    return NextResponse.json({
      success: true,
      message: 'Auto-enrollment completed successfully',
      stats: {
        affiliatesCount: affiliates.length,
        coursesCount: trainingCourses.length,
        enrolled: enrolledCount,
        skipped: skippedCount,
        total: enrolledCount + skippedCount
      },
      courses: trainingCourses.map(c => ({
        title: c.title,
        slug: c.slug
      }))
    })

  } catch (error) {
    console.error('❌ [AUTO-ENROLL] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to auto-enroll affiliates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/auto-enroll-affiliates
 * Check status of affiliate enrollments (stats only)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get training courses
    const trainingCourses = await prisma.course.findMany({
      where: {
        isAffiliateTraining: true,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        slug: true
      }
    })

    // Get affiliates
    const affiliatesCount = await prisma.user.count({
      where: { role: 'AFFILIATE' }
    })

    // Get enrollments
    const courseIds = trainingCourses.map(c => c.id)
    const enrollmentsCount = await prisma.courseEnrollment.count({
      where: {
        courseId: { in: courseIds }
      }
    })

    const expectedEnrollments = affiliatesCount * trainingCourses.length
    const missingEnrollments = expectedEnrollments - enrollmentsCount

    return NextResponse.json({
      stats: {
        affiliatesCount,
        trainingCoursesCount: trainingCourses.length,
        currentEnrollments: enrollmentsCount,
        expectedEnrollments,
        missingEnrollments,
        completionRate: expectedEnrollments > 0 
          ? ((enrollmentsCount / expectedEnrollments) * 100).toFixed(1) + '%'
          : '0%'
      },
      courses: trainingCourses,
      needsAutoEnrollment: missingEnrollments > 0
    })

  } catch (error) {
    console.error('❌ [AUTO-ENROLL CHECK] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check enrollment status' },
      { status: 500 }
    )
  }
}
