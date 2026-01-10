import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/admin/supplier/packages/[id] - Get single package
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params

    const pkg = await prisma.supplierPackage.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    })

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: pkg,
    })
  } catch (error) {
    console.error('[ADMIN_SUPPLIER_PACKAGE_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/supplier/packages/[id] - Update package
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const {
      name,
      slug,
      type,
      duration,
      price,
      originalPrice,
      features,
      description,
      isActive,
      displayOrder,
      commissionType,
      affiliateCommissionRate,
    } = body

    // Check if package exists
    const existingPackage = await prisma.supplierPackage.findUnique({
      where: { id },
    })

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // If slug changed, check uniqueness
    if (slug && slug !== existingPackage.slug) {
      const slugExists = await prisma.supplierPackage.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update package
    const updatedPackage = await prisma.supplierPackage.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(type && { type }),
        ...(duration && { duration }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && { 
          originalPrice: originalPrice ? parseFloat(originalPrice) : null 
        }),
        ...(features && { features }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(commissionType && { commissionType }),
        ...(affiliateCommissionRate !== undefined && { 
          affiliateCommissionRate: parseFloat(affiliateCommissionRate) || 0 
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedPackage,
      message: 'Package updated successfully',
    })
  } catch (error) {
    console.error('[ADMIN_SUPPLIER_PACKAGE_PUT]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/supplier/packages/[id] - Delete package
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if package exists
    const existingPackage = await prisma.supplierPackage.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    })

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Check if package has active subscriptions
    const activeSubscriptions = await prisma.supplierMembership.count({
      where: {
        packageId: id,
        isActive: true,
      },
    })

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete package with ${activeSubscriptions} active subscription(s). Please deactivate or migrate subscriptions first.` 
        },
        { status: 400 }
      )
    }

    // Delete package
    await prisma.supplierPackage.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    })
  } catch (error) {
    console.error('[ADMIN_SUPPLIER_PACKAGE_DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
