import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/services/notificationService';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/assignments/[id]/grade - Grade assignment submission (ADMIN/MENTOR only)
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
      select: { id: true, role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MENTOR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId, score, feedback } = body;

    if (!submissionId || score === undefined) {
      return NextResponse.json(
        { error: 'Submission ID and score are required' },
        { status: 400 }
      );
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // For mentors, verify they own the course
    if (user.role === 'MENTOR' && submission.assignment.course.mentorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate score
    if (score < 0 || score > submission.assignment.maxScore) {
      return NextResponse.json(
        { error: `Score must be between 0 and ${submission.assignment.maxScore}` },
        { status: 400 }
      );
    }

    const graded = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback: feedback || null,
        status: 'GRADED',
        gradedBy: user.id,
        gradedAt: new Date(),
      },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    // Notify student about graded assignment
    const percentage = Math.round((score / submission.assignment.maxScore) * 100);
    const isPassing = percentage >= 70;
    
    await notificationService.send({
      userId: graded.user.id,
      type: 'ASSIGNMENT',
      title: isPassing ? '✅ Tugas Dinilai - Lulus!' : '📝 Tugas Dinilai',
      message: `Tugas "${graded.assignment.title}" mendapat nilai ${score}/${submission.assignment.maxScore} (${percentage}%)${feedback ? '. Lihat feedback dari mentor.' : ''}`,
      link: `/learn/${submission.assignment.course.slug}?tab=assignments`,
      channels: ['pusher', 'onesignal', 'email']
    }).catch(err => console.error('Failed to send grade notification:', err));

    return NextResponse.json({ submission: graded });
  } catch (error: any) {
    console.error('Error grading assignment:', error);
    return NextResponse.json(
      { error: 'Failed to grade assignment' },
      { status: 500 }
    );
  }
}
