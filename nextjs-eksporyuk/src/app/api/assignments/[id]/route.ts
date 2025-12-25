import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/assignments/[id] - Get assignment details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Fetch related data manually
    const [course, lesson, submissions] = await Promise.all([
      assignment.courseId ? prisma.course.findUnique({
        where: { id: assignment.courseId },
        select: { id: true, title: true }
      }) : null,
      assignment.lessonId ? prisma.courseLesson.findUnique({
        where: { id: assignment.lessonId },
        select: { id: true, title: true }
      }) : null,
      prisma.assignmentSubmission.findMany({
        where: {
          assignmentId: params.id,
          userId: user.id
        },
        orderBy: { submittedAt: 'desc' },
        take: 1
      })
    ]);

    const assignmentWithRelations = {
      ...assignment,
      course,
      lesson,
      submissions
    };

    return NextResponse.json({ assignment: assignmentWithRelations });
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// PUT /api/assignments/[id] - Update assignment (ADMIN/MENTOR only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MENTOR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Fetch course for ownership check
    let course = null;
    if (assignment.courseId) {
      course = await prisma.course.findUnique({
        where: { id: assignment.courseId }
      });
    }

    // For mentors, verify ownership
    if (user.role === 'MENTOR' && course?.mentorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      maxScore,
      dueDate,
      allowLateSubmission,
      allowedFileTypes,
      maxFileSize,
      isActive,
    } = body;

    const updated = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        title: title || assignment.title,
        description: description !== undefined ? description : assignment.description,
        maxScore: maxScore || assignment.maxScore,
        dueDate: dueDate ? new Date(dueDate) : assignment.dueDate,
        allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission : assignment.allowLateSubmission,
        allowedFileTypes: allowedFileTypes !== undefined ? allowedFileTypes : assignment.allowedFileTypes,
        maxFileSize: maxFileSize || assignment.maxFileSize,
        isActive: isActive !== undefined ? isActive : assignment.isActive,
      }
    });

    // Fetch course and lesson for response
    const [updatedCourse, updatedLesson] = await Promise.all([
      updated.courseId ? prisma.course.findUnique({
        where: { id: updated.courseId }
      }) : null,
      updated.lessonId ? prisma.courseLesson.findUnique({
        where: { id: updated.lessonId }
      }) : null
    ]);

    return NextResponse.json({ 
      assignment: {
        ...updated,
        course: updatedCourse,
        lesson: updatedLesson
      }
    });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[id] - Delete assignment (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.assignment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
