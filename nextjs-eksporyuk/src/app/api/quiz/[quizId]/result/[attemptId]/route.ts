import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/quiz/[quizId]/result/[attemptId] - Get quiz attempt result
export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string; attemptId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { attemptId } = params

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true
          }
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                type: true,
                question: true,
                points: true,
                options: true,
                explanation: true
              }
            }
          },
          orderBy: {
            question: {
              order: 'asc'
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      )
    }

    // Check permissions: owner, admin, or mentor
    const isOwner = attempt.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    const isMentor = session.user.role === 'MENTOR'

    if (!isOwner && !isAdmin && !isMentor) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(attempt)
  } catch (error) {
    console.error('Get quiz result error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
