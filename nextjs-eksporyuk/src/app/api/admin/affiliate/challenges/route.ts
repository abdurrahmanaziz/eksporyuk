import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/affiliate/challenges - List all affiliate challenges (admin)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all' // all, active, upcoming, ended
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const now = new Date()
    let where: any = {}

    if (status === 'active') {
      where = {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    } else if (status === 'upcoming') {
      where = {
        startDate: { gt: now }
      }
    } else if (status === 'ended') {
      where = {
        endDate: { lt: now }
      }
    }

    const [challenges, total] = await Promise.all([
      prisma.affiliateChallenge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { progress: true }
          },
          membership: {
            select: { id: true, name: true, slug: true }
          },
          product: {
            select: { id: true, name: true, slug: true }
          },
          course: {
            select: { id: true, title: true, slug: true }
          }
        }
      }),
      prisma.affiliateChallenge.count({ where })
    ])

    // Get completion stats for each challenge
    const challengesWithStats = await Promise.all(
      challenges.map(async (challenge) => {
        const [completedCount, claimedCount, totalProgress] = await Promise.all([
          prisma.affiliateChallengeProgress.count({
            where: { challengeId: challenge.id, completed: true }
          }),
          prisma.affiliateChallengeProgress.count({
            where: { challengeId: challenge.id, rewardClaimed: true }
          }),
          prisma.affiliateChallengeProgress.aggregate({
            where: { challengeId: challenge.id },
            _sum: { currentValue: true },
            _avg: { currentValue: true }
          })
        ])

        const isOngoing = challenge.isActive && 
          challenge.startDate <= now && 
          challenge.endDate >= now
        
        const isUpcoming = challenge.startDate > now
        const hasEnded = challenge.endDate < now

        return {
          ...challenge,
          targetValue: Number(challenge.targetValue),
          rewardValue: Number(challenge.rewardValue),
          participantsCount: challenge._count.progress,
          completedCount,
          claimedCount,
          averageProgress: Number(totalProgress._avg.currentValue || 0),
          totalProgressSum: Number(totalProgress._sum.currentValue || 0),
          status: isOngoing ? 'active' : isUpcoming ? 'upcoming' : 'ended',
          completionRate: challenge._count.progress > 0 
            ? ((completedCount / challenge._count.progress) * 100).toFixed(1)
            : '0.0'
        }
      })
    )

    return NextResponse.json({
      challenges: challengesWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin get challenges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

// POST /api/admin/affiliate/challenges - Create new challenge
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      description,
      targetType,
      targetValue,
      rewardType,
      rewardValue,
      startDate,
      endDate,
      isActive = true,
      membershipId,
      productId,
      courseId
    } = body

    // Validation
    if (!title || !description || !targetType || !targetValue || !rewardType || !rewardValue || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate target type
    const validTargetTypes = ['SALES_COUNT', 'REVENUE', 'CLICKS', 'CONVERSIONS', 'NEW_CUSTOMERS']
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: `Invalid target type. Must be one of: ${validTargetTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate reward type
    const validRewardTypes = ['BONUS_COMMISSION', 'TIER_UPGRADE', 'CASH_BONUS']
    if (!validRewardTypes.includes(rewardType)) {
      return NextResponse.json(
        { error: `Invalid reward type. Must be one of: ${validRewardTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const challenge = await prisma.affiliateChallenge.create({
      data: {
        title,
        description,
        targetType,
        targetValue: parseFloat(targetValue),
        rewardType,
        rewardValue: parseFloat(rewardValue),
        startDate: start,
        endDate: end,
        isActive,
        membershipId: membershipId || null,
        productId: productId || null,
        courseId: courseId || null
      },
      include: {
        membership: {
          select: { id: true, name: true, slug: true }
        },
        product: {
          select: { id: true, name: true, slug: true }
        },
        course: {
          select: { id: true, title: true, slug: true }
        }
      }
    })

    return NextResponse.json({
      message: 'Challenge created successfully',
      challenge: {
        ...challenge,
        targetValue: Number(challenge.targetValue),
        rewardValue: Number(challenge.rewardValue)
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Create challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    )
  }
}
