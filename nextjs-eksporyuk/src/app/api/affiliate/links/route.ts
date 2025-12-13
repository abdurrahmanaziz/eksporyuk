import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/affiliate/links - Get user's affiliate links
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create affiliate profile
    let affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({ links: [] })
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get('archived') === 'true'
    
    // Get affiliate's links
    const links = await prisma.affiliateLink.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        ...(showArchived ? {} : { isArchived: false }),
      },
      include: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get conversion counts for each link
    const linksWithStats = links.map((link) => {
      const conversions = link.conversions || 0

      return {
        id: link.id,
        code: link.code,
        url: link.fullUrl,
        linkType: link.linkType,
        couponCode: link.couponCode,
        clicks: link.clicks,
        conversions,
        revenue: 0, // Calculate if needed
        isArchived: link.isArchived,
        membership: link.membership,
        product: link.product,
        course: link.course,
        supplier: link.supplier,
        createdAt: link.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      links: linksWithStats,
    })
  } catch (error) {
    console.error('Error fetching affiliate links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate links' },
      { status: 500 }
    )
  }
}

// POST /api/affiliate/links - Generate new affiliate link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    console.log('📝 Generate link request:', { linkType, targetType, targetId, couponCode })

    // Generate unique code
    const code = `${affiliateProfile.affiliateCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Simple mode: if targetUrl provided, use it directly
    let url = ''
    if (targetUrl) {
      url = targetUrl
    } else {
      const baseUrl = process.env.NEXTAUTH_URL || 
                     process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                     process.env.NEXT_PUBLIC_APP_URL ||
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
        params.append('ref', code)
        if (couponCode) params.append('coupon', couponCode)
        url += `?${params.toString()}`
      }
      else if (linkType === 'CHECKOUT') {
        // Link Checkout: Jika membership specific, redirect ke /checkout/[slug]
        // Jika checkout umum (semua paket), gunakan /checkout-unified
        if (targetSlug && targetType === 'membership') {
          // Untuk membership spesifik, redirect ke checkout
          url = `${baseUrl}/checkout/${targetSlug}`
          
          const params = new URLSearchParams()
          params.append('ref', code)
          if (couponCode) params.append('coupon', couponCode)
          url += `?${params.toString()}`
        } else if (targetSlug && targetType === 'product') {
          // Untuk produk spesifik
          url = `${baseUrl}/checkout/product/${targetSlug}`
          
          const params = new URLSearchParams()
          params.append('ref', code)
          if (couponCode) params.append('coupon', couponCode)
          url += `?${params.toString()}`
        } else if (targetSlug && targetType === 'course') {
          // Untuk course spesifik
          url = `${baseUrl}/checkout/course/${targetSlug}`
          
          const params = new URLSearchParams()
          params.append('ref', code)
          if (couponCode) params.append('coupon', couponCode)
          url += `?${params.toString()}`
        } else if (targetSlug && targetType === 'supplier') {
          // Untuk supplier spesifik
          url = `${baseUrl}/supplier/${targetSlug}`
          
          const params = new URLSearchParams()
          params.append('ref', code)
          if (couponCode) params.append('coupon', couponCode)
          url += `?${params.toString()}`
        } else {
          // Checkout umum untuk semua paket
          url = `${baseUrl}/checkout-unified`
          
          const params = new URLSearchParams()
          params.append('ref', code)
          if (couponCode) params.append('coupon', couponCode)
          url += `?${params.toString()}`
        }
      }
    }

    // Build create data object
    const createData: any = {
      code,
      fullUrl: url,
      clicks: 0,
      linkType,
      couponCode: couponCode || null,
      affiliateId: affiliateProfile.id,
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
