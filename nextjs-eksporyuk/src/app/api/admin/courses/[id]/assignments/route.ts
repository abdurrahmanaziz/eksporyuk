import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET all assignments for a course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId } = await params

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' }
    })

    // Count submissions for each assignment
    const assignmentIds = assignments.map(a => a.id)
    const submissionCounts = assignmentIds.length > 0
      ? await prisma.assignmentSubmission.groupBy({
          by: ['assignmentId'],
          where: { assignmentId: { in: assignmentIds } },
          _count: true
        })
      : []

    const submissionCountMap = new Map(submissionCounts.map(sc => [sc.assignmentId, sc._count]))

    const assignmentsWithCount = assignments.map(a => ({
      ...a,
      _count: {
        submissions: submissionCountMap.get(a.id) || 0
      }
    }))

    return NextResponse.json({ assignments: assignmentsWithCount })
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST create new assignment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId } = await params
    const body = await req.json()
    const { 
      title, 
      description, 
      instructions,
      maxScore,
      dueDate,
      allowLateSubmission,
      allowedFileTypes,
      maxFileSize,
      isActive,
      lessonId
    } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        lessonId: lessonId || null,
        title,
        description,
        instructions: instructions || null,
        maxScore: maxScore || 100,
        dueDate: dueDate ? new Date(dueDate) : null,
        allowLateSubmission: allowLateSubmission || false,
        allowedFileTypes: allowedFileTypes || null,
        maxFileSize: maxFileSize || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({
      message: 'Assignment created successfully',
      assignment
    }, { status: 201 })
  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
