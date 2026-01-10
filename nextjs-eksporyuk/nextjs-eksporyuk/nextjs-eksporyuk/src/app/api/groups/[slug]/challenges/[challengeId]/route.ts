import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/groups/[slug]/challenges/[challengeId]/join - Join a challenge
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; challengeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, challengeId } = await params

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

    if (!membership) {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 })
    }

    // Find challenge
    const challenge = await prisma.groupChallenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge || challenge.groupId !== group.id || !challenge.isActive) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Check if challenge is active
    const now = new Date()
    if (challenge.startDate > now) {
      return NextResponse.json({ error: 'Challenge has not started yet' }, { status: 400 })
    }
    if (challenge.endDate < now) {
      return NextResponse.json({ error: 'Challenge has ended' }, { status: 400 })
    }

    // Check if already joined
    const existingProgress = await prisma.challengProgress.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: session.user.id
        }
      }
    })

    if (existingProgress) {
      return NextResponse.json({ error: 'Already joined this challenge' }, { status: 400 })
    }

    // Join the challenge
    const progress = await prisma.challengProgress.create({
      data: {
        challengeId,
        userId: session.user.id,
        progress: 0
      }
    })

    return NextResponse.json({
      progress,
      message: 'Successfully joined the challenge!'
    }, { status: 201 })
  } catch (error) {
    console.error('Join challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    )
  }
}

// GET /api/groups/[slug]/challenges/[challengeId]/leaderboard - Get challenge leaderboard
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; challengeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, challengeId } = await params

    // Find group
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Find challenge
    const challenge = await prisma.groupChallenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge || challenge.groupId !== group.id) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Get leaderboard
    const leaderboard = await prisma.challengProgress.findMany({
      where: { challengeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { progress: 'desc' }
    })

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

    // Get user's position
    const userEntry = rankedLeaderboard.find(e => e.userId === session.user.id)

    return NextResponse.json({
      challenge,
      leaderboard: rankedLeaderboard,
      userRank: userEntry?.rank,
      userProgress: userEntry?.progress || 0,
      totalParticipants: leaderboard.length
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
