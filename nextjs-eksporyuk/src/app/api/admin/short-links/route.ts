import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/short-links
 * Get all short links (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const shortLinks = await prisma.affiliateShortLink.findMany({
      include: {
        domain: true,
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Build full URLs
    const linksWithUrls = shortLinks.map(link => ({
      ...link,
      fullShortUrl: `https://${link.domain.domain}/${link.username}${link.slug ? '/' + link.slug : ''}`
    }))

    return NextResponse.json({ 
      shortLinks: linksWithUrls 
    })
  } catch (error) {
    console.error('Error fetching short links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch short links' },
      { status: 500 }
    )
  }
}
