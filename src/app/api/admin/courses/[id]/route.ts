import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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

    // Fetch course without non-existent relations
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch transactions separately
    const transactions = await prisma.transaction.findMany({
      where: { courseId: courseId },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    // Fetch users for transactions
    const txUserIds = [...new Set(transactions.map(tx => tx.userId))]
    const txUsers = txUserIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: txUserIds } },
          select: { id: true, name: true, email: true, avatar: true }
        })
      : []
    const txUserMap = new Map(txUsers.map(u => [u.id, u]))

    const transactionsWithUser = transactions.map(tx => ({
      ...tx,
      user: txUserMap.get(tx.userId) || null
    }))

    // Fetch membershipCourses separately
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { courseId: courseId }
    })

    // Fetch modules separately (no relation in schema)
    const modules = await prisma.courseModule.findMany({
      where: { courseId: courseId },
      orderBy: { order: 'asc' }
    })

    // Fetch lessons for each module
    const modulesWithLessons = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await prisma.courseLesson.findMany({
          where: { moduleId: mod.id },
          orderBy: { order: 'asc' }
        })
        return { ...mod, lessons }
      })
    )

    // Fetch group if groupId exists
    let group = null
    if (course.groupId) {
      group = await prisma.group.findUnique({
        where: { id: course.groupId }
      })
    }

    // Fetch mentor data separately if mentorId exists
    let mentorData = null
    if (course.mentorId) {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { id: course.mentorId }
      })
      if (mentor) {
        const user = await prisma.user.findUnique({
          where: { id: mentor.userId },
          select: {
            name: true,
            email: true,
            avatar: true
          }
        })
        mentorData = { ...mentor, user }
      }
    }

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        transactions: transactionsWithUser,
        membershipCourses,
        modules: modulesWithLessons,
        group,
        mentor: mentorData,
        _count: {
          modules: modules.length,
          transactions: transactionsWithUser.length
        }
      }
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
      }
    })

    // Fetch mentor data separately if mentorId exists
    let mentorData = null
    if (updatedCourse.mentorId) {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { id: updatedCourse.mentorId }
      })
      if (mentor) {
        const user = await prisma.user.findUnique({
          where: { id: mentor.userId },
          select: {
            name: true,
            email: true
          }
        })
        mentorData = { ...mentor, user }
      }
    }

    return NextResponse.json({
      success: true,
      course: {
        ...updatedCourse,
        mentor: mentorData
      }
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
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check for transactions
    const transactionCount = await prisma.transaction.count({
      where: { courseId: courseId }
    })

    // Warning if course has transactions
    if (transactionCount > 0) {
      // Optionally, you can prevent deletion if there are transactions
      // return NextResponse.json(
      //   { error: `Cannot delete course with ${transactionCount} transactions` },
      //   { status: 400 }
      // )
    }

    // Delete related modules and lessons first (no cascade without relations)
    const modules = await prisma.courseModule.findMany({
      where: { courseId: courseId }
    })
    
    for (const mod of modules) {
      await prisma.courseLesson.deleteMany({
        where: { moduleId: mod.id }
      })
    }
    
    await prisma.courseModule.deleteMany({
      where: { courseId: courseId }
    })

    // Delete course
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
