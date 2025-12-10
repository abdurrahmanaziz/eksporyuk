import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * Admin API: Upgrade User Membership
 * Allows admin to change membership duration or extend expiry
 * 
 * POST /api/admin/memberships/[membershipId]/upgrade
 * Body: {
 *   newMembershipId: string,  // Target membership plan ID
 *   extendDays?: number,      // Optional: extend current membership by N days
 *   reason?: string           // Admin note for the upgrade
 * }
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check admin permission
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    const { id: membershipId } = params
    const body = await request.json()
    const { newMembershipId, extendDays, reason } = body
    
    // Validate input
    if (!newMembershipId && !extendDays) {
      return NextResponse.json(
        { error: 'Either newMembershipId or extendDays is required' },
        { status: 400 }
      )
    }
    
    // Get current user membership
    const userMembership = await prisma.userMembership.findUnique({
      where: { id: membershipId },
      include: {
        user: true,
        membership: true
      }
    })
    
    if (!userMembership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }
    
    let updatedMembership
    
    // Case 1: Upgrade/Change membership plan
    if (newMembershipId && newMembershipId !== userMembership.membershipId) {
      const newMembership = await prisma.membership.findUnique({
        where: { id: newMembershipId }
      })
      
      if (!newMembership) {
        return NextResponse.json(
          { error: 'Target membership plan not found' },
          { status: 404 }
        )
      }
      
      // Calculate new end date based on new membership duration
      const now = new Date()
      let newEndDate
      
      if (newMembership.slug.includes('lifetime')) {
        newEndDate = new Date('2099-12-31') // Lifetime
      } else {
        // Get duration in days from membership metadata or slug
        const durationDays = newMembership.slug.includes('12') ? 365 : 
                            newMembership.slug.includes('6') ? 180 : 30
        newEndDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
      }
      
      updatedMembership = await prisma.userMembership.update({
        where: { id: membershipId },
        data: {
          membershipId: newMembershipId,
          endDate: newEndDate,
          status: 'ACTIVE',
          isActive: true
        },
        include: {
          membership: true,
          user: true
        }
      })
      
      // Update user role to premium if not already
      if (userMembership.user.role !== 'MEMBER_PREMIUM') {
        await prisma.user.update({
          where: { id: userMembership.userId },
          data: { role: 'MEMBER_PREMIUM' }
        })
      }
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `Upgraded user ${userMembership.user.email} from ${userMembership.membership.name} to ${newMembership.name}`,
          entity: 'UserMembership',
          entityId: membershipId,
          metadata: {
            targetUserId: userMembership.userId,
            oldMembershipId: userMembership.membershipId,
            newMembershipId: newMembershipId,
            reason: reason || 'Admin upgrade'
          }
        }
      })
    }
    
    // Case 2: Extend current membership
    else if (extendDays) {
      const currentEndDate = new Date(userMembership.endDate)
      const newEndDate = new Date(currentEndDate.getTime() + extendDays * 24 * 60 * 60 * 1000)
      
      updatedMembership = await prisma.userMembership.update({
        where: { id: membershipId },
        data: {
          endDate: newEndDate,
          status: 'ACTIVE',
          isActive: true
        },
        include: {
          membership: true,
          user: true
        }
      })
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `Extended membership for ${userMembership.user.email} by ${extendDays} days`,
          entity: 'UserMembership',
          entityId: membershipId,
          metadata: {
            targetUserId: userMembership.userId,
            membershipId: membershipId,
            extendDays: extendDays,
            reason: reason || 'Admin extension'
          }
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Membership upgraded successfully',
      membership: updatedMembership
    })
    
  } catch (error: any) {
    console.error('Membership upgrade error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upgrade membership' },
      { status: 500 }
    )
  }
}
