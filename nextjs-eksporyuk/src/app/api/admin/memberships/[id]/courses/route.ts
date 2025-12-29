import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    // Get membership
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    // Get membership courses
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId },
      orderBy: { createdAt: 'desc' }
    })

    // Batch fetch courses
    const courseIds = membershipCourses.map(mc => mc.courseId)
    const courses = courseIds.length > 0 
      ? await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true,
            isPublished: true,
            status: true,
            mentorId: true
          }
        })
      : []

    // Batch fetch mentors
    const mentorIds = [...new Set(courses.filter(c => c.mentorId).map(c => c.mentorId as string))]
    const mentorProfiles = mentorIds.length > 0
      ? await prisma.mentorProfile.findMany({
          where: { id: { in: mentorIds } },
          select: { id: true, userId: true }
        })
      : []

    // Batch fetch users for mentors
    const mentorUserIds = mentorProfiles.map(mp => mp.userId)
    const mentorUsers = mentorUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: mentorUserIds } },
          select: { id: true, name: true }
        })
      : []

    // Batch fetch enrollment counts
    const enrollmentCounts = courseIds.length > 0
      ? await prisma.enrollment.groupBy({
          by: ['courseId'],
          where: { courseId: { in: courseIds } },
          _count: true
        })
      : []

    // Create lookup maps
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const mentorProfileMap = new Map(mentorProfiles.map(mp => [mp.id, mp]))
    const mentorUserMap = new Map(mentorUsers.map(u => [u.id, u]))
    const enrollmentCountMap = new Map(enrollmentCounts.map(ec => [ec.courseId, ec._count]))

    return NextResponse.json({
      membership: {
        id: membership.id,
        name: membership.name,
        slug: membership.slug,
      },
      courses: membershipCourses.map((mc) => {
        const course = courseMap.get(mc.courseId)
        const mentorProfile = course?.mentorId ? mentorProfileMap.get(course.mentorId) : null
        const mentorUser = mentorProfile ? mentorUserMap.get(mentorProfile.userId) : null
        
        return {
          id: course?.id,
          title: course?.title,
          thumbnail: course?.thumbnail,
          price: course?.price,
          isPublished: course?.isPublished,
          status: course?.status,
          mentorName: mentorUser?.name || null,
          enrollmentCount: enrollmentCountMap.get(mc.courseId) || 0,
          assignedAt: mc.createdAt,
        }
      }).filter(c => c.id), // Filter out courses that weren't found
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
