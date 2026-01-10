import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET all questions for a quiz
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { quizId } = await params

    const questions = await prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Get questions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

// POST create new question
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, quizId } = await params
    const body = await req.json()
    const { 
      type, 
      question, 
      explanation, 
      points, 
      order,
      options,
      correctAnswer
    } = body

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz || quiz.courseId !== courseId) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Create question
    const quizQuestion = await prisma.quizQuestion.create({
      data: {
        quizId,
        type: type || 'MULTIPLE_CHOICE',
        question,
        explanation: explanation || null,
        points: points || 1,
        order: order || 1,
        options: options || null,
        correctAnswer: correctAnswer || null
      }
    })

    return NextResponse.json({
      message: 'Question created successfully',
      question: quizQuestion
    }, { status: 201 })
  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  }
}
