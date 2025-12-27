import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

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

    // AffiliateChallenge model has no relations - fetch challenges first, then related data separately
    const [challenges, total] = await Promise.all([
      prisma.affiliateChallenge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.affiliateChallenge.count({ where })
    ])

    // Get related data separately
    const membershipIds = [...new Set(challenges.filter(c => c.membershipId).map(c => c.membershipId!))]
    const productIds = [...new Set(challenges.filter(c => c.productId).map(c => c.productId!))]
    const courseIds = [...new Set(challenges.filter(c => c.courseId).map(c => c.courseId!))]
    const challengeIds = challenges.map(c => c.id)
    
    const [memberships, products, courses, progressCounts] = await Promise.all([
      membershipIds.length > 0 ? prisma.membership.findMany({
        where: { id: { in: membershipIds } },
        select: { id: true, name: true, slug: true }
      }) : Promise.resolve([]),
      productIds.length > 0 ? prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, slug: true }
      }) : Promise.resolve([]),
      courseIds.length > 0 ? prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true, slug: true }
      }) : Promise.resolve([]),
      challengeIds.length > 0 ? prisma.affiliateChallengeProgress.groupBy({
        by: ['challengeId'],
        where: { challengeId: { in: challengeIds } },
        _count: true
      }) : Promise.resolve([])
    ])
    
    const membershipMap = new Map(memberships.map(m => [m.id, m]))
    const productMap = new Map(products.map(p => [p.id, p]))
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const progressCountMap = new Map(progressCounts.map(p => [p.challengeId, p._count]))

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
        
        const participantsCount = progressCountMap.get(challenge.id) || 0

        return {
          ...challenge,
          targetValue: Number(challenge.targetValue),
          rewardValue: Number(challenge.rewardValue),
          membership: challenge.membershipId ? membershipMap.get(challenge.membershipId) || null : null,
          product: challenge.productId ? productMap.get(challenge.productId) || null : null,
          course: challenge.courseId ? courseMap.get(challenge.courseId) || null : null,
          _count: { progress: participantsCount },
          participantsCount,
          completedCount,
          claimedCount,
          averageProgress: Number(totalProgress._avg.currentValue || 0),
          totalProgressSum: Number(totalProgress._sum.currentValue || 0),
          status: isOngoing ? 'active' : isUpcoming ? 'upcoming' : 'ended',
          completionRate: participantsCount > 0 
            ? ((completedCount / participantsCount) * 100).toFixed(1)
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
        id: createId(),
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
        courseId: courseId || null,
        updatedAt: new Date(),
      }
    })

    // Fetch related data manually
    const [membership, product, course] = await Promise.all([
      membershipId ? prisma.membership.findUnique({ where: { id: membershipId }, select: { id: true, name: true, slug: true } }) : null,
      productId ? prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, slug: true } }) : null,
      courseId ? prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, slug: true } }) : null
    ])

    return NextResponse.json({
      message: 'Challenge created successfully',
      challenge: {
        ...challenge,
        membership,
        product,
        course,
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
