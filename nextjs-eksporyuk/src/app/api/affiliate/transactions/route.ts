import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({
        transactions: [],
        total: 0,
        stats: {
          totalTransactions: 0,
          totalRevenue: 0,
          totalCommission: 0,
          paidCommission: 0,
          pendingCommission: 0,
        }
      })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all' // all, PAID, PENDING, EXPIRED
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    const skip = (page - 1) * limit

    // Build where clause for transactions
    const whereClause: any = {
      affiliateId: affiliateProfile.id,
    }

    // Filter by status
    if (status !== 'all') {
      whereClause.status = status
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.createdAt = {}
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo + 'T23:59:59')
      }
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.transaction.count({
      where: whereClause,
    })

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        createdAt: true,
        productId: true,
        membershipId: true,
        couponId: true,
        metadata: true,
      }
    })

    // Get product/membership names
    const productIds = transactions.map(t => t.productId).filter(Boolean) as string[]
    const membershipIds = transactions.map(t => t.membershipId).filter(Boolean) as string[]

    const [products, memberships] = await Promise.all([
      productIds.length > 0 ? prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      }) : [],
      membershipIds.length > 0 ? prisma.membership.findMany({
        where: { id: { in: membershipIds } },
        select: { id: true, name: true }
      }) : []
    ])

    const productMap = new Map(products.map(p => [p.id, p.name]))
    const membershipMap = new Map(memberships.map(m => [m.id, m.name]))

    // Get conversions for these transactions
    const transactionIds = transactions.map(t => t.id)
    const conversions = await prisma.affiliateConversion.findMany({
      where: {
        transactionId: { in: transactionIds },
        affiliateId: affiliateProfile.id,
      },
      select: {
        transactionId: true,
        commissionAmount: true,
        commissionRate: true,
        paidOut: true,
        paidOutAt: true,
      }
    })
    const conversionMap = new Map(conversions.map(c => [c.transactionId, c]))

    // Map transactions with additional data
    const enrichedTransactions = transactions.map(tx => {
      const conversion = conversionMap.get(tx.id)
      return {
        ...tx,
        productName: tx.productId ? productMap.get(tx.productId) : null,
        membershipName: tx.membershipId ? membershipMap.get(tx.membershipId) : null,
        itemName: tx.productId ? productMap.get(tx.productId) : 
                  tx.membershipId ? membershipMap.get(tx.membershipId) : 'Unknown',
        commission: conversion ? {
          amount: Number(conversion.commissionAmount),
          rate: Number(conversion.commissionRate),
          paidOut: conversion.paidOut,
          paidOutAt: conversion.paidOutAt,
        } : null
      }
    })

    // Calculate stats for all affiliate transactions
    const allTransactions = await prisma.transaction.findMany({
      where: {
        affiliateId: affiliateProfile.id,
      },
      select: {
        id: true,
        amount: true,
        status: true,
      }
    })

    const allConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliateProfile.id,
      },
      select: {
        commissionAmount: true,
        paidOut: true,
      }
    })

    const stats = {
      totalTransactions: allTransactions.length,
      paidTransactions: allTransactions.filter(t => t.status === 'PAID').length,
      pendingTransactions: allTransactions.filter(t => t.status === 'PENDING').length,
      totalRevenue: allTransactions
        .filter(t => t.status === 'PAID')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      totalCommission: allConversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0),
      paidCommission: allConversions
        .filter(c => c.paidOut)
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0),
      pendingCommission: allConversions
        .filter(c => !c.paidOut)
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0),
    }

    return NextResponse.json({
      transactions: enrichedTransactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    })

  } catch (error: any) {
    console.error('Error fetching affiliate transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
