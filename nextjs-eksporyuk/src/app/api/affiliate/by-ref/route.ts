import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/affiliate/by-ref?code=ABC123
 * Get affiliate info (name) from affiliate code for display on checkout
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

    // Find affiliate profile by code
    const affiliateProfile = await prisma.affiliateProfile.findFirst({
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
