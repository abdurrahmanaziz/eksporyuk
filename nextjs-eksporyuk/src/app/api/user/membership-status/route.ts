import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/membership-status
 * Get current user's active membership status with expiry info
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active membership
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        status: 'ACTIVE'
      },
      include: {
        membership: {
          select: {
            id: true,
            name: true,
            slug: true,
            duration: true
          }
        }
      },
      orderBy: {
        endDate: 'desc'
      }
    })

    if (!userMembership) {
      return NextResponse.json({
        hasMembership: false,
        membership: null
      })
    }

    const now = new Date()
    const endDate = new Date(userMembership.endDate)
    const diffMs = endDate.getTime() - now.getTime()
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    const isExpired = diffMs <= 0
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0
    const isLifetime = userMembership.membership.duration === 'LIFETIME'

    return NextResponse.json({
      hasMembership: true,
      membership: {
        id: userMembership.id,
        membershipId: userMembership.membershipId,
        name: userMembership.membership.name,
        slug: userMembership.membership.slug,
        startDate: userMembership.startDate.toISOString(),
        endDate: userMembership.endDate.toISOString(),
        daysRemaining: Math.max(0, daysRemaining),
        isExpired,
        isExpiringSoon,
        isLifetime,
        status: userMembership.status
      }
    })
  } catch (error) {
    console.error('Get membership status error:', error)
    return NextResponse.json(
      { error: 'Failed to get membership status' },
      { status: 500 }
    )
  }
}
