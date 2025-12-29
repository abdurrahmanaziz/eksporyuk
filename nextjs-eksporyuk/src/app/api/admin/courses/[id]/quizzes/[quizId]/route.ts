import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET single quiz
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

    const { id: courseId, quizId } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz || quiz.courseId !== courseId) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Fetch questions separately
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ 
      quiz: {
        ...quiz,
        questions
      }
    })
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

// PUT update quiz
export async function PUT(
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
      title, 
      description, 
      passingScore, 
      timeLimit, 
      maxAttempts,
      shuffleQuestions,
      shuffleAnswers,
      showResults,
      isActive
    } = body

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz || quiz.courseId !== courseId) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Update quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        title: title !== undefined ? title : quiz.title,
        description: description !== undefined ? description : quiz.description,
        passingScore: passingScore !== undefined ? passingScore : quiz.passingScore,
        timeLimit: timeLimit !== undefined ? timeLimit : quiz.timeLimit,
        maxAttempts: maxAttempts !== undefined ? maxAttempts : quiz.maxAttempts,
        shuffleQuestions: shuffleQuestions !== undefined ? shuffleQuestions : quiz.shuffleQuestions,
        shuffleAnswers: shuffleAnswers !== undefined ? shuffleAnswers : quiz.shuffleAnswers,
        showResults: showResults !== undefined ? showResults : quiz.showResults,
        isActive: isActive !== undefined ? isActive : quiz.isActive
      }
    })

    return NextResponse.json({
      message: 'Quiz updated successfully',
      quiz: updatedQuiz
    })
  } catch (error) {
    console.error('Update quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    )
  }
}

// DELETE quiz
export async function DELETE(
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

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz || quiz.courseId !== courseId) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Delete quiz (will cascade delete questions and attempts)
    await prisma.quiz.delete({
      where: { id: quizId }
    })

    return NextResponse.json({
      message: 'Quiz deleted successfully'
    })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    )
  }
}
