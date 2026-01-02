import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[slug] - Get product by slug, checkoutSlug, or ID
 * Used by checkout pages and product detail pages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    // Try to find by slug, checkoutSlug, or ID
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { checkoutSlug: slug }, { id: slug }],
        isActive: true,
      },
      select: {
        id: true,
        creatorId: true,
        name: true,
        slug: true,
        checkoutSlug: true,
        description: true,
        shortDescription: true,
        price: true,
        originalPrice: true,
        thumbnail: true,
        images: true,
        salesPageUrl: true,
        externalSalesUrl: true,
        category: true,
        tags: true,
        productType: true,
        productStatus: true,
        accessLevel: true,
        eventDate: true,
        eventEndDate: true,
        eventDuration: true,
        eventUrl: true,
        maxParticipants: true,
        commissionType: true,
        affiliateCommissionRate: true,
        affiliateEnabled: true,
        mentorCommission: true,
        groupId: true,
        isActive: true,
        isFeatured: true,
        stock: true,
        soldCount: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
        ctaButtonText: true,
        faqs: true,
        testimonials: true,
        bonuses: true,
        downloadableFiles: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get group info
    const group = product.groupId
      ? await prisma.group.findUnique({
          where: { id: product.groupId },
          select: {
            id: true,
            name: true,
          },
        })
      : null

    // Get product courses via ProductCourse junction
    const productCourses = await prisma.productCourse.findMany({
      where: { productId: product.id },
    })

    const courseIds = productCourses.map((pc) => pc.courseId)
    const courses =
      courseIds.length > 0
        ? await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              level: true,
            },
          })
        : []

    // Get actual attendee/buyer count
    const userProductCount = await prisma.userProduct.count({
      where: { productId: product.id },
    })

    return NextResponse.json({
      product: {
        ...product,
        group,
        courses,
        attendeeCount: userProductCount,
      },
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
