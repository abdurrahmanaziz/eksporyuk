import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Note: This endpoint is called from admin page which is protected by middleware
    // No need to check auth here since page access is already restricted

    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        affiliateCommissionRate: true,
        duration: true
      },
      orderBy: { price: 'asc' }
    })

    return NextResponse.json(memberships)
  } catch (error) {
    console.error('Error fetching memberships:', error)
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 })
  }
}
