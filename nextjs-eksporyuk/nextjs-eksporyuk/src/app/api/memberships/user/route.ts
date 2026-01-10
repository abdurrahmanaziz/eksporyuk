import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/memberships/user
 * Get current user's active membership with full details
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

    // Fetch user's active membership
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        endDate: {
          gte: new Date() // Not expired
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!userMembership) {
      return NextResponse.json({
        hasMembership: false,
        message: 'No active membership found'
      })
    }

    // Fetch membership details separately (no relation in schema)
    const membershipPlan = await prisma.membership.findUnique({
      where: { id: userMembership.membershipId }
    })

    if (!membershipPlan) {
      return NextResponse.json({
        hasMembership: false,
        message: 'Membership plan not found'
      })
    }

    // Calculate days remaining
    const now = new Date()
    const endDate = new Date(userMembership.endDate)
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Check if expiring soon (within 7 days)
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0
    const isLifetime = membershipPlan.duration === 'LIFETIME'

    // Parse features from JSON
    const features = Array.isArray(membershipPlan.features) 
      ? membershipPlan.features 
      : []

    // Format response
    const response = {
      hasMembership: true,
      membership: {
        id: userMembership.id,
        startDate: userMembership.startDate,
        endDate: userMembership.endDate,
        status: userMembership.status,
        isActive: userMembership.isActive,
        autoRenew: userMembership.autoRenew,
        activatedAt: userMembership.activatedAt,
        daysRemaining: isLifetime ? null : daysRemaining,
        isExpiringSoon: isLifetime ? false : isExpiringSoon,
        isLifetime,
        
        plan: {
          id: membershipPlan.id,
          name: membershipPlan.name,
          slug: membershipPlan.slug,
          description: membershipPlan.description,
          duration: membershipPlan.duration,
          price: membershipPlan.price,
          originalPrice: membershipPlan.originalPrice,
          features
        },
        
        // Quick actions
        canRenew: isExpiringSoon || daysRemaining <= 0,
        canUpgrade: !isLifetime,
        upgradeRecommended: daysRemaining <= 30 && !isLifetime
      }
    }

    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('Error fetching user membership:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Failed to fetch membership', details: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}
