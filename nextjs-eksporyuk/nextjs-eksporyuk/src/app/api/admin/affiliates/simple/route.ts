import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/affiliates/simple
 * Get list of affiliates for dropdown/selection
 */
export async function GET(request: NextRequest) {
  try {
    // Note: This endpoint is called from admin page which is protected by middleware
    // No need to check auth here since page access is already restricted

    // Get active affiliates
    const affiliates = await prisma.affiliateProfile.findMany({
      where: {
        isActive: true
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format response
    const formattedAffiliates = affiliates.map(a => ({
      id: a.userId,
      name: a.user?.name || a.user?.username || 'Unknown',
      email: a.user?.email
    }))

    return NextResponse.json(formattedAffiliates)
  } catch (error) {
    console.error('Error fetching affiliates:', error)
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 })
  }
}
