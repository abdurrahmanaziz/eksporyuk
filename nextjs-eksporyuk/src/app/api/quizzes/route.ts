import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/quizzes - Get quizzes (filtered by course/lesson)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const lessonId = searchParams.get('lessonId')

    const where: any = { isActive: true }
    if (courseId) where.courseId = courseId
    if (lessonId) where.lessonId = lessonId

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        },
        lesson: {
          select: {
            id: true,
            title: true
          }
        },
        questions: {
          select: {
            id: true,
            type: true,
            points: true
          }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/quizzes - Create quiz (ADMIN/MENTOR only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      courseId,
      lessonId,
      title,
      description,
      passingScore,
      timeLimit,
      maxAttempts,
      shuffleQuestions,
      shuffleAnswers,
      showResults,
      questions
    } = body

    if (!courseId || !title) {
      return NextResponse.json(
        { message: 'courseId and title required' },
        { status: 400 }
      )
    }

    // Verify course access for mentors
    if (session.user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (mentorProfile) {
        const course = await prisma.course.findUnique({
          where: { id: courseId }
        })

        if (!course || course.mentorId !== mentorProfile.id) {
          return NextResponse.json(
            { message: 'Not authorized for this course' },
            { status: 403 }
          )
        }
      }
    }

    // Create quiz with questions
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
        questions: questions
          ? {
              create: questions.map((q: any, idx: number) => ({
                type: q.type || 'MULTIPLE_CHOICE',
                question: q.question,
                explanation: q.explanation || null,
                points: q.points || 1,
                order: q.order !== undefined ? q.order : idx,
                options: q.options ? JSON.stringify(q.options) : null,
                correctAnswer: q.correctAnswer || null
              }))
            }
          : undefined
      },
      include: {
        questions: true
      }
    })

    return NextResponse.json({ quiz }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
