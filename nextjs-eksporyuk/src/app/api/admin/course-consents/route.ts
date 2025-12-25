import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/course-consents
 * Get all courses with consent counts (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and mentor can access
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all courses (no relations in schema for consents/enrollments)
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true
      },
      orderBy: [
        { status: 'asc' },
        { title: 'asc' }
      ]
    })

    // Count consents and enrollments separately for each course
    const courseIds = courses.map(c => c.id)
    
    const [consentCounts, enrollmentCounts] = await Promise.all([
      prisma.courseConsent.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds } },
        _count: { id: true }
      }),
      prisma.courseEnrollment.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds } },
        _count: { id: true }
      })
    ])

    // Create maps for quick lookup
    const consentMap = new Map(consentCounts.map(c => [c.courseId, c._count.id]))
    const enrollmentMap = new Map(enrollmentCounts.map(e => [e.courseId, e._count.id]))

    // Combine data
    const coursesWithCounts = courses.map(course => ({
      ...course,
      _count: {
        consents: consentMap.get(course.id) || 0,
        enrollments: enrollmentMap.get(course.id) || 0
      }
    }))

    return NextResponse.json({
      success: true,
      courses: coursesWithCounts
    })
  } catch (error) {
    console.error('Error fetching course consents:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data' },
      { status: 500 }
    )
  }
}
