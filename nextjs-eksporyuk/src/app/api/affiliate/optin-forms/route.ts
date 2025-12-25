import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/affiliate/optin-forms
 * Get all optin forms for affiliate
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get affiliate profile manually
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    // Get optin forms manually
    const optinForms = await prisma.affiliateOptinForm.findMany({
      where: { affiliateId: affiliateProfile.id },
      orderBy: { createdAt: 'desc' }
    })

    // Get lead counts for each form
    const optinFormsWithCounts = await Promise.all(
      optinForms.map(async (form: any) => {
        const leadsCount = await prisma.affiliateLead.count({
          where: { optinFormId: form.id }
        })
        return {
          ...form,
          _count: { leads: leadsCount }
        }
      })
    )

    return NextResponse.json({
      optinForms: optinFormsWithCounts
    })
  } catch (error) {
    console.error('[API Error] /api/affiliate/optin-forms GET:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to fetch optin forms', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/affiliate/optin-forms
 * Create new optin form
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      formName,
      headline,
      description,
      submitButtonText,
      successMessage,
      redirectType,
      redirectUrl,
      redirectWhatsapp,
      collectName,
      collectEmail,
      collectPhone,
      bioPageId,
      bannerTitle,
      bannerSubtitle,
      bannerBadgeText,
      primaryColor,
      secondaryColor,
      showCountdown,
      countdownEndDate,
      benefits,
      faqs,
      leadMagnetId
    } = body

    // Validate required fields
    if (!formName || !headline) {
      return NextResponse.json(
        { error: 'Form name and headline are required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get affiliate profile manually
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    // Validate bioPageId if provided
    if (bioPageId) {
      const bioPage = await prisma.affiliateBioPage.findUnique({
        where: { id: bioPageId }
      })

      if (!bioPage || bioPage.affiliateId !== affiliateProfile.id) {
        return NextResponse.json(
          { error: 'Invalid bio page' },
          { status: 400 }
        )
      }
    }

    // Generate slug from formName
    let slug = formName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)

    // Check if slug exists, if so append random string
    const existingForm = await prisma.affiliateOptinForm.findUnique({
      where: { slug }
    })

    if (existingForm) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
    }

    // Create optin form
    const optinForm = await prisma.affiliateOptinForm.create({
      data: {
        affiliateId: affiliateProfile.id,
        bioPageId,
        slug,
        formName,
        headline,
        description,
        submitButtonText: submitButtonText || 'Submit',
        successMessage: successMessage || 'Terima kasih! Data Anda telah kami terima.',
        redirectType: redirectType || 'message',
        redirectUrl,
        redirectWhatsapp,
        collectName: collectName !== undefined ? collectName : true,
        collectEmail: collectEmail !== undefined ? collectEmail : true,
        collectPhone: collectPhone !== undefined ? collectPhone : true,
        bannerTitle,
        bannerSubtitle,
        bannerBadgeText,
        primaryColor,
        secondaryColor,
        showCountdown,
        countdownEndDate: countdownEndDate ? new Date(countdownEndDate) : null,
        benefits: benefits || [],
        faqs: faqs || [],
        leadMagnetId: leadMagnetId || null
      }
    })

    return NextResponse.json({
      message: 'Optin form created successfully',
      optinForm
    })
  } catch (error) {
    console.error('[API Error] /api/affiliate/optin-forms POST:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to create optin form', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
