import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/user/memberships
 * Get current user's active memberships (alias for /api/memberships/user)
 * This endpoint exists for backward compatibility
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    // Fetch all user's memberships (active and inactive)
    const userMemberships = await prisma.userMembership.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!userMemberships.length) {
      return NextResponse.json({
        memberships: [],
        activeMembership: null,
        message: 'No memberships found'
      })
    }

    // Get all membership IDs
    const membershipIds = [...new Set(userMemberships.map(um => um.membershipId))]
    
    // Fetch membership details
    const membershipPlans = await prisma.membership.findMany({
      where: { id: { in: membershipIds } }
    })
    
    const membershipMap = new Map(membershipPlans.map(m => [m.id, m]))

    // Find active membership
    const now = new Date()
    const activeMembership = userMemberships.find(um => 
      um.status === 'ACTIVE' && new Date(um.endDate) >= now
    )

    // Enrich memberships with plan data
    const enrichedMemberships = userMemberships.map(um => {
      const plan = membershipMap.get(um.membershipId)
      const endDate = new Date(um.endDate)
      const daysRemaining = um.status === 'ACTIVE' 
        ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        id: um.id,
        membershipId: um.membershipId,
        startDate: um.startDate,
        endDate: um.endDate,
        status: um.status,
        isActive: um.isActive,
        daysRemaining: Math.max(0, daysRemaining),
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          tier: plan.tier,
          duration: plan.duration,
          price: Number(plan.price),
          features: plan.features,
        } : null
      }
    })

    // Get active membership details
    let activeMembershipData = null
    if (activeMembership) {
      const plan = membershipMap.get(activeMembership.membershipId)
      const endDate = new Date(activeMembership.endDate)
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      activeMembershipData = {
        id: activeMembership.id,
        membershipId: activeMembership.membershipId,
        startDate: activeMembership.startDate,
        endDate: activeMembership.endDate,
        status: activeMembership.status,
        isActive: activeMembership.isActive,
        daysRemaining: Math.max(0, daysRemaining),
        isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
        isLifetime: plan?.duration === 'LIFETIME',
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          tier: plan.tier,
          duration: plan.duration,
          price: Number(plan.price),
          features: plan.features,
        } : null
      }
    }

    return NextResponse.json({
      memberships: enrichedMemberships,
      activeMembership: activeMembershipData,
      hasMembership: !!activeMembership,
    })

  } catch (error: any) {
    console.error('Error fetching user memberships:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
