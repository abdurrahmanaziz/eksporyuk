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
    const statusFilter = searchParams.get('status') // 'pending', 'recommended', 'verified', 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause based on new status workflow
    const where: any = {}

    if (statusFilter === 'pending') {
      // Show WAITING_REVIEW (waiting for mentor) - info only for admin
      where.status = 'WAITING_REVIEW'
    } else if (statusFilter === 'recommended') {
      // Show RECOMMENDED_BY_MENTOR (ready for admin approval)
      where.status = 'RECOMMENDED_BY_MENTOR'
    } else if (statusFilter === 'verified') {
      // Show VERIFIED suppliers
      where.status = 'VERIFIED'
    } else if (statusFilter === 'all') {
      // Show all except DRAFT and ONBOARDING
      where.status = {
        in: ['WAITING_REVIEW', 'RECOMMENDED_BY_MENTOR', 'VERIFIED', 'LIMITED', 'SUSPENDED']
      }
    } else {
      // Default: show only RECOMMENDED_BY_MENTOR (what admin needs to act on)
      where.status = 'RECOMMENDED_BY_MENTOR'
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplierProfile.findMany({
        where,
        include: {
          assessments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              answers: {
                include: {
                  question: true,
                },
              },
            },
          },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: {
          mentorReviewedAt: 'asc' // Oldest mentor review first (FIFO)
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

    // Get memberships
    const memberships = await prisma.supplierMembership.findMany({
      where: {
        userId: { in: userIds }
      },
      include: {
        package: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map data together
    const suppliersWithDetails = suppliers.map(s => ({
      ...s,
      user: users.find(u => u.id === s.userId) || null,
      supplierMembership: memberships.find(m => m.userId === s.userId) || null
    }))

    // Calculate stats with new status workflow
    const [statsData] = await Promise.all([
      prisma.supplierProfile.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    const stats = {
      total: total,
      waitingReview: statsData.find(s => s.status === 'WAITING_REVIEW')?._count || 0,
      recommended: statsData.find(s => s.status === 'RECOMMENDED_BY_MENTOR')?._count || 0,
      verified: statsData.find(s => s.status === 'VERIFIED')?._count || 0,
      limited: statsData.find(s => s.status === 'LIMITED')?._count || 0,
      suspended: statsData.find(s => s.status === 'SUSPENDED')?._count || 0,
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
    const { supplierId, action, reason, notes } = body

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

    // Admin can only approve suppliers that are RECOMMENDED_BY_MENTOR
    if (action === 'approve' && supplier.status !== 'RECOMMENDED_BY_MENTOR') {
      return NextResponse.json(
        { 
          error: 'Can only approve suppliers recommended by mentor',
          currentStatus: supplier.status 
        },
        { status: 400 }
      )
    }

    let newStatus: string
    let updateData: any = {}

    switch (action) {
      case 'approve':
        // RECOMMENDED_BY_MENTOR → VERIFIED
        newStatus = 'VERIFIED'
        updateData = {
          status: newStatus as any,
          isVerified: true, // Keep old field for backward compatibility
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          adminApprovedBy: session.user.id,
          adminApprovedAt: new Date(),
          adminNotes: notes || null,
        }
        break
      
      case 'limit':
        // Set to LIMITED status (needs improvement)
        newStatus = 'LIMITED'
        if (!reason) {
          return NextResponse.json(
            { error: 'Reason is required for LIMITED status' },
            { status: 400 }
          )
        }
        updateData = {
          status: newStatus as any,
          isVerified: false,
          adminApprovedBy: session.user.id,
          adminApprovedAt: new Date(),
          adminNotes: notes || reason,
        }
        break
      
      case 'reject':
        // Send back to ONBOARDING for revision
        newStatus = 'ONBOARDING'
        if (!reason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          )
        }
        updateData = {
          status: newStatus as any,
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null,
          adminApprovedBy: null,
          adminApprovedAt: null,
          adminNotes: notes || reason,
        }
        break
      
      case 'suspend':
        // Suspend supplier
        newStatus = 'SUSPENDED'
        if (!reason) {
          return NextResponse.json(
            { error: 'Suspension reason is required' },
            { status: 400 }
          )
        }
        updateData = {
          status: newStatus as any,
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedBy: session.user.id,
          suspendReason: reason,
          adminNotes: notes || reason,
        }
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Allowed: approve, limit, reject, suspend' },
          { status: 400 }
        )
    }

    // Update in transaction with audit log
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.supplierProfile.update({
        where: { id: supplierId },
        data: updateData,
      })

      // Create audit log
      await tx.supplierAuditLog.create({
        data: {
          supplierId,
          userId: session.user.id,
          action: `ADMIN_${action.toUpperCase()}`,
          fieldChanged: 'status',
          oldValue: supplier.status,
          newValue: newStatus,
          notes: notes || reason || `Admin ${action}: ${newStatus}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })

      return updated
    })

    // Get user info for email
    const user = await prisma.user.findUnique({
      where: { id: supplier.userId },
      select: { name: true, email: true },
    })

    // Send verification email notification (async, don't block response)
    if (user?.email) {
      const { sendSupplierVerificationEmail } = await import('@/lib/email/supplier-email')
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      sendSupplierVerificationEmail({
        email: user.email,
        name: user.name || supplier.companyName,
        companyName: supplier.companyName,
        status: action === 'approve' ? 'APPROVED' : action === 'suspend' ? 'SUSPENDED' : 'REJECTED',
        reason: reason || notes,
        profileUrl: `${appUrl}/supplier/profile`
      }).catch(err => console.error('Error sending verification email:', err))
    }

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
