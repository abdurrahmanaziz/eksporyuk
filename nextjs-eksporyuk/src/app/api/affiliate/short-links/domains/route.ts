import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/affiliate/short-links/domains
 * Get available domains for affiliate to use
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const domains = await prisma.shortLinkDomain.findMany({
      where: {
        isActive: true,
        isVerified: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { displayName: 'asc' }
      ],
      select: {
        id: true,
        domain: true,
        displayName: true,
        isDefault: true,
        totalLinks: true,
        totalClicks: true
      }
    })
    
    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}
