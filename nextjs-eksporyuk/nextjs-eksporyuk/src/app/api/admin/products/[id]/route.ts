import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch single product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        group: true,
        userProducts: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get courses for this product manually
    const productCourses = await prisma.productCourse.findMany({
      where: { productId: id }
    })
    const courseIds = productCourses.map(pc => pc.courseId)
    const courses = courseIds.length > 0 
      ? await prisma.course.findMany({ where: { id: { in: courseIds } } })
      : []
    
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const coursesWithRelation = productCourses.map(pc => ({
      ...pc,
      course: courseMap.get(pc.courseId) || null
    }))

    const productWithCourses = {
      ...product,
      courses: coursesWithRelation,
      _count: { userProducts: product.userProducts.length }
    }

    return NextResponse.json({ product: productWithCourses })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT - Update product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      price,
      productType,
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
      // Settings
      isActive,
      isFeatured,
      affiliateEnabled,
      commissionType,
      affiliateCommissionRate,
    } = body

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        price,
        productType,
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
        // Settings
        isActive,
        isFeatured,
        affiliateEnabled: affiliateEnabled !== undefined ? affiliateEnabled : true,
        commissionType,
        affiliateCommissionRate,
      },
    })

    // Update courses if provided
    if (courseIds !== undefined) {
      // Delete existing course associations
      await prisma.productCourse.deleteMany({
        where: { productId: id },
      })

      // Create new associations
      if (courseIds.length > 0) {
        await prisma.productCourse.createMany({
          data: courseIds.map((courseId: string) => ({
            productId: id,
            courseId,
          })),
        })
      }
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if product exists and has sales (safety check as per rule #1)
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userProducts: true,
            transactions: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product._count.userProducts > 0 || product._count.transactions > 0) {
      return NextResponse.json(
        {
          error: `Product tidak dapat dihapus karena sudah memiliki ${product._count.userProducts} penjualan. Silakan nonaktifkan produk ini sebagai gantinya.`,
        },
        { status: 400 }
      )
    }

    // Delete related data first
    await prisma.productCourse.deleteMany({
      where: { productId: id },
    })

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
