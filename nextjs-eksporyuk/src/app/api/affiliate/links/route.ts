import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import validator from 'validator'
import DOMPurify from 'isomorphic-dompurify'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Security functions
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'file:', 'vbscript:']
    if (dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol))) {
      return false
    }
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false
    }
    
    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)) {
        return false
      }
    }
    
    return true
  } catch {
    return false
  }
}

function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input
  
  // Remove XSS payloads
  let sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  })
  
  // Additional sanitization
  sanitized = validator.escape(sanitized)
  
  return sanitized
}

// Rate limiting
class RateLimiter {
  private requests = new Map<string, number[]>()
  
  isAllowed(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [])
    }
    
    const userRequests = this.requests.get(identifier)!
    
    // Remove old requests
    const validRequests = userRequests.filter(time => time > windowStart)
    
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true
  }
}

const rateLimiter = new RateLimiter()


// GET /api/affiliate/links - Get user's affiliate links
export async function GET(request: NextRequest) {
  console.log('🔍 [Affiliate Links] GET request started')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('❌ [Affiliate Links] No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`✅ [Affiliate Links] User: ${session.user.id}`)
    
    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get('archived') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 items
    const skip = (page - 1) * limit

    console.log(`📄 [Affiliate Links] Pagination: page=${page}, limit=${limit}`)

    // Get or create affiliate profile with minimal data
    let affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true } // Only get the ID we need
    })

    if (!affiliateProfile) {
      console.log('⚠️  [Affiliate Links] No affiliate profile found')
      return NextResponse.json({ 
        links: [], 
        pagination: { page, limit, total: 0, totalPages: 0 }
      })
    }

    console.log(`✅ [Affiliate Links] Affiliate ID: ${affiliateProfile.id}`)

    // Get total count for pagination (separate query for performance)
    const totalCount = await prisma.affiliateLink.count({
      where: {
        affiliateId: affiliateProfile.id,
        ...(showArchived ? {} : { isArchived: false }),
      },
    })
    
    console.log(`📊 [Affiliate Links] Total links: ${totalCount}`)
    
    // Get affiliate's links with pagination and optimized includes
    const links = await prisma.affiliateLink.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        ...(showArchived ? {} : { isArchived: false }),
      },
      select: {
        id: true,
        code: true,
        fullUrl: true,
        clicks: true,
        linkType: true,
        couponCode: true,
        conversions: true,
        isArchived: true,
        createdAt: true,
        membershipId: true,
        productId: true,
        courseId: true,
        supplierId: true,
        // Optimized relations - only select needed fields
        membership: {
          select: { id: true, name: true, slug: true }
        },
        product: {
          select: { id: true, name: true, slug: true }
        },
        course: {
          select: { id: true, title: true }
        },
        supplier: {
          select: { id: true, companyName: true, province: true, city: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: skip,
    })

    console.log(`✅ [Affiliate Links] Retrieved ${links.length} links`)

    // Build optimized response with pagination
    const linksWithStats = links.map((link) => {
      return {
        id: link.id,
        code: link.code,
        url: link.fullUrl,
        linkType: link.linkType,
        couponCode: link.couponCode,
        clicks: link.clicks,
        conversions: link.conversions || 0,
        revenue: 0, // Calculate separately if needed
        isArchived: link.isArchived,
        membership: link.membership,
        product: link.product,
        course: link.course,
        supplier: link.supplier,
        createdAt: link.createdAt.toISOString(),
      }
    })

    const totalPages = Math.ceil(totalCount / limit)

    console.log(`✅ [Affiliate Links] Success - returning ${linksWithStats.length} links`)

    return NextResponse.json({
      links: linksWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error: any) {
    console.error('❌ [Affiliate Links] Error:', error)
    console.error('❌ [Affiliate Links] Stack:', error.stack)
    console.error('❌ [Affiliate Links] Message:', error.message)
    console.error('❌ [Affiliate Links] Name:', error.name)
    console.error('❌ [Affiliate Links] Code:', error.code)
    
    // Return empty result instead of error to prevent page crash
    // This allows users to still access the page while we fix database issues
    return NextResponse.json({
      links: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      },
      error: 'Database connection issue. Please contact support.',
      _debug: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        name: error.name
      } : undefined
    })
  }
}

