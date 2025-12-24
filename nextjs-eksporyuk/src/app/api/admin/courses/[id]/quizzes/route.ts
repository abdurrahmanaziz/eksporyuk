import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET all quizzes for a course
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

    const quizzes = await prisma.quiz.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' }
    })

    // Fetch questions for all quizzes
    const quizIds = quizzes.map(q => q.id)
    const questions = quizIds.length > 0
      ? await prisma.quizQuestion.findMany({
          where: { quizId: { in: quizIds } },
          orderBy: { order: 'asc' }
        })
      : []

    // Fetch attempt counts for all quizzes
    const attemptCounts = quizIds.length > 0
      ? await prisma.quizAttempt.groupBy({
          by: ['quizId'],
          where: { quizId: { in: quizIds } },
          _count: true
        })
      : []

    // Group questions by quizId
    const questionsByQuiz = new Map<string, typeof questions>()
    for (const q of questions) {
      const existing = questionsByQuiz.get(q.quizId) || []
      existing.push(q)
      questionsByQuiz.set(q.quizId, existing)
    }

    // Map attempt counts
    const attemptCountMap = new Map(attemptCounts.map(ac => [ac.quizId, ac._count]))

    // Add questions and count to quizzes
    const quizzesWithData = quizzes.map(quiz => ({
      ...quiz,
      questions: questionsByQuiz.get(quiz.id) || [],
      _count: {
        attempts: attemptCountMap.get(quiz.id) || 0
      }
    }))

    return NextResponse.json({ quizzes: quizzesWithData })
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}

// POST create new quiz
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
      passingScore, 
      timeLimit, 
      maxAttempts,
      shuffleQuestions,
      shuffleAnswers,
      showResults,
      isActive,
      lessonId
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        lessonId: lessonId || null,
        title,
        description: description || null,
        passingScore: passingScore || 70,
        timeLimit: timeLimit || null,
        maxAttempts: maxAttempts || null,
        shuffleQuestions: shuffleQuestions || false,
        shuffleAnswers: shuffleAnswers || false,
        showResults: showResults !== undefined ? showResults : true,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({
      message: 'Quiz created successfully',
      quiz
    }, { status: 201 })
  } catch (error) {
    console.error('Create quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    )
  }
}
