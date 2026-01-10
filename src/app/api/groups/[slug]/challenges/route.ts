import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[slug]/challenges - Get group challenges
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

    // Find group
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const now = new Date()
    let whereCondition: any = {
      groupId: group.id,
      isActive: true
    }

    if (status === 'active') {
      whereCondition = {
        ...whereCondition,
        startDate: { lte: now },
        endDate: { gte: now }
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

    const challenges = await prisma.groupChallenge.findMany({
      where: whereCondition,
      include: {
        participants: {
          orderBy: { progress: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    // Add user's progress to each challenge
    const challengesWithUserProgress = await Promise.all(
      challenges.map(async (challenge) => {
        const userProgress = await prisma.challengProgress.findUnique({
          where: {
            challengeId_userId: {
              challengeId: challenge.id,
              userId: session.user.id
            }
          }
        })

        return {
          ...challenge,
          userProgress: userProgress?.progress || 0,
          userCompleted: userProgress?.isCompleted || false,
          userRank: userProgress?.rank,
          isJoined: !!userProgress
        }
      })
    )

    return NextResponse.json({ challenges: challengesWithUserProgress })
  } catch (error) {
    console.error('Get challenges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[slug]/challenges - Create challenge
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
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check admin permission
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
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
      type, // MOST_POSTS, MOST_COMMENTS, QUIZ_SCORE, etc.
      target,
      startDate,
      endDate,
      rewardPoints = 50,
      rewardBadgeId
    } = body

    if (!title || !type || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const challenge = await prisma.groupChallenge.create({
      data: {
        groupId: group.id,
        title,
        description,
        type,
        target,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rewardPoints,
        rewardBadgeId
      }
    })

    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    console.error('Create challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    )
  }
}
