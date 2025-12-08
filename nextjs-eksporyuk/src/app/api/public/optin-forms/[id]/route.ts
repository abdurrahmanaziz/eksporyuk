import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/public/optin-forms/[id]
 * Get optin form by ID or slug (public - no auth required)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Try to find by slug first, then by ID
    const optinForm = await prisma.affiliateOptinForm.findFirst({
      where: {
        OR: [
          { slug: id },
          { id: id }
        ],
        isActive: true // Only return active forms
      },
      select: {
        id: true,
        slug: true,
        formName: true,
        headline: true,
        description: true,
        submitButtonText: true,
        successMessage: true,
        redirectType: true,
        redirectUrl: true,
        redirectWhatsapp: true,
        collectName: true,
        collectEmail: true,
        collectPhone: true,
        isActive: true,
        bannerTitle: true,
        bannerSubtitle: true,
        bannerBadgeText: true,
        primaryColor: true,
        secondaryColor: true,
        showCountdown: true,
        countdownEndDate: true,
        benefits: true,
        faqs: true
      }
    })

    if (!optinForm) {
      return NextResponse.json(
        { error: 'Optin form not found or inactive' },
        { status: 404 }
      )
    }

    return NextResponse.json({ optinForm })
  } catch (error) {
    console.error('[PUBLIC API] Error fetching optin form:', error)
    return NextResponse.json(
      { error: 'Failed to fetch optin form' },
      { status: 500 }
    )
  }
}
