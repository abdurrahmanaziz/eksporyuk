import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/quizzes/[id] - Get quiz details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { id }
    })

    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // Fetch related data manually
    const [course, lesson, questions] = await Promise.all([
      quiz.courseId ? prisma.course.findUnique({
        where: { id: quiz.courseId },
        select: { id: true, title: true }
      }) : null,
      quiz.lessonId ? prisma.courseLesson.findUnique({
        where: { id: quiz.lessonId },
        select: { id: true, title: true }
      }) : null,
      prisma.quizQuestion.findMany({
        where: { quizId: id },
        orderBy: { order: 'asc' }
      })
    ])

    const quizWithRelations = {
      ...quiz,
      course,
      lesson,
      questions
    }

    // Check if user has previous attempts
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: id,
        userId: session.user.id
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 10
    })

    // Add attempt count for frontend
    const quizWithCount = {
      ...quizWithRelations,
      _count: {
        attempts: attempts.length
      }
    }

    return NextResponse.json({ quiz: quizWithCount, attempts })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/quizzes/[id] - Update quiz (ADMIN/MENTOR only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Verify ownership for mentors
    if (session.user.role === 'MENTOR') {
      const quiz = await prisma.quiz.findUnique({
        where: { id }
      })

      if (quiz && quiz.courseId) {
        const [course, mentorProfile] = await Promise.all([
          prisma.course.findUnique({
            where: { id: quiz.courseId }
          }),
          prisma.mentorProfile.findUnique({
            where: { userId: session.user.id }
          })
        ])

        if (!mentorProfile || course?.mentorId !== mentorProfile.id) {
          return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }
      }
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        passingScore: body.passingScore,
        timeLimit: body.timeLimit,
        maxAttempts: body.maxAttempts,
        shuffleQuestions: body.shuffleQuestions,
        shuffleAnswers: body.shuffleAnswers,
        showResults: body.showResults,
        isActive: body.isActive
      }
    })

    // Fetch questions separately
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId: id }
    })

    return NextResponse.json({ quiz: { ...updated, questions } })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/quizzes/[id] - Delete quiz (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.quiz.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
