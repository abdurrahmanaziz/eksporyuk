import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/affiliate/optin-forms/[id]
 * Get single optin form
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    const optinForm = await prisma.affiliateOptinForm.findFirst({
      where: {
        id,
        affiliateId: affiliateProfile.id
      }
    })

    if (!optinForm) {
      return NextResponse.json({ error: 'Optin form not found' }, { status: 404 })
    }

    // Manually count leads
    const leadsCount = await prisma.affiliateLead.count({
      where: { optinFormId: optinForm.id }
    })

    return NextResponse.json({ optinForm: { ...optinForm, _count: { leads: leadsCount } } })
  } catch (error) {
    console.error('Error fetching optin form:', error)
    return NextResponse.json(
      { error: 'Failed to fetch optin form' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/affiliate/optin-forms/[id]
 * Update optin form
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    // Check ownership
    const existing = await prisma.affiliateOptinForm.findFirst({
      where: {
        id,
        affiliateId: affiliateProfile.id
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Optin form not found' }, { status: 404 })
    }

    // Update optin form
    const optinForm = await prisma.affiliateOptinForm.update({
      where: { id },
      data: {
        formName: body.formName,
        headline: body.headline,
        description: body.description,
        submitButtonText: body.submitButtonText,
        successMessage: body.successMessage,
        redirectType: body.redirectType,
        redirectUrl: body.redirectUrl,
        redirectWhatsapp: body.redirectWhatsapp,
        collectName: body.collectName,
        collectEmail: body.collectEmail,
        collectPhone: body.collectPhone,
        isActive: body.isActive,
        bannerTitle: body.bannerTitle,
        bannerSubtitle: body.bannerSubtitle,
        bannerBadgeText: body.bannerBadgeText,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        showCountdown: body.showCountdown,
        countdownEndDate: body.countdownEndDate ? new Date(body.countdownEndDate) : null,
        benefits: body.benefits || [],
        faqs: body.faqs || []
      }
    })

    return NextResponse.json({
      message: 'Optin form updated successfully',
      optinForm
    })
  } catch (error) {
    console.error('Error updating optin form:', error)
    return NextResponse.json(
      { error: 'Failed to update optin form' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/affiliate/optin-forms/[id]
 * Delete optin form
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    // Check ownership
    const existing = await prisma.affiliateOptinForm.findFirst({
      where: {
        id,
        affiliateId: affiliateProfile.id
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Optin form not found' }, { status: 404 })
    }

    // Delete optin form
    await prisma.affiliateOptinForm.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Optin form deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting optin form:', error)
    return NextResponse.json(
      { error: 'Failed to delete optin form' },
      { status: 500 }
    )
  }
}
