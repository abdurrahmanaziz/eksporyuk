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
      ]
    }

    const suppliers = await prisma.supplierProfile.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get user data separately
    const userIds = suppliers.map(s => s.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      }
    })

    // Get product counts separately
    const productCounts = await Promise.all(
      suppliers.map(async (s) => {
        const count = await prisma.supplierProduct.count({
          where: { supplierId: s.id }
        })
        return { supplierId: s.id, count }
      })
    )

    // Map user data to suppliers
    const suppliersWithUser = suppliers.map(s => {
      const user = users.find(u => u.id === s.userId)
      const productCount = productCounts.find(p => p.supplierId === s.id)?.count || 0
      return {
        ...s,
        user,
        _count: {
          products: productCount
        }
      }
    })

    // Get memberships separately
    const supplierIds = suppliersWithUser.map(s => s.user?.id).filter(Boolean) as string[]
    const memberships = await prisma.supplierMembership.findMany({
      where: {
        userId: {
          in: supplierIds
        }
      }
    })

    // Get package details separately
    const packageIds = [...new Set(memberships.map(m => m.packageId))]
    const packages = await prisma.supplierPackage.findMany({
      where: { id: { in: packageIds } },
      select: {
        id: true,
        name: true,
        type: true
      }
    })

    // Map packages to memberships
    const membershipsWithPackage = memberships.map(m => ({
      ...m,
      package: packages.find(p => p.id === m.packageId) || null
    }))

    // Get transactions for each supplier (without nested includes)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: {
          in: supplierIds
        },
        type: 'SUPPLIER_MEMBERSHIP',
        status: 'SUCCESS'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get affiliate conversions separately
    const transactionIds = transactions.map(t => t.id)
    const conversions = await prisma.affiliateConversion.findMany({
      where: {
        transactionId: { in: transactionIds }
      }
    })

    // Get affiliate profile info separately
    const affiliateIds = [...new Set(conversions.map(c => c.affiliateId))]
    const affiliateProfiles = await prisma.affiliateProfile.findMany({
      where: { id: { in: affiliateIds } }
    })
    const affiliateUserIds = affiliateProfiles.map(a => a.userId)
    const affiliateUsers = await prisma.user.findMany({
      where: { id: { in: affiliateUserIds } },
      select: { id: true, name: true, email: true, whatsapp: true }
    })

    // Map memberships and affiliate data to suppliers
    const suppliersWithMembership = suppliersWithUser.map(s => {
      const membership = membershipsWithPackage.find(m => m.userId === s.user?.id) || null
      const transaction = transactions.find(t => t.userId === s.user?.id)
      const conversion = transaction ? conversions.find(c => c.transactionId === transaction.id) : null
      
      // Get affiliate info from conversion or metadata
      let affiliateSource = null
      if (conversion) {
        const affiliateProfile = affiliateProfiles.find(a => a.id === conversion.affiliateId)
        const affiliateUser = affiliateProfile ? affiliateUsers.find(u => u.id === affiliateProfile.userId) : null
        if (affiliateUser) {
          affiliateSource = {
            affiliateName: affiliateUser.name,
            affiliateEmail: affiliateUser.email,
            affiliateWhatsapp: affiliateUser.whatsapp,
            commissionAmount: conversion.commissionAmount,
            paidOut: conversion.paidOut
          }
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
      total: suppliersWithMembership.length,
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
