import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// POST /api/assignments/[id]/submit - Submit assignment
export async function POST(
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
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if assignment is still active
    if (!assignment.isActive) {
      return NextResponse.json({ error: 'Assignment is not active' }, { status: 400 });
    }

    // Check due date
    const now = new Date();
    if (assignment.dueDate && now > assignment.dueDate && !assignment.allowLateSubmission) {
      return NextResponse.json(
        { error: 'Assignment submission deadline has passed' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { content, fileUrl, fileName } = body;

    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: 'Either content or file is required' },
        { status: 400 }
      );
    }

    // Determine if submission is late
    const isLate = assignment.dueDate ? now > assignment.dueDate : false;

    // Check for existing submission
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: params.id,
        userId: user.id,
      },
    });

    let submission;
    if (existingSubmission) {
      // Update existing submission if not yet graded
      if (existingSubmission.status === 'GRADED') {
        return NextResponse.json(
          { error: 'Cannot resubmit a graded assignment' },
          { status: 400 }
        );
      }

      submission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          content: content || existingSubmission.content,
          fileUrl: fileUrl || existingSubmission.fileUrl,
          fileName: fileName || existingSubmission.fileName,
          status: isLate ? 'LATE' : 'SUBMITTED',
          submittedAt: now,
        },
        include: {
          assignment: {
            select: {
              title: true,
              maxScore: true,
            },
          },
        },
      });
    } else {
      // Create new submission
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: params.id,
          userId: user.id,
          content: content || null,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          status: isLate ? 'LATE' : 'SUBMITTED',
          submittedAt: now,
        },
        include: {
          assignment: {
            select: {
              title: true,
              maxScore: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    );
  }
}
