import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/supplier/products/[id] - Get single product
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const product = await prisma.supplierProduct.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            userId: true,
            companyName: true,
            slug: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (product.supplier.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('[SUPPLIER_PRODUCT_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/supplier/products/[id] - Update product
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Get product with owner check
    const product = await prisma.supplierProduct.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.supplier.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const {
      title,
      slug,
      description,
      images,
      documents,
      category,
      tags,
      status,
      price,
      minOrder,
    } = body

    // If slug changed, check uniqueness
    if (slug && slug !== product.slug) {
      const slugExists = await prisma.supplierProduct.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update product
    const updatedProduct = await prisma.supplierProduct.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(images !== undefined && { images }),
        ...(documents !== undefined && { documents }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(status && { status }),
        ...(price !== undefined && { price }),
        ...(minOrder !== undefined && { minOrder }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully',
    })
  } catch (error) {
    console.error('[SUPPLIER_PRODUCT_PUT]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/supplier/products/[id] - Delete product
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get product with owner check
    const product = await prisma.supplierProduct.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.supplier.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete product
    await prisma.supplierProduct.delete({
      where: { id },
    })

    // Update total products count
    await prisma.supplierProfile.update({
      where: { id: product.supplierId },
      data: {
        totalProducts: { decrement: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('[SUPPLIER_PRODUCT_DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
