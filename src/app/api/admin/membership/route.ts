import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { autoAssignMembershipFeatures } from '@/lib/membership-features'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch all user memberships with stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build base where condition for status
    let baseWhere: any = {}
    
    if (status && status !== 'ALL') {
      baseWhere.status = status
    }

    // For search, we need to find matching users and memberships first
    let userIds: string[] | undefined
    let membershipIds: string[] | undefined

    if (search) {
      // Find matching users
      const matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        },
        select: { id: true }
      })
      userIds = matchingUsers.map(u => u.id)

      // Find matching memberships
      const matchingMemberships = await prisma.membership.findMany({
        where: {
          name: { contains: search, mode: 'insensitive' }
        },
        select: { id: true }
      })
      membershipIds = matchingMemberships.map(m => m.id)
    }

    // Build final where with search results
    let where: any = { ...baseWhere }
    if (search && (userIds?.length || membershipIds?.length)) {
      where.OR = []
      if (userIds?.length) {
        where.OR.push({ userId: { in: userIds } })
      }
      if (membershipIds?.length) {
        where.OR.push({ membershipId: { in: membershipIds } })
      }
    } else if (search) {
      // No matches found for search, return empty
      where.id = 'no-match'
    }

    // Fetch user memberships with pagination (without relations)
    const rawUserMemberships = await prisma.userMembership.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Collect unique IDs for batch lookup
    const allUserIds = [...new Set(rawUserMemberships.map(um => um.userId))]
    const allMembershipIds = [...new Set(rawUserMemberships.map(um => um.membershipId))]
    const allTransactionIds = rawUserMemberships
      .filter(um => um.transactionId)
      .map(um => um.transactionId as string)

    // Batch fetch users, memberships, and transactions
    const [users, memberships, transactions] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: { id: true, name: true, email: true, avatar: true }
      }),
      prisma.membership.findMany({
        where: { id: { in: allMembershipIds } },
        select: { id: true, name: true, duration: true, price: true }
      }),
      allTransactionIds.length > 0 
        ? prisma.transaction.findMany({
            where: { id: { in: allTransactionIds } },
            select: { id: true, amount: true, status: true }
          })
        : Promise.resolve([])
    ])

    // Create lookup maps
    const userMap = new Map(users.map(u => [u.id, u]))
    const membershipMap = new Map(memberships.map(m => [m.id, m]))
    const transactionMap = new Map(transactions.map(t => [t.id, t]))

    // Combine data
    const userMemberships = rawUserMemberships.map(um => ({
      ...um,
      user: userMap.get(um.userId) || null,
      membership: membershipMap.get(um.membershipId) || null,
      transaction: um.transactionId ? (transactionMap.get(um.transactionId) || null) : null
    }))

    // Get stats
    const [totalCount, activeCount, expiredCount, pendingCount, totalRevenue] = await Promise.all([
      prisma.userMembership.count({ where }),
      prisma.userMembership.count({ 
        where: { ...where, status: 'ACTIVE' }
      }),
      prisma.userMembership.count({ 
        where: { ...where, status: 'EXPIRED' }
      }),
      prisma.userMembership.count({ 
        where: { ...where, status: 'PENDING' }
      }),
      prisma.userMembership.aggregate({
        where: { status: 'ACTIVE' },
        _sum: {
          price: true
        }
      })
    ])

    // Calculate expired memberships (where endDate < now but status != EXPIRED)
    const now = new Date()
    const expiredButNotMarked = await prisma.userMembership.count({
      where: {
        endDate: { lt: now },
        status: { not: 'EXPIRED' }
      }
    })

    const stats = {
      total: totalCount,
      active: activeCount,
      expired: expiredCount + expiredButNotMarked,
      pending: pendingCount,
      revenue: totalRevenue._sum.price || 0
    }

    return NextResponse.json({
      userMemberships,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching memberships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new user membership (manual assignment)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, membershipId, startDate, endDate, price, autoRenew = false } = body

    // Validate required fields
    if (!userId || !membershipId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, membershipId' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if membership plan exists
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership plan not found' }, { status: 404 })
    }

    // Check if user already has this membership
    const existingMembership = await prisma.userMembership.findUnique({
      where: {
        userId_membershipId: {
          userId,
          membershipId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User already has this membership' },
        { status: 400 }
      )
    }

    // Calculate dates if not provided
    const start = startDate ? new Date(startDate) : new Date()
    let end = endDate ? new Date(endDate) : new Date()

    if (!endDate) {
      // Calculate based on membership duration
      const durationDays = 
        membership.duration === 'LIFETIME' ? 36500 : 
        membership.duration === 'TWELVE_MONTHS' ? 365 :
        membership.duration === 'SIX_MONTHS' ? 180 :
        membership.duration === 'THREE_MONTHS' ? 90 : 30
      end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000)
    }

    // 🔒 DEACTIVATE OLD MEMBERSHIPS - User can only have 1 active membership
    await prisma.userMembership.updateMany({
      where: { 
        userId: userId,
        isActive: true 
      },
      data: { 
        isActive: false,
        status: 'EXPIRED'
      }
    })

    // Create user membership
    const newUserMembership = await prisma.userMembership.create({
      data: {
        userId,
        membershipId,
        startDate: start,
        endDate: end,
        status: 'ACTIVE',
        isActive: true,
        activatedAt: new Date(),
        price: price || membership.price,
        autoRenew
      }
    })

    // Fetch user data manually for response
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatar: true }
    })

    const membershipData = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: { id: true, name: true, duration: true, price: true }
    })

    const responseData = {
      ...newUserMembership,
      user: userData,
      membership: membershipData
    }

    // Auto-assign membership features
    try {
      const featureResults = await autoAssignMembershipFeatures(userId, membershipId)
      console.log(`Features assigned for membership ${membershipId}:`, featureResults)
    } catch (featureError) {
      console.error('Error assigning membership features:', featureError)
      // Don't fail the membership creation if feature assignment fails
    }

    return NextResponse.json({
      message: 'User membership created successfully',
      userMembership: responseData
    })

  } catch (error) {
    console.error('Error creating user membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
