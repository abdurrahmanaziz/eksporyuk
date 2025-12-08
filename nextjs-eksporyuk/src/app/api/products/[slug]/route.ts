import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Try to find by slug first
    let product = await prisma.product.findUnique({
      where: { slug },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            userProducts: true,
          },
        },
      },
    })

    // Fallback: try by checkoutSlug
    if (!product) {
      product = await prisma.product.findFirst({
        where: { checkoutSlug: slug },
        include: {
          group: {
            select: {
              id: true,
              name: true,
            },
          },
          courses: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              userProducts: true,
            },
          },
        },
      })
    }

    // Fallback: try by ID for backwards compatibility
    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: slug },
        include: {
          group: {
            select: {
              id: true,
              name: true,
            },
          },
          courses: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              userProducts: true,
            },
          },
        },
      })
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      product: {
        ...product,
        soldCount: product._count.userProducts,
        _count: undefined,
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
