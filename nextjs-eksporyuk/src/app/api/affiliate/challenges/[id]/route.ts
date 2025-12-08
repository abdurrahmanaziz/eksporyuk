import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/affiliate/challenges/[id] - Get challenge detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Get challenge with full leaderboard
    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id },
      include: {
        progress: {
          orderBy: { currentValue: 'desc' },
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Find user's progress
    const userProgress = challenge.progress.find(p => p.affiliateId === affiliateProfile.id)
    const userRank = userProgress
      ? challenge.progress.findIndex(p => p.affiliateId === affiliateProfile.id) + 1
      : null

    // Format leaderboard
    const leaderboard = challenge.progress.map((entry, idx) => ({
      rank: idx + 1,
      affiliateId: entry.affiliateId,
      userId: entry.affiliate.user.id,
      name: entry.affiliate.user.name,
      avatar: entry.affiliate.user.avatar,
      currentValue: Number(entry.currentValue),
      completed: entry.completed,
      completedAt: entry.completedAt,
      isCurrentUser: entry.affiliateId === affiliateProfile.id
    }))

    return NextResponse.json({
      challenge: {
        ...challenge,
        progress: undefined // Remove raw progress
      },
      userProgress: userProgress ? {
        currentValue: Number(userProgress.currentValue),
        completed: userProgress.completed,
        completedAt: userProgress.completedAt,
        rewardClaimed: userProgress.rewardClaimed
      } : null,
      userRank,
      leaderboard,
      participantsCount: challenge.progress.length
    })
  } catch (error) {
    console.error('Get challenge detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    )
  }
}
