import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Try to find in Membership
    const membership = await prisma.membership.findFirst({
      where: { 
        checkoutSlug: slug,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        originalPrice: true,
        features: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
      }
    })

    if (membership) {
      return NextResponse.json({
        item: {
          id: membership.id,
          type: 'membership',
          name: membership.name,
          description: membership.description,
          price: Number(membership.price),
          originalPrice: membership.originalPrice ? Number(membership.originalPrice) : undefined,
          duration: membership.duration,
          features: Array.isArray(membership.features) ? membership.features : [],
          formLogo: membership.formLogo,
          formBanner: membership.formBanner,
          formDescription: membership.formDescription,
        }
      })
    }

    // Try to find in Product
    const product = await prisma.product.findFirst({
      where: { 
        checkoutSlug: slug,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        thumbnail: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
      }
    })

    if (product) {
      return NextResponse.json({
        item: {
          id: product.id,
          type: 'product',
          name: product.name,
          description: product.description,
          price: Number(product.price),
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          thumbnail: product.thumbnail,
          formLogo: product.formLogo,
          formBanner: product.formBanner,
          formDescription: product.formDescription,
        }
      })
    }

    // Try to find in Course
    const course = await prisma.course.findFirst({
      where: { 
        checkoutSlug: slug,
        isPublished: true 
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        originalPrice: true,
        thumbnail: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
      }
    })

    if (course) {
      return NextResponse.json({
        item: {
          id: course.id,
          type: 'course',
          title: course.title,
          description: course.description,
          price: Number(course.price),
          originalPrice: course.originalPrice ? Number(course.originalPrice) : undefined,
          thumbnail: course.thumbnail,
          formLogo: course.formLogo,
          formBanner: course.formBanner,
          formDescription: course.formDescription,
        }
      })
    }

    // Not found
    return NextResponse.json(
      { error: 'Item tidak ditemukan' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error fetching checkout item:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
