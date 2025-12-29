import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'DRAFT', 'ACTIVE', 'INACTIVE', 'PENDING_REVIEW', 'all'
    const supplierId = searchParams.get('supplierId')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (supplierId) {
      where.supplierProfileId = supplierId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.supplierProduct.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            logo: true,
            isVerified: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate stats
    const stats = {
      total: products.length,
      draft: products.filter(p => p.status === 'DRAFT').length,
      active: products.filter(p => p.status === 'ACTIVE').length,
      inactive: products.filter(p => p.status === 'INACTIVE').length,
      pendingReview: products.filter(p => p.status === 'PENDING_REVIEW').length,
    }

    return NextResponse.json({
      data: products,
      stats,
    })
  } catch (error) {
    console.error('Error fetching supplier products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, action, reason } = body

    if (!productId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await prisma.supplierProduct.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'approve':
        updateData = {
          status: 'ACTIVE',
          rejectionReason: null,
        }
        break
      case 'reject':
        updateData = {
          status: 'INACTIVE',
          rejectionReason: reason || 'Rejected by admin',
        }
        break
      case 'suspend':
        updateData = {
          status: 'INACTIVE',
          rejectionReason: 'Suspended: ' + (reason || 'Violated terms'),
        }
        break
      case 'activate':
        updateData = {
          status: 'ACTIVE',
          rejectionReason: null,
        }
        break
      case 'deactivate':
        updateData = {
          status: 'INACTIVE',
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updated = await prisma.supplierProduct.update({
      where: { id: productId },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Product updated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
