import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Allow ADMIN and MENTOR to fetch memberships (MENTOR needs it for course creation)
    if (!['ADMIN', 'MENTOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Mentor access required' },
        { status: 403 }
      )
    }

    // Fetch all active memberships with explicit select to avoid missing column errors
    const memberships = await prisma.membership.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        description: true,
        duration: true,
        price: true,
        commissionType: true,
        affiliateCommissionRate: true,
        affiliateEnabled: true,
        features: true,
        isBestSeller: true,
        isPopular: true,
        isMostPopular: true,
        isActive: true,
        status: true,
        salesPageUrl: true,
        alternativeUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { duration: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      memberships
    })
  } catch (error) {
    console.error('Get memberships error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
