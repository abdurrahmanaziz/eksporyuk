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
    const status = searchParams.get('status') // 'active', 'inactive', 'suspended', 'all'
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      if (status === 'active') {
        where.isSuspended = false
      } else if (status === 'inactive') {
        where.isSuspended = false
      } else if (status === 'suspended') {
        where.isSuspended = true
      }
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ]
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
        },
        _count: {
          select: {
            products: true,
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

    // Get transactions with affiliate data for each supplier
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: {
          in: supplierIds
        },
        type: 'SUPPLIER_MEMBERSHIP',
        status: 'SUCCESS'
      },
      include: {
        affiliateConversion: {
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    whatsapp: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Map memberships and affiliate data to suppliers
    const suppliersWithMembership = suppliers.map(s => {
      const membership = memberships.find(m => m.userId === s.userId) || null
      const transaction = transactions.find(t => t.userId === s.userId)
      
      // Get affiliate info from conversion or metadata
      let affiliateSource = null
      if (transaction?.affiliateConversion) {
        affiliateSource = {
          affiliateName: transaction.affiliateConversion.affiliate.user.name,
          affiliateEmail: transaction.affiliateConversion.affiliate.user.email,
          affiliateWhatsapp: transaction.affiliateConversion.affiliate.user.whatsapp,
          commissionAmount: transaction.affiliateConversion.commissionAmount,
          paidOut: transaction.affiliateConversion.paidOut
        }
      } else if (transaction?.metadata && typeof transaction.metadata === 'object') {
        const metadata = transaction.metadata as any
        if (metadata.affiliateId) {
          affiliateSource = {
            affiliateName: metadata.affiliateName || 'Unknown',
            affiliateEmail: null,
            affiliateWhatsapp: null,
            commissionAmount: null,
            paidOut: false
          }
        }
      }

      return {
        ...s,
        supplierMembership: membership,
        affiliateSource
      }
    })

    // Calculate stats
    const stats = {
      total: suppliers.length,
      active: suppliersWithMembership.filter(s => !s.isSuspended && s.supplierMembership?.isActive).length,
      inactive: suppliersWithMembership.filter(s => !s.isSuspended && !s.supplierMembership?.isActive).length,
      suspended: suppliers.filter(s => s.isSuspended).length,
    }

    return NextResponse.json({
      data: suppliersWithMembership,
      stats,
    })
  } catch (error) {
    console.error('Error fetching supplier users:', error)
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
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'suspend':
        updateData = {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedBy: session.user.id,
          suspendReason: reason || 'Suspended by admin',
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
      case 'verify':
        updateData = {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
        }
        break
      case 'unverify':
        updateData = {
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null,
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

    return NextResponse.json({
      message: 'Supplier updated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
