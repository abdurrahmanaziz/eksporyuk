import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/admin/memberships/[id]/courses - Get courses assigned to membership
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membershipId = params.id

    // Get membership with assigned courses
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        membershipCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                price: true,
                isPublished: true,
                status: true,
                mentor: {
                  select: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    enrollments: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      membership: {
        id: membership.id,
        name: membership.name,
        slug: membership.slug,
      },
      courses: membership.membershipCourses.map((mc) => ({
        id: mc.course.id,
        title: mc.course.title,
        thumbnail: mc.course.thumbnail,
        price: mc.course.price,
        isPublished: mc.course.isPublished,
        status: mc.course.status,
        mentorName: mc.course.mentor?.user?.name,
        enrollmentCount: mc.course._count.enrollments,
        assignedAt: mc.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get membership courses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership courses' },
      { status: 500 }
    )
  }
}

// POST /api/admin/memberships/[id]/courses - Assign courses to membership
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membershipId = params.id
    const body = await request.json()
    const { courseIds } = body

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'courseIds array is required' },
        { status: 400 }
      )
    }

    // Verify membership exists
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    // Verify all courses exist
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
      },
    })

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: 'One or more courses not found' },
        { status: 404 }
      )
    }

    // Get existing assignments
    const existing = await prisma.membershipCourse.findMany({
      where: {
        membershipId,
        courseId: { in: courseIds },
      },
    })

    const existingCourseIds = existing.map((mc) => mc.courseId)
    const newCourseIds = courseIds.filter((id) => !existingCourseIds.includes(id))

    // Create new assignments
    if (newCourseIds.length > 0) {
      await prisma.membershipCourse.createMany({
        data: newCourseIds.map((courseId) => ({
          membershipId,
          courseId,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      message: `${newCourseIds.length} courses assigned to membership`,
      skipped: existingCourseIds.length,
    })
  } catch (error) {
    console.error('Assign courses error:', error)
    return NextResponse.json(
      { error: 'Failed to assign courses' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/memberships/[id]/courses - Remove course from membership
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membershipId = params.id
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      )
    }

    await prisma.membershipCourse.deleteMany({
      where: {
        membershipId,
        courseId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Course removed from membership',
    })
  } catch (error) {
    console.error('Remove course error:', error)
    return NextResponse.json(
      { error: 'Failed to remove course' },
      { status: 500 }
    )
  }
}
