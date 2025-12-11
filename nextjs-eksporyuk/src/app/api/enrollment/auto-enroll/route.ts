import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/enrollment/auto-enroll
 * Auto-enroll user to courses from membership/product purchase
 * Called by webhook after successful payment
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow both authenticated users and webhook calls
    const body = await req.json()
    const { userId, membershipId, productId, transactionId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    let enrolledCourses: string[] = []

    // Enroll from membership
    if (membershipId) {
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId },
        include: {
          membershipCourses: {
            include: {
              course: true
            }
          }
        }
      })

      if (membership) {
        for (const mc of membership.membershipCourses) {
          // Check if already enrolled
          const existing = await prisma.courseEnrollment.findUnique({
            where: {
              userId_courseId: {
                userId,
                courseId: mc.courseId
              }
            }
          })

          if (!existing) {
            // Enroll user
            await prisma.courseEnrollment.create({
              data: {
                userId,
                courseId: mc.courseId,
                transactionId
              }
            })

            // Create progress tracker
            await prisma.userCourseProgress.create({
              data: {
                userId,
                courseId: mc.courseId,
                progress: 0,
                hasAccess: true,
                accessGrantedAt: new Date()
              }
            })

            enrolledCourses.push(mc.course.title)
          }
        }
      }
    }

    // Enroll from product
    if (productId) {
      // TODO: Implement product-course relationship in future
      // Currently products don't have direct course links
      // They provide access via membership upgrade
    }

    // Send notification to user
    if (enrolledCourses.length > 0) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'COURSE_ENROLLED',
          title: 'Selamat! Anda terdaftar di kursus baru',
          message: `Anda sekarang memiliki akses ke: ${enrolledCourses.join(', ')}`,
          metadata: {
            enrolledCourses,
            membershipId,
            productId
          }
        }
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'AUTO_ENROLLED',
        entityId: membershipId || productId || '',
        metadata: {
          enrolledCourses,
          membershipId,
          productId,
          transactionId
        }
      }
    })

    return NextResponse.json({
      success: true,
      enrolledCourses,
      message: `Successfully enrolled in ${enrolledCourses.length} course(s)`
    })
  } catch (error) {
    console.error('Auto-enroll error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/enrollment/check-access
 * Check if user has access to a course
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ hasAccess: false })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      )
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId
        }
      }
    })

    // Check progress (has access)
    const progress = await prisma.userCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId
        }
      }
    })

    const hasAccess = (enrollment !== null) && (progress?.hasAccess === true)

    return NextResponse.json({
      hasAccess,
      enrollment,
      progress: progress?.progress || 0,
      isCompleted: progress?.isCompleted || false
    })
  } catch (error) {
    console.error('Check access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
