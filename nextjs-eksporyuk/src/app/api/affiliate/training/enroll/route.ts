import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/affiliate/training/enroll
 * Enroll affiliate to training course
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = session.user.role

    // Only affiliates and admins can enroll
    const allowedRoles = ['AFFILIATE', 'ADMIN', 'CO_FOUNDER', 'FOUNDER']
    if (!allowedRoles.includes(userRole || '')) {
      return NextResponse.json({ error: 'Access denied. Affiliate only.' }, { status: 403 })
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Check if course exists and is affiliate-only
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // @ts-ignore - Prisma types cache issue
    if (!course.affiliateOnly) {
      return NextResponse.json({ error: 'This course is not an affiliate training' }, { status: 400 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId,
        courseId
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({ message: 'Already enrolled' })
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        id: createId(),
        userId,
        courseId,
        updatedAt: new Date(),
      },
    })

    // Create progress record
    await prisma.userCourseProgress.create({
      data: {
        id: createId(),
        userId,
        courseId,
        progress: 0,
        hasAccess: true,
        updatedAt: new Date(),
      },
    })

    // Update enrollment count
    await prisma.course.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } },
    })

    return NextResponse.json({ 
      success: true, 
      enrollment,
      message: 'Successfully enrolled in training course' 
    })
  } catch (error) {
    console.error('Error enrolling to training:', error)
    return NextResponse.json(
      { error: 'Failed to enroll' },
      { status: 500 }
    )
  }
}
