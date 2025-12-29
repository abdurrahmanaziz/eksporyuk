import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET /api/admin/quizzes - Get all quizzes from all courses (ADMIN only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check - ADMIN only
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters for optional filtering
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const isActive = searchParams.get('isActive')
    const limit = searchParams.get('limit')

    // Build where clause
    interface WhereClause {
      courseId?: string
      isActive?: boolean
    }
    
    const where: WhereClause = {}
    
    if (courseId) {
      where.courseId = courseId
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Fetch all quizzes
    const quizzes = await prisma.quiz.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      ...(limit ? { take: parseInt(limit) } : {})
    })

    // Get all unique courseIds and quizIds
    const courseIds = [...new Set(quizzes.map(q => q.courseId))]
    const quizIds = quizzes.map(q => q.id)

    // Fetch courses data separately
    const courses = courseIds.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: {
            id: true,
            title: true,
            slug: true
          }
        })
      : []

    // Fetch questions count for all quizzes
    const questionsCount = quizIds.length > 0
      ? await prisma.quizQuestion.groupBy({
          by: ['quizId'],
          where: { quizId: { in: quizIds } },
          _count: true
        })
      : []

    // Fetch attempts count for all quizzes
    const attemptsCount = quizIds.length > 0
      ? await prisma.quizAttempt.groupBy({
          by: ['quizId'],
          where: { quizId: { in: quizIds } },
          _count: true
        })
      : []

    // Create maps for efficient lookup
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const questionsCountMap = new Map(questionsCount.map(qc => [qc.quizId, qc._count]))
    const attemptsCountMap = new Map(attemptsCount.map(ac => [ac.quizId, ac._count]))

    // Combine data
    const quizzesWithData = quizzes.map(quiz => ({
      ...quiz,
      course: courseMap.get(quiz.courseId) || null,
      _count: {
        questions: questionsCountMap.get(quiz.id) || 0,
        attempts: attemptsCountMap.get(quiz.id) || 0
      }
    }))

    // Return quizzes with sanitized data
    const sanitizedQuizzes = quizzesWithData.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      maxAttempts: quiz.maxAttempts,
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleAnswers: quiz.shuffleAnswers,
      showResults: quiz.showResults,
      isActive: quiz.isActive,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      course: quiz.course,
      _count: quiz._count
    }))

    return NextResponse.json(
      { 
        quizzes: sanitizedQuizzes,
        total: sanitizedQuizzes.length
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )

  } catch (error) {
    console.error('Get all quizzes error:', error)
    
    // Return generic error message without exposing internal details
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch quizzes. Please try again later.'
      },
      { status: 500 }
    )
  }
}
