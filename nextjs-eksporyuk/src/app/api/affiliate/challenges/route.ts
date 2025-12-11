import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/affiliate/challenges - Get all challenges with user progress
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // active, upcoming, ended, all
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const now = new Date()
    let whereCondition: any = {}

    if (status === 'active') {
      whereCondition = {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    } else if (status === 'upcoming') {
      whereCondition = {
        isActive: true,
        startDate: { gt: now }
      }
    } else if (status === 'ended') {
      whereCondition = {
        endDate: { lt: now }
      }
    } else {
      whereCondition = {
        isActive: true
      }
    }

    // Get all challenges
    const challenges = await prisma.affiliateChallenge.findMany({
      where: whereCondition,
      include: {
        membership: {
          select: { id: true, name: true, slug: true, checkoutSlug: true }
        },
        product: {
          select: { id: true, name: true, slug: true, checkoutSlug: true }
        },
        course: {
          select: { id: true, title: true, slug: true, checkoutSlug: true }
        },
        progress: {
          where: { affiliateId: affiliateProfile.id },
          take: 1
        },
        _count: {
          select: {
            progress: true
          }
        }
      },
      orderBy: { startDate: 'desc' },
      ...(limit && { take: limit })
    })

    // Get leaderboard for each challenge (top 10)
    const challengesWithLeaderboard = await Promise.all(
      challenges.map(async (challenge) => {
        const leaderboard = await prisma.affiliateChallengeProgress.findMany({
          where: { challengeId: challenge.id },
          orderBy: { currentValue: 'desc' },
          take: 10,
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
        })

        // Get user's rank
        let userRank = null
        const userProgress = (challenge as any).progress[0]
        if (userProgress) {
          const higherRanked = await prisma.affiliateChallengeProgress.count({
            where: {
              challengeId: challenge.id,
              currentValue: { gt: userProgress.currentValue }
            }
          })
          userRank = higherRanked + 1
        }

        // Get affiliate link for this product/membership/course
        let affiliateLink = null
        let linkTarget = null
        
        if (challenge.membershipId) {
          const existingLink = await prisma.affiliateLink.findFirst({
            where: {
              affiliateId: affiliateProfile.id,
              membershipId: challenge.membershipId
            }
          })
          if (existingLink) {
            affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL}/go/${existingLink.shortCode}`
          }
          linkTarget = {
            type: 'membership',
            id: challenge.membershipId,
            name: (challenge as any).membership?.name,
            slug: (challenge as any).membership?.checkoutSlug || (challenge as any).membership?.slug
          }
        } else if (challenge.productId) {
          const existingLink = await prisma.affiliateLink.findFirst({
            where: {
              affiliateId: affiliateProfile.id,
              productId: challenge.productId
            }
          })
          if (existingLink) {
            affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL}/go/${existingLink.shortCode}`
          }
          linkTarget = {
            type: 'product',
            id: challenge.productId,
            name: (challenge as any).product?.name,
            slug: (challenge as any).product?.checkoutSlug || (challenge as any).product?.slug
          }
        } else if (challenge.courseId) {
          const existingLink = await prisma.affiliateLink.findFirst({
            where: {
              affiliateId: affiliateProfile.id,
              courseId: challenge.courseId
            }
          })
          if (existingLink) {
            affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL}/go/${existingLink.shortCode}`
          }
          linkTarget = {
            type: 'course',
            id: challenge.courseId,
            name: (challenge as any).course?.title,
            slug: (challenge as any).course?.checkoutSlug || (challenge as any).course?.slug
          }
        }

        return {
          ...challenge,
          hasJoined: !!userProgress, // Explicit hasJoined flag
          userProgress: userProgress ? {
            currentValue: Number(userProgress.currentValue),
            progress: (Number(userProgress.currentValue) / Number(challenge.targetValue)) * 100,
            completed: userProgress.completed,
            rewardClaimed: userProgress.rewardClaimed
          } : null,
          userRank,
          affiliateLink,
          linkTarget,
          leaderboard: leaderboard.map((entry, idx) => ({
            rank: idx + 1,
            affiliateId: entry.affiliateId,
            name: entry.affiliate.user.name,
            avatar: entry.affiliate.user.avatar,
            currentValue: Number(entry.currentValue),
            completed: entry.completed
          })),
          participantsCount: (challenge as any)._count.progress,
          status: challenge.startDate > now ? 'upcoming' : challenge.endDate < now ? 'ended' : 'active',
          daysRemaining: Math.ceil((challenge.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }
      })
    )

    return NextResponse.json({ challenges: challengesWithLeaderboard })
  } catch (error) {
    console.error('Get affiliate challenges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

// POST /api/affiliate/challenges - Join a challenge
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId } = body

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID required' }, { status: 400 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Check if challenge exists and is active
    const challenge = await prisma.affiliateChallenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    const now = new Date()
    if (!challenge.isActive || challenge.startDate > now || challenge.endDate < now) {
      return NextResponse.json({ error: 'Challenge is not available' }, { status: 400 })
    }

    // Check if already joined
    const existingProgress = await prisma.affiliateChallengeProgress.findUnique({
      where: {
        challengeId_affiliateId: {
          challengeId,
          affiliateId: affiliateProfile.id
        }
      }
    })

    if (existingProgress) {
      return NextResponse.json({ error: 'Already joined this challenge' }, { status: 400 })
    }

    // Join challenge
    const progress = await prisma.affiliateChallengeProgress.create({
      data: {
        challengeId,
        affiliateId: affiliateProfile.id,
        currentValue: 0
      }
    })

    return NextResponse.json({ progress }, { status: 201 })
  } catch (error) {
    console.error('Join challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    )
  }
}
