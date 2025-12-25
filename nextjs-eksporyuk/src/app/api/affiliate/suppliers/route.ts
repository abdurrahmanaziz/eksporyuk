import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Build where clause for conversions
    const where: any = {
      affiliateId: affiliateProfile.id,
    }

    if (status === 'paid') {
      where.paidOut = true
    } else if (status === 'pending') {
      where.paidOut = false
    }

    // Get supplier conversions (without transaction include since no relation exists)
    const conversions = await prisma.affiliateConversion.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get transaction details separately
    const conversionsWithTransactions = await Promise.all(
      conversions.map(async (conversion) => {
        const transaction = await prisma.transaction.findUnique({
          where: { id: conversion.transactionId },
          select: {
            id: true,
            amount: true,
            status: true,
            customerName: true,
            customerEmail: true,
            paidAt: true,
            metadata: true,
          },
        })
        return { ...conversion, transaction }
      })
    )

    // Filter to only supplier memberships
    const supplierConversions = conversionsWithTransactions.filter(
      c => c.transaction?.metadata && typeof c.transaction.metadata === 'object' && 
           (c.transaction.metadata as any).type === 'SUPPLIER_MEMBERSHIP'
    )

    // Calculate stats
    const allConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliateProfile.id,
      },
    })

    const stats = {
      totalSuppliers: supplierConversions.length,
      activeSuppliers: supplierConversions.filter(c => c.transaction?.status === 'SUCCESS').length,
      totalCommission: supplierConversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0),
      paidCommission: supplierConversions
        .filter(c => c.paidOut)
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0),
      pendingCommission: supplierConversions
        .filter(c => !c.paidOut)
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0),
    }

    return NextResponse.json({
      conversions: supplierConversions,
      stats,
    })
  } catch (error) {
    console.error('Error fetching supplier conversions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
