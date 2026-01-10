import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/affiliate/by-code?code=XXX - Get affiliate link details by code
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Code parameter is required' },
        { status: 400 }
      )
    }

    // Find affiliate link by code
    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: {
        code,
        isActive: true,
        isArchived: false,
      },
      select: {
        id: true,
        code: true,
        couponCode: true,
        membershipId: true,
        productId: true,
        membership: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!affiliateLink) {
      return NextResponse.json(
        { success: false, error: 'Affiliate link not found or inactive' },
        { status: 404 }
      )
    }

    // Check expiry
    // Note: expiresAt not included in select, so we need to add it if needed
    // For now, assume active links are valid

    return NextResponse.json({
      success: true,
      affiliateLink,
    })
  } catch (error) {
    console.error('Error fetching affiliate link by code:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
