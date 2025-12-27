import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[slug]/quizzes - Get group quizzes
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // active, upcoming, ended

    // Find group by slug
    const group = await prisma.group.findFirst({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is member
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: session.user.id
      }
    })

    if (!membership && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 })
    }

    const now = new Date()
    let whereCondition: any = {
      groupId: group.id,
      isActive: true
    }

    if (status === 'active') {
      whereCondition = {
        ...whereCondition,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } }
        ]
      }
    } else if (status === 'upcoming') {
      whereCondition = {
        ...whereCondition,
        startDate: { gt: now }
      }
    } else if (status === 'ended') {
      whereCondition = {
        ...whereCondition,
        endDate: { lt: now }
      }
    }

    const quizzes = await prisma.groupQuiz.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' }
    })

    // Get user's attempts for each quiz
    const quizzesWithAttempts = await Promise.all(
      quizzes.map(async (quiz) => {
        const userAttempts = await prisma.groupQuizAttempt.findMany({
          where: {
            quizId: quiz.id,
            userId: session.user.id
          },
          orderBy: { startedAt: 'desc' }
        })

        const bestAttempt = userAttempts.find(a => a.isCompleted && a.isPassed) ||
          userAttempts.reduce((best, curr) => 
            (curr.score > (best?.score || 0)) ? curr : best, 
            null as any
          )

        return {
          ...quiz,
          userAttempts: userAttempts.length,
          bestScore: bestAttempt?.percentage || 0,
          hasPassed: userAttempts.some(a => a.isPassed),
          canAttempt: quiz.maxAttempts === null || userAttempts.length < quiz.maxAttempts
        }
      })
    )

    return NextResponse.json({ quizzes: quizzesWithAttempts })
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[slug]/quizzes - Create new quiz
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await req.json()

    // Find group
    const group = await prisma.group.findFirst({
      where: { slug },
      select: { id: true, ownerId: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is admin/moderator
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: session.user.id
      }
    })

    const canCreate = membership?.role && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role) || 
      session.user.role === 'ADMIN'

    if (!canCreate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const {
      title,
      description,
      coverImage,
      passingScore = 70,
      timeLimit,
      maxAttempts = 1,
      shuffleQuestions = true,
      shuffleOptions = true,
      showResults = true,
      startDate,
      endDate,
      rewardPoints = 10,
      rewardBadgeId,
      questions = []
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 })
    }

    // Create quiz first
    const quiz = await prisma.groupQuiz.create({
      data: {
        id: createId(),
        groupId: group.id,
        creatorId: session.user.id,
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
        updatedAt: new Date(),
      }
    })

    // Create questions separately
    const createdQuestions = await Promise.all(
      questions.map((q: any, index: number) =>
        prisma.groupQuizQuestion.create({
          data: {
            id: createId(),
            quizId: quiz.id,
            question: q.question,
            questionType: q.questionType || 'MULTIPLE_CHOICE',
            options: q.options,
            explanation: q.explanation,
            points: q.points || 1,
            order: index,
            imageUrl: q.imageUrl,
            updatedAt: new Date(),
          }
        })
      )
    )

    const quizWithQuestions = {
      ...quiz,
      questions: createdQuestions
    }

    return NextResponse.json({ quiz: quizWithQuestions }, { status: 201 })
  } catch (error) {
    console.error('Create quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    )
  }
}
