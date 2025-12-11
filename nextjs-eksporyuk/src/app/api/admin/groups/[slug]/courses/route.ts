import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/groups/[id]/courses - Get courses assigned to a group
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id

    // Get group with courses
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get courses assigned to this group
    const courses = await prisma.course.findMany({
      where: { groupId },
      include: {
        mentor: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail,
      price: course.price,
      isPublished: course.isPublished,
      status: course.status,
      mentorName: course.mentor?.user?.name || 'Unknown',
      enrollmentCount: course._count.enrollments,
      createdAt: course.createdAt,
    }))

    return NextResponse.json({
      group,
      courses: formattedCourses,
    })
  } catch (error) {
    console.error('Error fetching group courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/groups/[id]/courses - Assign courses to group
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id
    const { courseIds } = await request.json()

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'courseIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
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

    // Update courses to assign to group
    const result = await prisma.course.updateMany({
      where: {
        id: { in: courseIds },
      },
      data: {
        groupId: groupId,
      },
    })

    // Auto-enroll all group members to these courses
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    })

    if (groupMembers.length > 0) {
      const enrollmentsToCreate = []
      for (const courseId of courseIds) {
        for (const member of groupMembers) {
          // Check if enrollment already exists
          const existingEnrollment = await prisma.courseEnrollment.findUnique({
            where: {
              userId_courseId: {
                userId: member.userId,
                courseId: courseId,
              },
            },
          })

          if (!existingEnrollment) {
            enrollmentsToCreate.push({
              userId: member.userId,
              courseId: courseId,
              status: 'ACTIVE',
            })
          }
        }
      }

      if (enrollmentsToCreate.length > 0) {
        await prisma.courseEnrollment.createMany({
          data: enrollmentsToCreate,
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} courses assigned to group`,
      autoEnrolled: groupMembers.length,
    })
  } catch (error) {
    console.error('Error assigning courses to group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/groups/[id]/courses?courseId=xxx - Remove course from group
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      )
    }

    // Verify course belongs to this group
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        groupId: groupId,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found in this group' },
        { status: 404 }
      )
    }

    // Remove group assignment (set groupId to null)
    await prisma.course.update({
      where: { id: courseId },
      data: { groupId: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Course removed from group',
    })
  } catch (error) {
    console.error('Error removing course from group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
