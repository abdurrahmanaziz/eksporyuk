import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    // Get challenge - AffiliateChallenge has no relations
    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Get all progress entries for leaderboard (AffiliateChallengeProgress has no relations)
    const progressEntries = await prisma.affiliateChallengeProgress.findMany({
      where: { challengeId: id },
      orderBy: { currentValue: 'desc' }
    })

    // Get affiliate and user data separately
    const affiliateIds = progressEntries.map(p => p.affiliateId)
    const affiliates = affiliateIds.length > 0 ? await prisma.affiliateProfile.findMany({
      where: { id: { in: affiliateIds } }
    }) : []
    const userIds = affiliates.map(a => a.userId)
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true }
    }) : []

    const affiliateMap = new Map(affiliates.map(a => [a.id, a]))
    const userMap = new Map(users.map(u => [u.id, u]))

    // Find user's progress
    const userProgress = progressEntries.find(p => p.affiliateId === affiliateProfile.id)
    const userRank = userProgress
      ? progressEntries.findIndex(p => p.affiliateId === affiliateProfile.id) + 1
      : null

    // Format leaderboard
    const leaderboard = progressEntries.map((entry, idx) => {
      const affiliate = affiliateMap.get(entry.affiliateId)
      const user = affiliate ? userMap.get(affiliate.userId) : null
      return {
        rank: idx + 1,
        affiliateId: entry.affiliateId,
        userId: user?.id || null,
        name: user?.name || 'Unknown',
        avatar: user?.avatar || null,
        currentValue: Number(entry.currentValue),
        completed: entry.completed,
        completedAt: entry.completedAt,
        isCurrentUser: entry.affiliateId === affiliateProfile.id
      }
    })

    return NextResponse.json({
      challenge,
      userProgress: userProgress ? {
        currentValue: Number(userProgress.currentValue),
        completed: userProgress.completed,
        completedAt: userProgress.completedAt,
        rewardClaimed: userProgress.rewardClaimed
      } : null,
      userRank,
      leaderboard,
      participantsCount: progressEntries.length
    })
  } catch (error) {
    console.error('Get challenge detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    )
  }
}
