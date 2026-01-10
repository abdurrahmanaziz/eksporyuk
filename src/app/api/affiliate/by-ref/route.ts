import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/affiliate/by-ref?code=ABC123
 * Get affiliate info (name) from affiliate code for display on checkout
 * Supports both:
 * - AffiliateProfile.affiliateCode (e.g., "abdurrahmanaziz")
 * - AffiliateLink.code (e.g., "abdurrahmanaziz-4BJ0R8")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Affiliate code is required' },
        { status: 400 }
      )
    }

    // First, try to find by AffiliateProfile.affiliateCode (simple code like "abdurrahmanaziz")
    let affiliateProfile = await prisma.affiliateProfile.findFirst({
      where: {
        affiliateCode: code,
        isActive: true,
      },
      select: {
        id: true,
        affiliateCode: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    // If not found, try to find by AffiliateLink.code (full code like "abdurrahmanaziz-4BJ0R8")
    if (!affiliateProfile) {
      const affiliateLink = await prisma.affiliateLink.findFirst({
        where: {
          code: code,
          isActive: true,
        },
        select: {
          affiliate: {
            select: {
              id: true,
              affiliateCode: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      })

      if (affiliateLink?.affiliate) {
        affiliateProfile = affiliateLink.affiliate
      }
    }

    if (!affiliateProfile) {
      return NextResponse.json(
        { success: false, error: 'Affiliate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      affiliate: {
        code: affiliateProfile.affiliateCode,
        name: affiliateProfile.user.name || affiliateProfile.user.username || 'Partner',
        username: affiliateProfile.user.username,
        avatar: affiliateProfile.user.avatar,
      },
    })
  } catch (error) {
    console.error('Error fetching affiliate by ref:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
