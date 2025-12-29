import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/supplier/membership/current
 * Get current user's active supplier membership
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get active supplier membership
    const membership = await prisma.supplierMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        package: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    if (!membership) {
      return NextResponse.json({
        membership: null,
      })
    }

    // Calculate days remaining
    let daysRemaining: number | null = null
    if (membership.endDate) {
      const now = new Date()
      const end = new Date(membership.endDate)
      const diff = end.getTime() - now.getTime()
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      membership: {
        id: membership.id,
        packageId: membership.packageId,
        packageName: membership.package.name,
        packageType: membership.package.type,
        packageDuration: membership.package.duration,
        startDate: membership.startDate,
        endDate: membership.endDate,
        isActive: membership.isActive,
        autoRenew: membership.autoRenew,
        price: membership.price,
        daysRemaining,
      },
    })
  } catch (error) {
    console.error('Error fetching supplier membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
