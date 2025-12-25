import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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
    const statusFilter = searchParams.get('status') // 'pending', 'recommended', 'verified', 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause based on boolean flags (actual schema fields)
    const where: any = {}

    if (statusFilter === 'pending') {
      // Not verified and not suspended
      where.isVerified = false
      where.isSuspended = false
    } else if (statusFilter === 'recommended') {
      // Not verified and not suspended (ready for verification)
      where.isVerified = false
      where.isSuspended = false
    } else if (statusFilter === 'verified') {
      // Show verified suppliers
      where.isVerified = true
    } else if (statusFilter === 'suspended') {
      // Show suspended suppliers
      where.isSuspended = true
    } else if (statusFilter === 'all') {
      // No filter - show all
    } else {
      // Default: show non-verified, non-suspended (pending verification)
      where.isVerified = false
      where.isSuspended = false
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplierProfile.findMany({
        where,
        orderBy: {
          updatedAt: 'asc' // Oldest updated first (FIFO)
        },
        skip,
        take: limit,
      }),
      prisma.supplierProfile.count({ where }),
    ])

    // Get user info separately to avoid circular dependencies
    const userIds = suppliers.map(s => s.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    // Get memberships - model has no relations, fetch package data separately
    const memberships = await prisma.supplierMembership.findMany({
      where: {
        userId: { in: userIds }
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Get package details separately
    const packageIds = [...new Set(memberships.map(m => m.packageId))]
    const packages = packageIds.length > 0 ? await prisma.supplierPackage.findMany({
      where: { id: { in: packageIds } },
      select: { id: true, name: true, type: true }
    }) : []
    const packageMap = new Map(packages.map(p => [p.id, p]))

    // Map data together - include package info from separate query
    const suppliersWithDetails = suppliers.map(s => {
      const membership = memberships.find(m => m.userId === s.userId) || null
      return {
        ...s,
        user: users.find(u => u.id === s.userId) || null,
        supplierMembership: membership ? {
          ...membership,
          package: membership.packageId ? packageMap.get(membership.packageId) || null : null
        } : null
      }
    })

    // Calculate stats using actual boolean fields
    const [totalCount, verifiedCount, pendingCount, suspendedCount] = await Promise.all([
      prisma.supplierProfile.count(),
      prisma.supplierProfile.count({ where: { isVerified: true } }),
      prisma.supplierProfile.count({ where: { isVerified: false, isSuspended: false } }),
      prisma.supplierProfile.count({ where: { isSuspended: true } }),
    ])

    const stats = {
      total: totalCount,
      pending: pendingCount,
      verified: verifiedCount,
      suspended: suspendedCount,
    }

    return NextResponse.json({
      success: true,
      data: suppliersWithDetails,
      stats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching verifications:', error)
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
    const { supplierId, action, reason } = body

    if (!supplierId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: supplierId, action' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: supplierId },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'approve':
        updateData = {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          isSuspended: false,
          suspendedAt: null,
          suspendedBy: null,
          suspendReason: null,
        }
        break
      
      case 'reject':
        if (!reason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          )
        }
        updateData = {
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null,
        }
        break
      
      case 'suspend':
        if (!reason) {
          return NextResponse.json(
            { error: 'Suspension reason is required' },
            { status: 400 }
          )
        }
        updateData = {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedBy: session.user.id,
          suspendReason: reason,
        }
        break
      
      case 'unsuspend':
        updateData = {
          isSuspended: false,
          suspendedAt: null,
          suspendedBy: null,
          suspendReason: null,
        }
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Allowed: approve, reject, suspend, unsuspend' },
          { status: 400 }
        )
    }

    // Update supplier
    const result = await prisma.supplierProfile.update({
      where: { id: supplierId },
      data: updateData,
    })

    // Get user info for email
    const user = await prisma.user.findUnique({
      where: { id: supplier.userId },
      select: { name: true, email: true },
    })

    return NextResponse.json({
      success: true,
      message: `Supplier ${action} successfully`,
      data: result,
    })
  } catch (error) {
    console.error('Error updating verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
