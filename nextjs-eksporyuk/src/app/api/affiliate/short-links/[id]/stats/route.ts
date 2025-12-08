import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/affiliate/short-links/[id]/stats
 * Get detailed statistics for a short link
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7d'

    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id as string }
    })

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      )
    }

    // Calculate date filter
    const now = new Date()
    let dateFilter: Date | undefined
    
    if (period === '7d') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === '30d') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get short link with click history
    const shortLink = await prisma.affiliateShortLink.findFirst({
      where: {
        id,
        affiliateId: affiliate.id
      },
      include: {
        domain: true,
        affiliateLink: {
          include: {
            clickRecords: {
              where: dateFilter ? {
                createdAt: {
                  gte: dateFilter
                }
              } : undefined,
              orderBy: {
                createdAt: 'desc'
              },
              take: 100
            }
          }
        }
      }
    })

    if (!shortLink) {
      return NextResponse.json(
        { error: 'Short link not found' },
        { status: 404 }
      )
    }

    // Build full URL
    const fullShortUrl = `https://${shortLink.domain.domain}/${shortLink.username}${shortLink.slug ? '/' + shortLink.slug : ''}`

    // Return stats
    return NextResponse.json({
      id: shortLink.id,
      username: shortLink.username,
      fullShortUrl,
      clicks: shortLink.clicks,
      conversions: shortLink.conversions,
      isActive: shortLink.isActive,
      expiresAt: shortLink.expiresAt,
      createdAt: shortLink.createdAt,
      domain: {
        domain: shortLink.domain.domain,
        displayName: shortLink.domain.displayName
      },
      clickHistory: shortLink.affiliateLink?.clickRecords || []
    })
  } catch (error) {
    console.error('Error fetching short link stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
