import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/courses/[id] - Get single course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        modules: {
          include: {
            lessons: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        group: true,
        enrollments: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
            quizzes: true,
            assignments: true,
            certificates: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      course
    })
  } catch (error) {
    console.error('GET /api/admin/courses/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId } = await params
    const body = await request.json()

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // If slug changed, check uniqueness
    if (body.slug && body.slug !== existingCourse.slug) {
      const slugExists = await prisma.course.findUnique({
        where: { slug: body.slug }
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      course: updatedCourse
    })
  } catch (error) {
    console.error('PUT /api/admin/courses/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId } = await params

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Warning if course has enrollments
    if (course._count.enrollments > 0) {
      // Optionally, you can prevent deletion if there are enrollments
      // Uncomment below to enforce:
      // return NextResponse.json(
      //   { error: `Cannot delete course with ${course._count.enrollments} active enrollments` },
      //   { status: 400 }
      // )
    }

    // Delete course (cascade will delete modules, lessons, enrollments, etc.)
    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/admin/courses/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
