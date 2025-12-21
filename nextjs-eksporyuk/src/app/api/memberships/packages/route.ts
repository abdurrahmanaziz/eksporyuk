import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/memberships/packages - Get all membership packages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const memberships = await prisma.membership.findMany({
      where: includeInactive ? {} : { 
        isActive: true,
        status: 'PUBLISHED', // Only show PUBLISHED memberships in public checkout
        showInGeneralCheckout: true, // Only show memberships enabled for general checkout
        NOT: {
          OR: [
            { slug: 'pro' }, // Exclude "Paket Pro" - ini hanya untuk admin/redirect
            { slug: 'member-free' } // Exclude "Member Free" - ini role default, bukan membership
          ]
        }
      },
      select: {
        id: true,
        slug: true,
        checkoutSlug: true,
        checkoutTemplate: true,
        name: true,
        duration: true,
        price: true,
        marketingPrice: true,
        features: true,
        isBestSeller: true,
        isMostPopular: true,
        salesPageUrl: true,
        isActive: true,
        commissionType: true,
        affiliateCommissionRate: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
        _count: {
          select: {
            userMemberships: true
          }
        }
      },
    })

    // Custom sort order: ONE_MONTH, THREE_MONTHS, SIX_MONTHS, TWELVE_MONTHS, LIFETIME
    // Urutan dari paket terkecil (1 bulan) ke terbesar (Lifetime)
    const durationOrder = {
      'ONE_MONTH': 1,
      'THREE_MONTHS': 2,
      'SIX_MONTHS': 3,
      'TWELVE_MONTHS': 4,
      'LIFETIME': 5,
    }
    
    memberships.sort((a, b) => {
      const orderA = durationOrder[a.duration as keyof typeof durationOrder] || 999
      const orderB = durationOrder[b.duration as keyof typeof durationOrder] || 999
      return orderA - orderB
    })

    // Transform features from Json to array if needed
    const transformed = memberships.map(membership => ({
      id: membership.id,
      slug: membership.slug, // Add slug field
      checkoutSlug: membership.checkoutSlug, // Add checkoutSlug field
      checkoutTemplate: membership.checkoutTemplate, // Add checkoutTemplate field
      name: membership.name,
      duration: membership.duration,
      price: Number(membership.price),
      marketingPrice: membership.marketingPrice ? Number(membership.marketingPrice) : null,
      features: typeof membership.features === 'string' 
        ? JSON.parse(membership.features) 
        : Array.isArray(membership.features) ? membership.features : [],
      isPopular: membership.isBestSeller || false,
      isBestSeller: membership.isBestSeller || false,
      isMostPopular: membership.isMostPopular || false,
      salesPageUrl: membership.salesPageUrl,
      isActive: membership.isActive,
      commissionType: membership.commissionType || 'PERCENTAGE',
      affiliateCommissionRate: Number(membership.affiliateCommissionRate) || 30,
      formLogo: membership.formLogo,
      formBanner: membership.formBanner,
      formDescription: membership.formDescription,
      _count: membership._count, // Include count statistics
    }))

    return NextResponse.json({
      success: true,
      packages: transformed,
    })
  } catch (error) {
    console.error('Error fetching memberships:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memberships' },
      { status: 500 }
    )
  }
}

// POST /api/memberships/packages - Create new membership (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      checkoutSlug,
      checkoutTemplate,
      description,
      duration,
      price,
      marketingPrice,
      features,
      isBestSeller,
      salesPageUrl,
      externalSalesUrl,
      alternativeUrl,
      productIds, // Array of product IDs to include in this membership
      commissionType,
      affiliateCommissionRate,
    } = body

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        name,
        slug: slug || null,
        checkoutSlug: checkoutSlug || null,
        checkoutTemplate: checkoutTemplate || 'modern',
        description,
        duration,
        price,
        marketingPrice: marketingPrice || null,
        features: features || [],
        isBestSeller: isBestSeller || false,
        salesPageUrl: salesPageUrl || null,
        externalSalesUrl: externalSalesUrl || null,
        alternativeUrl: alternativeUrl || null,
        isActive: true,
        commissionType: commissionType || 'PERCENTAGE',
        affiliateCommissionRate: affiliateCommissionRate || 30,
      },
    })

    // Create membership-product relations if productIds provided
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      await prisma.membershipProduct.createMany({
        data: productIds.map((productId: string) => ({
          membershipId: membership.id,
          productId,
        })),
        skipDuplicates: true, // Skip if relation already exists
      })
    }

    return NextResponse.json({
      membership,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating membership:', error)
    return NextResponse.json(
      { error: 'Failed to create membership' },
      { status: 500 }
    )
  }
}
