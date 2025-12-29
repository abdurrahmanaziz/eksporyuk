import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/products - Get all active products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const forAffiliate = searchParams.get('forAffiliate') === 'true'

    // Build where clause for products
    const buildWhereClause = (additionalWhere: any = {}) => {
      const where: any = { ...additionalWhere }
      if (!includeInactive) {
        where.isActive = true
      }
      if (forAffiliate) {
        where.affiliateEnabled = true
      }
      return where
    }

    // If slug provided, find specific product
    if (slug) {
      const product = await prisma.product.findFirst({
        where: buildWhereClause({ slug }),
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          shortDescription: true,
          price: true,
          originalPrice: true,
          thumbnail: true,
          salesPageUrl: true,
          externalSalesUrl: true,
          category: true,
          groupId: true,
          isFeatured: true,
          isActive: true,
          affiliateEnabled: true,
          affiliateCommissionRate: true,
          commissionType: true,
          formLogo: true,
          formBanner: true,
          formDescription: true,
          createdAt: true,
        },
      })

      if (!product) {
        return NextResponse.json({ products: [] })
      }

      // Get courses for this product - ProductCourse has no relations defined
      const productCourses = await prisma.productCourse.findMany({
        where: { productId: product.id },
      })
      
      // Get course details separately
      const courseIds = productCourses.map(pc => pc.courseId)
      const courses = courseIds.length > 0 ? await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          title: true,
          description: true,
          level: true,
          isPublished: true,
        },
      }) : []

      return NextResponse.json({
        products: [{
          ...product,
          courses,
        }],
      })
    }

    // Otherwise return all products
    const products = await prisma.product.findMany({
      where: buildWhereClause(),
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        price: true,
        originalPrice: true,
        thumbnail: true,
        salesPageUrl: true,
        externalSalesUrl: true,
        category: true,
        groupId: true,
        isFeatured: true,
        isActive: true,
        affiliateEnabled: true,
        affiliateCommissionRate: true,
        commissionType: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
        createdAt: true,
      },
    })

    // Get courses for each product - ProductCourse has no relations defined
    const productsWithCourses = await Promise.all(
      products.map(async (product) => {
        const productCourses = await prisma.productCourse.findMany({
          where: { productId: product.id },
        })
        
        // Get course details separately
        const courseIds = productCourses.map(pc => pc.courseId)
        const courses = courseIds.length > 0 ? await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: {
            id: true,
            title: true,
            description: true,
            level: true,
            isPublished: true,
          },
        }) : []

        return {
          ...product,
          courses,
        }
      })
    )

    return NextResponse.json({
      products: productsWithCourses,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product (ADMIN only)
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
      description,
      shortDescription,
      price,
      originalPrice,
      thumbnail,
      salesPageUrl,
      externalSalesUrl,
      category,
      groupId,
      courseIds, // Array of course IDs
      isFeatured,
      isActive,
    } = body

    if (!name || !description || !price) {
      return NextResponse.json(
        { error: 'Name, description, and price are required' },
        { status: 400 }
      )
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        creatorId: session.user.id,
        name,
        slug: slug || null,
        description,
        shortDescription: shortDescription || null,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        thumbnail: thumbnail || null,
        salesPageUrl: salesPageUrl || null,
        externalSalesUrl: externalSalesUrl || null,
        category: category || null,
        groupId: groupId || null,
        isFeatured: isFeatured ?? false,
        isActive: isActive ?? true,
      },
    })

    // Create product-course relations if courseIds provided
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      await prisma.productCourse.createMany({
        data: courseIds.map((courseId: string) => ({
          productId: product.id,
          courseId,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
