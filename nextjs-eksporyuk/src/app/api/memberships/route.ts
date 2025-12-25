import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/memberships - List all active memberships
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const forAffiliate = searchParams.get('forAffiliate') === 'true'

    // Build where clause
    const whereClause: any = { isActive: true }
    
    // For affiliate usage, also filter by affiliateEnabled
    if (forAffiliate) {
      whereClause.affiliateEnabled = true
    }

    const memberships = await prisma.membership.findMany({
      where: whereClause,
      orderBy: { price: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        duration: true,
        features: true,
        isActive: true,
        affiliateCommissionRate: true,
        affiliateEnabled: true,
        createdAt: true,
      }
    })

    return NextResponse.json(memberships)
  } catch (error) {
    console.error('Error fetching memberships:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memberships' },
      { status: 500 }
    )
  }
}
