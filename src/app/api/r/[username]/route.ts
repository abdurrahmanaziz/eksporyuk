import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic';
/**
 * GET /api/r/[username]
 * Redirect handler for short links
 * Example: link.eksporyuk.com/dinda -> redirects to target URL
 * 
 * This handles the short link redirection with click tracking
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }
    
    // Extract additional path (slug) if any
    // Example: /dinda/paket-premium -> username=dinda, slug=paket-premium
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const slug = pathParts.length > 2 ? pathParts.slice(2).join('/') : null
    
    // Find the short link
    const shortLink = await prisma.affiliateShortLink.findFirst({
      where: {
        username: username.toLowerCase(),
        slug: slug || null,
        isActive: true,
      },
      include: {
        domain: true,
        affiliate: true,
        affiliateLink: true,
      },
    })
    
    if (!shortLink) {
      // Fallback to default landing page
      return NextResponse.redirect(
        new URL(process.env.NEXTAUTH_URL || 'https://eksporyuk.com'),
        { status: 307 }
      )
    }
    
    // Check if expired
    if (shortLink.expiresAt && new Date(shortLink.expiresAt) < new Date()) {
      return NextResponse.redirect(
        new URL(process.env.NEXTAUTH_URL || 'https://eksporyuk.com'),
        { status: 307 }
      )
    }
    
    // Build target URL
    let targetUrl = ''
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    if (shortLink.targetType === 'custom' && shortLink.targetUrl) {
      targetUrl = shortLink.targetUrl
    } else if (shortLink.targetId) {
      // Get target details
      if (shortLink.targetType === 'membership') {
        const membership = await prisma.membership.findUnique({
          where: { id: shortLink.targetId },
          select: { slug: true },
        })
        targetUrl = membership?.slug 
          ? `${baseUrl}/membership/${membership.slug}`
          : `${baseUrl}/membership`
      } else if (shortLink.targetType === 'product') {
        const product = await prisma.product.findUnique({
          where: { id: shortLink.targetId },
          select: { slug: true },
        })
        targetUrl = product?.slug
          ? `${baseUrl}/product/${product.slug}`
          : `${baseUrl}/products`
      } else if (shortLink.targetType === 'course') {
        const course = await prisma.course.findUnique({
          where: { id: shortLink.targetId },
          select: { id: true },
        })
        targetUrl = course
          ? `${baseUrl}/courses/${course.id}`
          : `${baseUrl}/courses`
      }
    }
    
    if (!targetUrl) {
      targetUrl = baseUrl
    }
    
    // Add affiliate tracking parameters
    const targetUrlObj = new URL(targetUrl)
    
    // Add affiliate code if available
    if (shortLink.affiliate?.affiliateCode) {
      targetUrlObj.searchParams.set('ref', shortLink.affiliate.affiliateCode)
    }
    
    // Add coupon if available
    if (shortLink.couponCode) {
      targetUrlObj.searchParams.set('coupon', shortLink.couponCode)
    }
    
    // Track the click asynchronously (don't wait for it)
    const clientInfo = {
      ipAddress: req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      referrer: req.headers.get('referer') || null,
    }
    
    // Fire and forget - track click in background
    trackClick(shortLink.id, shortLink.affiliateId, clientInfo).catch(err => {
      console.error('Error tracking click:', err)
    })
    
    // Create response with redirect
    const response = NextResponse.redirect(targetUrlObj.toString(), { status: 307 })
    
    // Set affiliate tracking cookie (30 days)
    if (shortLink.affiliate?.affiliateCode) {
      response.cookies.set('affiliate_ref', shortLink.affiliate.affiliateCode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }
    
    // Also set coupon cookie if available
    if (shortLink.couponCode) {
      response.cookies.set('affiliate_coupon', shortLink.couponCode, {
        httpOnly: false, // Allow JS access for auto-apply
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }
    
    return response
    
  } catch (error) {
    console.error('Error handling short link redirect:', error)
    return NextResponse.redirect(
      new URL(process.env.NEXTAUTH_URL || 'https://eksporyuk.com'),
      { status: 307 }
    )
  }
}

/**
 * Track click asynchronously
 */
async function trackClick(
  shortLinkId: string,
  affiliateId: string,
  clientInfo: {
    ipAddress: string
    userAgent: string
    referrer: string | null
  }
) {
  try {
    // Update short link click count
    await prisma.affiliateShortLink.update({
      where: { id: shortLinkId },
      data: {
        clicks: { increment: 1 },
      },
    })
    
    // Update domain click count
    const shortLink = await prisma.affiliateShortLink.findUnique({
      where: { id: shortLinkId },
      select: { domainId: true },
    })
    
    if (shortLink?.domainId) {
      await prisma.shortLinkDomain.update({
        where: { id: shortLink.domainId },
        data: {
          totalClicks: { increment: 1 },
        },
      })
    }
    
    // Update affiliate profile click count
    await prisma.affiliateProfile.update({
      where: { id: affiliateId },
      data: {
        totalClicks: { increment: 1 },
      },
    })
    
    // Create click record (optional - can be disabled for performance)
    // This stores individual click details for analytics
    await prisma.affiliateClick.create({
      data: {
        affiliateId,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        referrer: clientInfo.referrer,
      },
    })
    
  } catch (error) {
    console.error('Error tracking click in background:', error)
    // Don't throw - this is fire and forget
  }
}
