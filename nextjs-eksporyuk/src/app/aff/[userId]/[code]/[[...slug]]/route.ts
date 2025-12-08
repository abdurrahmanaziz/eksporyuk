import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /aff/[userId]/[code] - Salespage (redirect ke external dengan cookies)
// GET /aff/[userId]/[code]/checkout - Direct checkout
// GET /aff/[userId]/[code]/0-link-alternatif - Backup salespage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; code: string; slug?: string[] }> }
) {
  try {
    const { userId, code, slug } = await params
    const { searchParams } = new URL(request.url)
    const couponCode = searchParams.get('coupon')
    const packageId = searchParams.get('package')
    
    // Tentukan tipe berdasarkan slug
    const type = slug?.[0] || 'salespage' // Default: salespage
    
    // Find affiliate link
    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: {
        code,
        userId,
        isActive: true,
        isArchived: false,
      },
      include: {
        membership: {
          select: { externalSalesUrl: true, alternativeUrl: true, id: true }
        },
        product: {
          select: { externalSalesUrl: true, id: true }
        }
      }
    })

    if (!affiliateLink) {
      return NextResponse.json(
        { error: 'Affiliate link not found or inactive' },
        { status: 404 }
      )
    }

    // Check expiry
    if (affiliateLink.expiresAt && new Date() > affiliateLink.expiresAt) {
      return NextResponse.json(
        { error: 'Affiliate link has expired' },
        { status: 410 }
      )
    }

    // Track click
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await prisma.affiliateClick.create({
      data: {
        linkId: affiliateLink.id,
        ipAddress: ip,
        userAgent: userAgent,
      },
    })

    await prisma.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: { clicks: { increment: 1 } },
    })

    // Get base URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    // Determine redirect destination
    let redirectUrl = ''
    
    if (type === 'checkout') {
      // Link Checkout: Langsung ke checkout web utama
      redirectUrl = `${baseUrl}/checkout-unified?ref=${code}`
      
      if (packageId) {
        redirectUrl += `&package=${packageId}`
      } else if (affiliateLink.membershipId) {
        redirectUrl += `&package=${affiliateLink.membershipId}`
      } else if (affiliateLink.productId) {
        redirectUrl += `&product=${affiliateLink.productId}`
      }
      
      if (couponCode) {
        redirectUrl += `&coupon=${couponCode}`
      }
    } 
    else if (type === '0-link-alternatif') {
      // Link Alternatif: Gunakan alternativeUrl jika ada
      const alternativeUrl = affiliateLink.membership?.alternativeUrl
      
      if (alternativeUrl) {
        // Redirect ke URL alternatif yang dikonfigurasi
        redirectUrl = alternativeUrl
        
        // Add ref parameter
        const separator = alternativeUrl.includes('?') ? '&' : '?'
        redirectUrl += `${separator}ref=${code}`
        
        if (couponCode) {
          redirectUrl += `&coupon=${couponCode}`
        }
      } else {
        // Jika tidak ada alternativeUrl, fallback ke checkout
        redirectUrl = `${baseUrl}/checkout-unified?ref=${code}`
        
        if (affiliateLink.membershipId) {
          redirectUrl += `&package=${affiliateLink.membershipId}`
        }
        
        if (couponCode) {
          redirectUrl += `&coupon=${couponCode}`
        }
      }
    }
    else {
      // Link Salespage: Redirect ke kelaseksporyuk.com (external)
      const externalUrl = affiliateLink.membership?.externalSalesUrl || 
                         affiliateLink.product?.externalSalesUrl
      
      if (externalUrl) {
        redirectUrl = externalUrl
        
        // Add ref parameter ke external URL
        const separator = externalUrl.includes('?') ? '&' : '?'
        redirectUrl += `${separator}ref=${code}`
        
        if (couponCode) {
          redirectUrl += `&coupon=${couponCode}`
        }
      } else {
        // No external URL configured, redirect ke checkout
        redirectUrl = `${baseUrl}/checkout-unified?ref=${code}`
        
        if (affiliateLink.membershipId) {
          redirectUrl += `&package=${affiliateLink.membershipId}`
        }
        
        if (couponCode) {
          redirectUrl += `&coupon=${couponCode}`
        }
      }
    }

    // Set affiliate tracking cookies
    const response = NextResponse.redirect(redirectUrl)
    
    // Set cookies (30 days expiry)
    response.cookies.set('affiliate_ref', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    
    if (couponCode) {
      response.cookies.set('affiliate_coupon', couponCode, {
        httpOnly: false, // Allow JS access for auto-apply
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Error in affiliate link handler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
