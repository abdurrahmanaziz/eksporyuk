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

    // Build where condition
    let where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status
    }

    if (search) {
      where.OR = [
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          membership: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    // Fetch user memberships with pagination
    const userMemberships = await prisma.userMembership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        membership: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        },
        transaction: {
          select: {
            id: true,
            amount: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

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
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        membership: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      }
    })

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
      userMembership: newUserMembership
    })

  } catch (error) {
    console.error('Error creating user membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
