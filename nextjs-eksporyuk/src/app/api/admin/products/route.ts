import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch all products
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin - first check session role, then fallback to database
    let isAdmin = session.user.role === 'ADMIN'
    
    if (!isAdmin) {
      // Fallback: check database if session role is not set
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      isAdmin = user?.role === 'ADMIN'
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const products = await prisma.product.findMany({
      where: {
        productType: { not: 'EVENT' }, // Exclude EVENT type - managed in Events section
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get transaction counts manually (no relations in schema)
    const productIds = products.map(p => p.id)
    const transactionCounts = productIds.length > 0 ? await prisma.transaction.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _count: true
    }) : []
    const countMap = new Map(transactionCounts.map(c => [c.productId, c._count]))

    // Attach _count to each product
    const productsWithCounts = products.map(product => ({
      ...product,
      _count: { transactions: countMap.get(product.id) || 0 }
    }))

    return NextResponse.json({ products: productsWithCounts })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - Create new product
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin - first check session role, then fallback to database
    let isAdmin = session.user.role === 'ADMIN'
    
    if (!isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      isAdmin = user?.role === 'ADMIN'
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      originalPrice,
      productType,
      productStatus,
      accessLevel,
      category,
      tags,
      thumbnail,
      images,
      // SEO fields
      seoMetaTitle,
      seoMetaDescription,
      seoKeywords,
      ctaButtonText,
      // Content fields (JSON)
      faqs,
      testimonials,
      bonuses,
      downloadableFiles,
      // Event fields
      eventDate,
      eventEndDate,
      eventDuration,
      eventUrl,
      meetingId,
      meetingPassword,
      eventVisibility,
      eventPassword,
      maxParticipants,
      // Upsale settings
      enableUpsale,
      upsaleTargetMemberships,
      upsaleDiscount,
      upsaleMessage,
      // Content
      groupId,
      courseIds,
      stock,
      // Marketing
      salesPageUrl,
      trackingPixels,
      // Settings
      isActive,
      isFeatured,
      commissionType,
      affiliateCommissionRate,
    } = body

    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Name, description, and price are required' },
        { status: 400 }
      )
    }

    if (!thumbnail) {
      return NextResponse.json(
        { error: 'Thumbnail is required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description,
        shortDescription: shortDescription || null,
        price,
        originalPrice: originalPrice || null,
        productType: productType || 'DIGITAL',
        // @ts-ignore - TS server not recognizing new Prisma schema fields yet
        productStatus: productStatus || 'DRAFT',
        // @ts-ignore
        accessLevel: accessLevel || 'PUBLIC',
        category: category || null,
        tags: tags || null,
        thumbnail,
        images: images || null,
        stock: stock || null,
        // SEO fields
        seoMetaTitle: seoMetaTitle || null,
        seoMetaDescription: seoMetaDescription || null,
        seoKeywords: seoKeywords || null,
        ctaButtonText: ctaButtonText || 'Beli Sekarang',
        // Content fields (JSON)
        faqs: faqs || null,
        testimonials: testimonials || null,
        bonuses: bonuses || null,
        downloadableFiles: downloadableFiles || null,
        // Event fields
        eventDate: eventDate ? new Date(eventDate) : null,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
        eventDuration,
        eventUrl,
        meetingId,
        meetingPassword,
        eventVisibility: eventVisibility || null,
        eventPassword,
        maxParticipants,
        // Upsale settings
        enableUpsale: enableUpsale !== undefined ? enableUpsale : true,
        upsaleTargetMemberships,
        upsaleDiscount: upsaleDiscount || 0,
        upsaleMessage,
        // Content
        groupId: groupId || null,
        // Marketing
        salesPageUrl: salesPageUrl || null,
        trackingPixels: trackingPixels || null,
        // Settings
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
        commissionType: commissionType || 'PERCENTAGE',
        affiliateCommissionRate: affiliateCommissionRate || 30,
        soldCount: 0,
        viewCount: 0,
        clickCount: 0,
        creator: {
          connect: { id: session.user.id }
        },
      },
    })

    // Assign courses if provided
    if (courseIds && courseIds.length > 0) {
      await prisma.productCourse.createMany({
        data: courseIds.map((courseId: string) => ({
          productId: product.id,
          courseId,
        })),
      })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
