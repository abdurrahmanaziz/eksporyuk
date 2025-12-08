import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'verified', 'all'

    // Build where clause
    const where: any = {}

    if (status === 'pending') {
      where.isVerified = false
      where.OR = [
        { legalityDoc: { not: null } },
        { nibDoc: { not: null } },
      ]
    } else if (status === 'verified') {
      where.isVerified = true
    }

    const suppliers = await prisma.supplierProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get memberships separately
    const supplierIds = suppliers.map(s => s.userId)
    const memberships = await prisma.supplierMembership.findMany({
      where: {
        userId: {
          in: supplierIds
        }
      },
      include: {
        package: {
          select: {
            name: true,
            type: true
          }
        }
      }
    })

    // Map memberships
    const suppliersWithMembership = suppliers.map(s => ({
      ...s,
      supplierMembership: memberships.find(m => m.userId === s.userId) || null
    }))

    // Calculate stats
    const stats = {
      total: suppliers.length,
      pending: suppliers.filter(s => !s.isVerified && (s.legalityDoc || s.nibDoc)).length,
      verified: suppliers.filter(s => s.isVerified).length,
    }

    return NextResponse.json({
      data: suppliersWithMembership,
      stats,
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
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: supplierId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
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
          verificationStatus: 'APPROVED',
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          verificationReason: null
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
          verificationStatus: 'REJECTED',
          verifiedAt: null,
          verifiedBy: null,
          verificationReason: reason
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updated = await prisma.supplierProfile.update({
      where: { id: supplierId },
      data: updateData,
    })

    // Send verification email notification
    const { sendSupplierVerificationEmail } = await import('@/lib/email/supplier-email')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    sendSupplierVerificationEmail({
      email: supplier.user.email,
      name: supplier.user.name,
      companyName: supplier.companyName,
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      reason: action === 'reject' ? reason : undefined,
      profileUrl: `${appUrl}/supplier/profile`
    }).catch(err => console.error('Error sending verification email:', err))

    return NextResponse.json({
      message: 'Verification updated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