// POST /api/affiliate/links - Generate new affiliate link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check
    const userIdentifier = session.user.id
    if (!rateLimiter.isAllowed(userIdentifier, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    // Get or create affiliate profile
    let affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      })

      const baseCode = user?.name
        ?.toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10)
      const affiliateCode = `${baseCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      const shortLink = Math.random().toString(36).substring(2, 10).toUpperCase()

      affiliateProfile = await prisma.affiliateProfile.create({
        data: {
          userId: session.user.id,
          affiliateCode,
          shortLink,
          totalClicks: 0,
          totalConversions: 0,
          totalEarnings: 0,
        },
      })
    }

    const body = await request.json()
    const { 
      linkType = 'CHECKOUT', // SALESPAGE_INTERNAL, SALESPAGE_EXTERNAL, CHECKOUT
      targetType = 'membership', // 'membership', 'product', 'course', 'supplier'
      targetId = null, 
      couponCode = null,
      targetUrl = null 
    } = body

    // Input validation and sanitization
    if (targetUrl && !isValidUrl(targetUrl)) {
      return NextResponse.json({ error: 'Invalid target URL provided' }, { status: 400 })
    }

    const sanitizedCouponCode = couponCode ? sanitizeInput(couponCode) : null
    
    // Validate linkType
    const validLinkTypes = ['SALESPAGE_INTERNAL', 'SALESPAGE_EXTERNAL', 'CHECKOUT', 'CHECKOUT_PRO']
    if (!validLinkTypes.includes(linkType)) {
      return NextResponse.json({ error: 'Invalid link type' }, { status: 400 })
    }

    // Validate targetType
    const validTargetTypes = ['membership', 'product', 'course', 'supplier']
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json({ error: 'Invalid target type' }, { status: 400 })
    }

    console.log('📝 Generate link request:', { linkType, targetType, targetId, couponCode: sanitizedCouponCode })

    // Generate unique code
    const baseCode = `${affiliateProfile.affiliateCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const code = sanitizeInput(baseCode)

    // Simple mode: if targetUrl provided, use it directly
    let url = ''
    if (targetUrl) {
      url = targetUrl
    } else {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.NEXTAUTH_URL ||
                     'https://eksporyuk.com'
      
      // Get target details for slug and external URL
      let targetSlug = null
      let externalSalesUrl = null
      let alternativeUrl = null
      
      if (targetId) {
        if (targetType === 'product') {
          const product = await prisma.product.findUnique({
            where: { id: targetId },
            select: { 
              slug: true,
              salesPageUrl: true,
            }
          })
          targetSlug = product?.slug
          externalSalesUrl = product?.salesPageUrl
        } else if (targetType === 'course') {
          const course = await prisma.course.findUnique({
            where: { id: targetId },
            select: { 
              id: true,
              title: true,
            }
          })
          // Course belum ada slug, pakai ID
          targetSlug = course?.id
        } else if (targetType === 'supplier') {
          const supplier = await prisma.supplier.findUnique({
            where: { id: targetId },
            select: { 
              id: true,
              companyName: true,
            }
          })
          targetSlug = supplier?.id
        } else {
          const membership = await prisma.membership.findUnique({
            where: { id: targetId },
            select: { 
              slug: true,
              salesPageUrl: true,
              externalSalesUrl: true,
              alternativeUrl: true 
            }
          })
          targetSlug = membership?.slug
          externalSalesUrl = membership?.salesPageUrl || membership?.externalSalesUrl
          alternativeUrl = membership?.alternativeUrl
        }
      }
      
      // Build URL with SEO-friendly pattern
      if (linkType === 'SALESPAGE_INTERNAL') {
        // Link Salespage: /checkout/[slug]?ref=CODE&coupon=COUPON
        // Atau untuk semua paket: /membership?ref=CODE&coupon=COUPON
        if (targetSlug && targetType === 'membership') {
          url = `${baseUrl}/checkout/${targetSlug}`
        } else if (targetSlug && targetType === 'product') {
          url = `${baseUrl}/checkout/product/${targetSlug}`
        } else if (targetSlug && targetType === 'course') {
          url = `${baseUrl}/checkout/course/${targetSlug}`
        } else if (targetSlug && targetType === 'supplier') {
          url = `${baseUrl}/supplier/${targetSlug}`
        } else {
          // Semua paket - ke salespage umum
          url = externalSalesUrl || `${baseUrl}/membership`
        }
        
        // Add ref and coupon
        const params = new URLSearchParams()
        params.append('ref', code)
        if (couponCode) params.append('coupon', couponCode)
        url += `?${params.toString()}`
      } 
      else if (linkType === 'SALESPAGE_EXTERNAL') {
        // Link Alternatif: sama seperti salespage tapi ke URL alternatif
        if (targetSlug && targetType === 'membership') {
          url = `${baseUrl}/checkout/${targetSlug}`
        } else if (targetSlug && targetType === 'product') {
          url = `${baseUrl}/checkout/product/${targetSlug}`  
        } else if (targetSlug && targetType === 'course') {
          url = `${baseUrl}/checkout/course/${targetSlug}`
        } else if (targetSlug && targetType === 'supplier') {
          url = `${baseUrl}/supplier/${targetSlug}`
        } else {
          // Semua paket - ke alternatif umum
          url = alternativeUrl || externalSalesUrl || `${baseUrl}/membership`
        }
        
        const params = new URLSearchParams()
        params.append('ref', sanitizeInput(code))
        if (sanitizedCouponCode) params.append('coupon', sanitizedCouponCode)
        url += `?${params.toString()}`
      }
      else if (linkType === 'CHECKOUT') {
        // Link Checkout: Jika membership specific, redirect ke /checkout/[slug]
        // Jika checkout umum (semua paket), gunakan /checkout-unified
        if (targetSlug && targetType === 'membership') {
          // Untuk membership spesifik, redirect ke checkout
          url = `${baseUrl}/checkout/${targetSlug}`
          
          const params = new URLSearchParams()
          params.append('ref', sanitizeInput(code))
          if (sanitizedCouponCode) params.append('coupon', sanitizedCouponCode)
          url += `?${params.toString()}`
        } else if (targetSlug && targetType === 'product') {
          // Untuk produk spesifik
          url = `${baseUrl}/checkout/product/${targetSlug}`
          
          const params = new URLSearchParams()
          params.append('ref', sanitizeInput(code))
          if (sanitizedCouponCode) params.append('coupon', sanitizedCouponCode)
          url += `?${params.toString()}`
        } else if (targetSlug && targetType === 'course') {
          // Untuk course spesifik
          url = `${baseUrl}/checkout/course/${targetSlug}`
          
          const params = new URLSearchParams()
          params.append('ref', sanitizeInput(code))
          if (sanitizedCouponCode) params.append('coupon', sanitizedCouponCode)
          url += `?${params.toString()}`
        } else if (targetSlug && targetType === 'supplier') {
          // Untuk supplier spesifik
          url = `${baseUrl}/supplier/${targetSlug}`
          
          const params = new URLSearchParams()
          params.append('ref', sanitizeInput(code))
          if (sanitizedCouponCode) params.append('coupon', sanitizedCouponCode)
          url += `?${params.toString()}`
        } else {
          // Checkout umum untuk semua paket
          url = `${baseUrl}/checkout-unified`
          
          const params = new URLSearchParams()
          params.append('ref', sanitizeInput(code))
          if (sanitizedCouponCode) params.append('coupon', sanitizedCouponCode)
          url += `?${params.toString()}`
        }
      }
    }

    // Build create data object with sanitized inputs
    const createData: any = {
      code: sanitizeInput(code),
      fullUrl: isValidUrl(url) ? url : '', // Ensure URL is valid
      clicks: 0,
      linkType,
      couponCode: sanitizedCouponCode || null,
      affiliateId: affiliateProfile.id,
    }

    // Validate final URL
    if (!createData.fullUrl || !isValidUrl(createData.fullUrl)) {
      return NextResponse.json({ error: 'Generated URL is invalid' }, { status: 400 })
    }

    // Add targetId based on type
    if (targetId) {
      if (targetType === 'membership') {
        createData.membershipId = targetId
      } else if (targetType === 'product') {
        createData.productId = targetId
      } else if (targetType === 'course') {
        createData.courseId = targetId
      } else if (targetType === 'supplier') {
        createData.supplierId = targetId
      }
    }

    console.log('💾 Creating link with data:', createData)

    // Create affiliate link
    const link = await prisma.affiliateLink.create({
      data: createData,
      include: {
        membership: true,
        product: true,
        course: true,
        supplier: true,
      }
    })

    console.log('✅ Link created:', { id: link.id, code: link.code, url: link.fullUrl })

    return NextResponse.json({
      link: {
        id: link.id,
        code: link.code,
        url: link.fullUrl,
        linkType: link.linkType,
        couponCode: link.couponCode,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        membership: link.membership,
        product: link.product,
        course: link.course,
        supplier: link.supplier,
        createdAt: link.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error generating affiliate link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate affiliate link' },
      { status: 500 }
    )
  }
}
