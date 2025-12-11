import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/redirect/[code] - Track affiliate click and redirect to external salespage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('to')
    const couponCode = searchParams.get('coupon')
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Target URL not provided' },
        { status: 400 }
      )
    }

    // Find affiliate link by code
    const affiliateLink = await prisma.affiliateLink.findUnique({
      where: { code },
      select: { 
        id: true, 
        userId: true, 
        isActive: true,
        expiresAt: true 
      },
    })

    if (!affiliateLink) {
      // Redirect without tracking if link not found
      return NextResponse.redirect(targetUrl)
    }

    // Check if link is still active
    if (!affiliateLink.isActive || 
        (affiliateLink.expiresAt && new Date() > affiliateLink.expiresAt)) {
      return NextResponse.redirect(targetUrl)
    }

    // Get IP and user agent for tracking
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record click
    await prisma.affiliateClick.create({
      data: {
        linkId: affiliateLink.id,
        ipAddress: ip,
        userAgent: userAgent,
      },
    })

    // Update click count
    await prisma.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    })

    // Set affiliate tracking cookie (expires in 30 days)
    const response = NextResponse.redirect(targetUrl)
    const cookieStore = await cookies()
    
    cookieStore.set('affiliate_ref', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    
    // Also set coupon if provided
    if (couponCode) {
      cookieStore.set('affiliate_coupon', couponCode, {
        httpOnly: false, // Allow JS access for auto-apply
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Error in affiliate redirect:', error)
    
    // Fallback: redirect to target URL anyway
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('to')
    
    if (targetUrl) {
      return NextResponse.redirect(targetUrl)
    }
    
    return NextResponse.json(
      { error: 'Redirect failed' },
      { status: 500 }
    )
  }
}
