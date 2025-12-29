import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const userId = params.id
    console.log('[MEMBERSHIPS API] Fetching memberships for user:', userId)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch wallet safely
    let wallet = null
    try {
      wallet = await prisma.wallet.findUnique({
        where: { userId: userId }
      })
    } catch (error) {
      console.log('[MEMBERSHIPS API] Wallet fetch error (non-critical):', error.message)
    }

    // Fetch transaction count safely  
    let transactionCount = 0
    try {
      transactionCount = await prisma.transaction.count({
        where: { userId: userId }
      })
    } catch (error) {
      console.log('[MEMBERSHIPS API] Transaction count error (non-critical):', error.message)
    }

    // Fetch user memberships safely
    let userMemberships = []
    try {
      userMemberships = await prisma.userMembership.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.log('[MEMBERSHIPS API] User memberships error (non-critical):', error.message)
    }

    // Fetch membership details safely
    let userMembershipsWithDetails = []
    if (userMemberships.length > 0) {
      try {
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
        
        const membershipMap = new Map(memberships.map(m => [m.id, m]))
        userMembershipsWithDetails = userMemberships.map(um => ({
          id: um.id,
          userId: um.userId,
          membershipId: um.membershipId,
          status: um.status,
          isActive: um.isActive,
          startDate: um.startDate?.toISOString() || null,
          endDate: um.endDate?.toISOString() || null,
          createdAt: um.createdAt?.toISOString() || null,
          updatedAt: um.updatedAt?.toISOString() || null,
          membership: membershipMap.get(um.membershipId) ? {
            id: membershipMap.get(um.membershipId).id,
            name: membershipMap.get(um.membershipId).name,
            price: membershipMap.get(um.membershipId).price ? Number(membershipMap.get(um.membershipId).price) : null,
            duration: membershipMap.get(um.membershipId).duration,
            durationType: membershipMap.get(um.membershipId).durationType,
            isActive: membershipMap.get(um.membershipId).isActive
          } : null
        }))
        
      } catch (error) {
        console.log('[MEMBERSHIPS API] Membership details error (non-critical):', error.message)
        userMembershipsWithDetails = userMemberships.map(um => ({
          ...um,
          membership: null,
          startDate: um.startDate?.toISOString() || null,
          endDate: um.endDate?.toISOString() || null,
          createdAt: um.createdAt?.toISOString() || null,
          updatedAt: um.updatedAt?.toISOString() || null
        }))
      }
    }

    const responseData = {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        userMemberships: userMembershipsWithDetails,
        wallet: wallet ? {
          id: wallet.id,
          balance: wallet.balance ? Number(wallet.balance) : 0,
          balancePending: wallet.balancePending ? Number(wallet.balancePending) : 0
        } : null,
        _count: { transactions: transactionCount }
      }
    }
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('[MEMBERSHIPS API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      userId: params.id
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    const body = await request.json()
    const { membershipId, startDate, endDate, status = 'ACTIVE' } = body

    console.log('[MEMBERSHIPS API] Adding membership:', { userId, membershipId, status })

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if membership exists
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: { id: true, name: true, duration: true, durationType: true }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Create user membership
    const userMembership = await prisma.userMembership.create({
      data: {
        id: `usermem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        membershipId,
        status,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: status === 'ACTIVE'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Membership added successfully',
      userMembership
    })

  } catch (error) {
    console.error('[MEMBERSHIPS API] Add membership error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}