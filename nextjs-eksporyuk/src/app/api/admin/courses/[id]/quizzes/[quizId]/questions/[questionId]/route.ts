import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET single question
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { quizId, questionId } = await params

    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId }
    })

    if (!question || question.quizId !== quizId) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Get question error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    )
  }
}

// PUT update question
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { quizId, questionId } = await params
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

    // Check if question exists
    const existingQuestion = await prisma.quizQuestion.findUnique({
      where: { id: questionId }
    })

    if (!existingQuestion || existingQuestion.quizId !== quizId) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Update question
    const updatedQuestion = await prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        type: type !== undefined ? type : existingQuestion.type,
        question: question !== undefined ? question : existingQuestion.question,
        explanation: explanation !== undefined ? explanation : existingQuestion.explanation,
        points: points !== undefined ? points : existingQuestion.points,
        order: order !== undefined ? order : existingQuestion.order,
        ...(options !== undefined && { options: options || null }),
        correctAnswer: correctAnswer !== undefined ? correctAnswer : existingQuestion.correctAnswer
      }
    })

    return NextResponse.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    })
  } catch (error) {
    console.error('Update question error:', error)
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    )
  }
}

// DELETE question
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { quizId, questionId } = await params

    // Check if question exists
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId }
    })

    if (!question || question.quizId !== quizId) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Delete question
    await prisma.quizQuestion.delete({
      where: { id: questionId }
    })

    return NextResponse.json({
      message: 'Question deleted successfully'
    })
  } catch (error) {
    console.error('Delete question error:', error)
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    )
  }
}
