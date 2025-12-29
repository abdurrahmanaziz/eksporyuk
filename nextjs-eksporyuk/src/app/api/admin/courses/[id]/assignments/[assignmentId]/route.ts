import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET single assignment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, assignmentId } = await params

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment || assignment.courseId !== courseId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Fetch submissions separately
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId }
    })

    // Fetch users for submissions
    const userIds = [...new Set(submissions.map(s => s.userId))]
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true }
        })
      : []

    const userMap = new Map(users.map(u => [u.id, u]))

    const submissionsWithUser = submissions.map(s => ({
      ...s,
      user: userMap.get(s.userId) || null
    }))

    return NextResponse.json({ 
      assignment: {
        ...assignment,
        submissions: submissionsWithUser
      }
    })
  } catch (error) {
    console.error('Get assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    )
  }
}

// PUT update assignment
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, assignmentId } = await params
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
      attachments,
      links,
      isActive
    } = body

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment || assignment.courseId !== courseId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Update assignment using raw SQL to include new fields
    await prisma.$executeRaw`
      UPDATE "Assignment" 
      SET 
        title = ${title !== undefined ? title : assignment.title},
        description = ${description !== undefined ? description : assignment.description},
        instructions = ${instructions !== undefined ? instructions : assignment.instructions},
        "maxScore" = ${maxScore !== undefined ? maxScore : assignment.maxScore},
        "dueDate" = ${dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : assignment.dueDate},
        "allowLateSubmission" = ${allowLateSubmission !== undefined ? allowLateSubmission : assignment.allowLateSubmission},
        "allowedFileTypes" = ${allowedFileTypes !== undefined ? allowedFileTypes : assignment.allowedFileTypes},
        "maxFileSize" = ${maxFileSize !== undefined ? maxFileSize : assignment.maxFileSize},
        attachments = ${attachments !== undefined ? attachments : (assignment as any).attachments || null},
        links = ${links !== undefined ? links : (assignment as any).links || null},
        "isActive" = ${isActive !== undefined ? isActive : assignment.isActive},
        "updatedAt" = NOW()
      WHERE id = ${assignmentId}
    `
    
    // Fetch updated assignment
    const updatedAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    return NextResponse.json({
      message: 'Assignment updated successfully',
      assignment: updatedAssignment
    })
  } catch (error) {
    console.error('Update assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

// DELETE assignment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, assignmentId } = await params

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment || assignment.courseId !== courseId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Delete assignment (will cascade delete submissions)
    await prisma.assignment.delete({
      where: { id: assignmentId }
    })

    return NextResponse.json({
      message: 'Assignment deleted successfully'
    })
  } catch (error) {
    console.error('Delete assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
