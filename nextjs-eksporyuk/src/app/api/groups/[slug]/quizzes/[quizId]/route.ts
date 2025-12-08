import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/groups/[slug]/quizzes/[quizId] - Get quiz details for taking
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, quizId } = await params

    // Find group
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    if (!membership && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 })
    }

    const quiz = await prisma.groupQuiz.findUnique({
      where: { id: quizId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        rewardBadge: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            question: true,
            questionType: true,
            options: true,
            points: true,
            order: true,
            imageUrl: true
            // Note: explanation is not included until after answering
          }
        },
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      }
    })

    if (!quiz || quiz.groupId !== group.id) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Get user's attempts
    const userAttempts = await prisma.groupQuizAttempt.count({
      where: {
        quizId: quiz.id,
        userId: session.user.id
      }
    })

    // Check if quiz is available
    const now = new Date()
    if (quiz.startDate && quiz.startDate > now) {
      return NextResponse.json({ error: 'Quiz has not started yet' }, { status: 400 })
    }
    if (quiz.endDate && quiz.endDate < now) {
      return NextResponse.json({ error: 'Quiz has ended' }, { status: 400 })
    }

    // Check attempts limit
    if (quiz.maxAttempts && userAttempts >= quiz.maxAttempts) {
      return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 400 })
    }

    // Shuffle questions if enabled
    let questions = quiz.questions
    if (quiz.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5)
    }

    // Shuffle options if enabled
    if (quiz.shuffleOptions) {
      questions = questions.map(q => {
        const options = Array.isArray(q.options) ? q.options : []
        return {
          ...q,
          options: [...options].sort(() => Math.random() - 0.5)
        }
      })
    }

    // Remove correct answers from options for security
    questions = questions.map(q => {
      const options = Array.isArray(q.options) ? q.options : []
      return {
        ...q,
        options: options.map((opt: any) => ({
          id: opt.id,
          text: opt.text
          // isCorrect is removed
        }))
      }
    })

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions,
        userAttempts,
        canAttempt: !quiz.maxAttempts || userAttempts < quiz.maxAttempts
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

// PUT /api/groups/[slug]/quizzes/[quizId] - Update quiz
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, quizId } = await params
    const body = await req.json()

    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const quiz = await prisma.groupQuiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz || quiz.groupId !== group.id) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check permissions
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    const canEdit = quiz.creatorId === session.user.id ||
      membership?.role && ['OWNER', 'ADMIN'].includes(membership.role) ||
      session.user.role === 'ADMIN'

    if (!canEdit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const {
      title,
      description,
      coverImage,
      passingScore,
      timeLimit,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      showResults,
      startDate,
      endDate,
      rewardPoints,
      rewardBadgeId,
      isActive,
      questions
    } = body

    // Update quiz
    const updatedQuiz = await prisma.groupQuiz.update({
      where: { id: quizId },
      data: {
        title,
        description,
        coverImage,
        passingScore,
        timeLimit,
        maxAttempts,
        shuffleQuestions,
        shuffleOptions,
        showResults,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        rewardPoints,
        rewardBadgeId,
        isActive
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        questions: true
      }
    })

    // If questions are provided, update them
    if (questions && Array.isArray(questions)) {
      // Delete existing questions
      await prisma.groupQuizQuestion.deleteMany({
        where: { quizId: quizId }
      })

      // Create new questions
      await prisma.groupQuizQuestion.createMany({
        data: questions.map((q: any, index: number) => ({
          quizId: quizId,
          question: q.question,
          questionType: q.questionType || 'MULTIPLE_CHOICE',
          options: q.options,
          explanation: q.explanation,
          points: q.points || 1,
          order: index,
          imageUrl: q.imageUrl
        }))
      })
    }

    return NextResponse.json({ quiz: updatedQuiz })
  } catch (error) {
    console.error('Update quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[slug]/quizzes/[quizId] - Delete quiz
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, quizId } = await params

    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const quiz = await prisma.groupQuiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz || quiz.groupId !== group.id) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check permissions
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    const canDelete = quiz.creatorId === session.user.id ||
      membership?.role && ['OWNER', 'ADMIN'].includes(membership.role) ||
      session.user.role === 'ADMIN'

    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    await prisma.groupQuiz.delete({
      where: { id: quizId }
    })

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    )
  }
}
