import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const userId = params.id
    console.log('[MEMBERSHIPS API] Fetching memberships for user:', userId)

    // First check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!userExists) {
      console.log('[MEMBERSHIPS API] User not found:', userId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[MEMBERSHIPS API] User found:', userExists)

    // Fetch user with memberships and related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        _count: {
          select: {
            transactions: true
          }
        }
      }
    })

    console.log('[MEMBERSHIPS API] User found, now fetching memberships...')

    // Fetch user memberships separately
    const userMemberships = await prisma.userMembership.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    })

    console.log('[MEMBERSHIPS API] User memberships count:', userMemberships.length)

    // Get membership details for each user membership
    const membershipIds = userMemberships.map(um => um.membershipId)
    const memberships = await prisma.membership.findMany({
      where: { id: { in: membershipIds } },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        durationType: true,
        features: true,
        isActive: true
      }
    })

    // Combine user memberships with membership details
    const membershipMap = new Map(memberships.map(m => [m.id, m]))
    const userMembershipsWithDetails = userMemberships.map(um => ({
      ...um,
      membership: membershipMap.get(um.membershipId)
    }))

    // Add memberships to user object
    const userWithMemberships = {
      ...user,
      userMemberships: userMembershipsWithDetails
    }

    console.log('[MEMBERSHIPS API] User memberships count:', userMembershipsWithDetails.length || 0)

    return NextResponse.json({
      success: true,
      user: userWithMemberships
    })
  } catch (error) {
    console.error('[MEMBERSHIPS API] Error details:', {
      message: error.message,
      stack: error.stack,
      userId: params.id
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const userId = params.id
    const body = await request.json()
    const { membershipId, startDate, endDate, status = 'ACTIVE' } = body

    console.log('[MEMBERSHIPS API] Adding membership to user:', { userId, membershipId, status })

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if membership exists
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: { id: true, name: true, duration: true, durationType: true }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    // Check if user already has this membership
    const existingUserMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        membershipId,
        status: 'ACTIVE'
      }
    })

    if (existingUserMembership) {
      return NextResponse.json(
        { error: 'User already has this active membership' },
        { status: 400 }
      )
    }

    // Calculate end date if not provided
    let calculatedEndDate = endDate
    if (!calculatedEndDate && startDate) {
      const start = new Date(startDate)
      const duration = membership.duration
      const durationType = membership.durationType
      
      if (durationType === 'MONTHS') {
        start.setMonth(start.getMonth() + duration)
      } else if (durationType === 'DAYS') {
        start.setDate(start.getDate() + duration)
      } else if (durationType === 'LIFETIME') {
        // Set to far future date for lifetime
        start.setFullYear(start.getFullYear() + 100)
      }
      calculatedEndDate = start.toISOString()
    }

    // Create user membership
    const userMembership = await prisma.userMembership.create({
      data: {
        userId,
        membershipId,
        status,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: calculatedEndDate ? new Date(calculatedEndDate) : null,
        isActive: status === 'ACTIVE'
      }
    })

    // Get membership details separately
    const membershipDetails = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        durationType: true
      }
    })

    console.log('[MEMBERSHIPS API] Membership added successfully:', userMembership.id)

    return NextResponse.json({
      success: true,
      message: 'Membership added successfully',
      userMembership: {
        ...userMembership,
        membership: membershipDetails
      }
    })

  } catch (error) {
    console.error('[MEMBERSHIPS API] Add membership error:', {
      message: error.message,
      stack: error.stack,
      userId: params.id
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
