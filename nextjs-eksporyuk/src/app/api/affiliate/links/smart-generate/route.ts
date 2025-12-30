import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/affiliate/links/smart-generate
 * Smart generate multiple affiliate links with auto coupon generation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { targetType, targetId, couponId } = await request.json()

    if (!targetType || !['membership', 'product', 'course', 'supplier'].includes(targetType)) {
      return NextResponse.json({ 
        error: 'Valid targetType required (membership, product, course, supplier)' 
      }, { status: 400 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    let linksCreated = 0
    let salesPageLinks = 0
    let checkoutLinks = 0
    const createdLinks = []

    // Get selected coupon if provided
    let selectedCoupon = null
    if (couponId) {
      selectedCoupon = await prisma.coupon.findUnique({
        where: { id: couponId }
      })
      
      if (!selectedCoupon || !selectedCoupon.isActive) {
        return NextResponse.json({ 
          error: 'Kupon tidak ditemukan atau tidak aktif' 
        }, { status: 404 })
      }
      
      // Allow both affiliate's own coupons and admin coupons
      if (selectedCoupon.createdBy !== session.user.id && selectedCoupon.createdBy !== 'ADMIN') {
        return NextResponse.json({ 
          error: 'Anda tidak berhak menggunakan kupon ini' 
        }, { status: 403 })
      }
    }

    // Generate affiliate code if not exists
    let affiliateCode = affiliateProfile.affiliateCode
    if (!affiliateCode) {
      affiliateCode = `AF${Date.now().toString().slice(-6)}`
      await prisma.affiliateProfile.update({
        where: { id: affiliateProfile.id },
        data: { affiliateCode }
      })
    }

    // Get target items based on type
    let targetItems = []
    if (targetId) {
      // Generate for specific item
      if (targetType === 'membership') {
        const item = await prisma.membership.findUnique({ 
          where: { id: targetId, isActive: true } 
        })
        if (item) targetItems = [item]
      } else if (targetType === 'product') {
        const item = await prisma.product.findUnique({ 
          where: { id: targetId, isActive: true } 
        })
        if (item) targetItems = [item]
      } else if (targetType === 'course') {
        const item = await prisma.course.findUnique({ 
          where: { id: targetId, isPublished: true } 
        })
        if (item) targetItems = [item]
      } else if (targetType === 'supplier') {
        const item = await prisma.supplier.findUnique({ 
          where: { id: targetId, isVerified: true } 
        })
        if (item) targetItems = [item]
      }
    } else {
      // Generate for all items of this type
      if (targetType === 'membership') {
        targetItems = await prisma.membership.findMany({ 
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            checkoutSlug: true,
            description: true,
            price: true,
            affiliateCommissionRate: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        })
      } else if (targetType === 'product') {
        targetItems = await prisma.product.findMany({ 
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        })
      } else if (targetType === 'course') {
        targetItems = await prisma.course.findMany({ 
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' }
        })
      } else if (targetType === 'supplier') {
        targetItems = await prisma.supplier.findMany({ 
          where: { isVerified: true },
          orderBy: { createdAt: 'desc' }
        })
      }
    }

    if (targetItems.length === 0) {
      return NextResponse.json({ 
        error: `No active ${targetType} found` 
      }, { status: 404 })
    }

    // Generate links for each item
    for (const item of targetItems) {
      const itemId = item.id
      const itemName = targetType === 'course' ? item.title : 
                      targetType === 'supplier' ? item.companyName : 
                      item.name

      // Use selected coupon or no coupon
      const couponCode = selectedCoupon?.code || null

        // Generate different link types
        const linkTypes = []
        
        // For membership, generate specific patterns
        if (targetType === 'membership') {
          linkTypes.push('SALESPAGE_INTERNAL') // Sales page
          linkTypes.push('CHECKOUT') // Individual checkout
          linkTypes.push('CHECKOUT_PRO') // General checkout (/checkout/pro)
        } else {
          linkTypes.push('SALESPAGE_INTERNAL', 'CHECKOUT')
        }

        // Use live domain - prioritize production domain
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.NEXTAUTH_URL ||
                       'https://eksporyuk.com'
        
        for (const linkType of linkTypes) {
          // Check if link already exists
          const whereClause: any = {
            affiliateId: affiliateProfile.id,
            linkType,
          }
          whereClause[`${targetType}Id`] = itemId

          const existingLink = await prisma.affiliateLink.findFirst({
            where: whereClause
          })

          if (!existingLink) {
            // Generate short code with max retries
            let shortCode
            let shortCodeRetries = 0
            do {
              shortCode = Math.random().toString(36).substring(2, 8).toUpperCase()
              shortCodeRetries++
              if (shortCodeRetries > 100) {
                console.error('❌ Could not generate unique shortCode after 100 retries')
                return NextResponse.json({ 
                  error: 'Gagal generate link - terlalu banyak link yang sudah ada' 
                }, { status: 500 })
              }
            } while (await prisma.affiliateLink.findUnique({ where: { shortCode } }))

            // Generate link code with max retries
            let linkCode
            let codeRetries = 0
            do {
              linkCode = `${affiliateCode}-${shortCode}`
              codeRetries++
              if (codeRetries > 100) {
                console.error('❌ Could not generate unique linkCode after 100 retries')
                return NextResponse.json({ 
                  error: 'Gagal generate link - terlalu banyak link yang sudah ada' 
                }, { status: 500 })
              }
            } while (await prisma.affiliateLink.findUnique({ where: { code: linkCode } }))

            // Build URLs
            let fullUrl = ''
            if (linkType === 'SALESPAGE_INTERNAL') {
              // Sales page URL
              if (targetType === 'membership') {
                fullUrl = `${baseUrl}/membership/${item.slug || item.checkoutSlug}?ref=${linkCode}`
              } else if (targetType === 'product') {
                fullUrl = `${baseUrl}/products/${item.slug}?ref=${linkCode}`
              } else if (targetType === 'course') {
                fullUrl = `${baseUrl}/courses/${item.slug}?ref=${linkCode}`
              } else if (targetType === 'supplier') {
                fullUrl = `${baseUrl}/suppliers/${item.slug}?ref=${linkCode}`
              }
              salesPageLinks++
            } else if (linkType === 'CHECKOUT') {
              // Individual/specific checkout URL
              if (targetType === 'membership') {
                // Always use checkoutSlug if available, fallback to slug
                const slug = item.checkoutSlug || item.slug
                fullUrl = `${baseUrl}/checkout/${slug}?ref=${linkCode}`
                if (couponCode) fullUrl += `&coupon=${couponCode}`
              } else if (targetType === 'product') {
                fullUrl = `${baseUrl}/checkout/product/${item.slug}?ref=${linkCode}`
                if (couponCode) fullUrl += `&coupon=${couponCode}`
              } else if (targetType === 'course') {
                fullUrl = `${baseUrl}/checkout/course/${item.slug}?ref=${linkCode}`
                if (couponCode) fullUrl += `&coupon=${couponCode}`
              } else if (targetType === 'supplier') {
                fullUrl = `${baseUrl}/checkout/supplier/${item.slug}?ref=${linkCode}`
                if (couponCode) fullUrl += `&coupon=${couponCode}`
              }
              checkoutLinks++
            } else if (linkType === 'CHECKOUT_PRO') {
              // General checkout for all memberships (/checkout/pro)
              fullUrl = `${baseUrl}/checkout/pro?ref=${linkCode}`
              if (couponCode) fullUrl += `&coupon=${couponCode}`
              checkoutLinks++
            }          // Create affiliate link
          const linkData: any = {
            userId: session.user.id,
            affiliateId: affiliateProfile.id,
            code: linkCode,
            shortCode,
            linkType,
            couponCode,
            fullUrl,
            isActive: true,
          }
          linkData[`${targetType}Id`] = itemId

          const newLink = await prisma.affiliateLink.create({
            data: linkData,
          })

          createdLinks.push({
            id: newLink.id,
            code: linkCode,
            linkType,
            targetType,
            targetName: itemName,
            url: fullUrl,
            couponCode: couponCode || 'No coupon',
          })

          linksCreated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${linksCreated} affiliate links`,
      linksCreated,
      salesPageLinks,
      checkoutLinks,
      couponUsed: selectedCoupon ? selectedCoupon.code : null,
      targetType,
      targetItemsCount: targetItems.length,
      links: createdLinks,
      note: !selectedCoupon ? 'Links created without coupon codes. Select a coupon for discount links.' : null
    })

  } catch (error) {
    console.error('❌ Smart generate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}