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
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    const skip = (page - 1) * limit

    // STRATEGY: Query from AffiliateConversion first (source of truth for affiliate data)
    // Then join with Transaction for details
    
    // Build where clause for conversions
    const conversionWhere: any = {
      affiliateId: affiliateProfile.id,
    }

    // Date range filter
    if (dateFrom || dateTo) {
      conversionWhere.createdAt = {}
      if (dateFrom) {
        conversionWhere.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        conversionWhere.createdAt.lte = new Date(dateTo + 'T23:59:59')
      }
    }

    // Get total conversions count
    const total = await prisma.affiliateConversion.count({
      where: conversionWhere,
    })

    // Get conversions with pagination
    const conversions = await prisma.affiliateConversion.findMany({
      where: conversionWhere,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    // Get transaction IDs
    const transactionIds = conversions.map(c => c.transactionId).filter(Boolean)

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds }
      },
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
        userId: true,
      }
    })

    const txMap = new Map(transactions.map(t => [t.id, t]))

    // Get product/membership names
    const productIds = transactions.map(t => t.productId).filter(Boolean) as string[]
    const membershipIds = transactions.map(t => t.membershipId).filter(Boolean) as string[]
    const userIds = transactions.map(t => t.userId).filter(Boolean) as string[]

    const [products, memberships, users] = await Promise.all([
      productIds.length > 0 ? prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      }) : [],
      membershipIds.length > 0 ? prisma.membership.findMany({
        where: { id: { in: membershipIds } },
        select: { id: true, name: true }
      }) : [],
      userIds.length > 0 ? prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      }) : []
    ])

    const productMap = new Map(products.map(p => [p.id, p.name]))
    const membershipMap = new Map(memberships.map(m => [m.id, m.name]))
    const userMap = new Map(users.map(u => [u.id, { name: u.name, email: u.email }]))

    // Map conversions with transaction and product data
    const enrichedTransactions = conversions.map(conv => {
      const tx = txMap.get(conv.transactionId)
      const user = tx?.userId ? userMap.get(tx.userId) : null
      
      return {
        id: conv.id,
        transactionId: conv.transactionId,
        invoiceNumber: tx?.invoiceNumber || null,
        amount: tx ? Number(tx.amount) : 0,
        customerName: tx?.customerName || user?.name || null,
        customerEmail: tx?.customerEmail || user?.email || null,
        customerPhone: tx?.customerPhone || null,
        status: tx?.status || 'SUCCESS',
        paymentMethod: tx?.paymentMethod || null,
        paidAt: tx?.paidAt || null,
        createdAt: conv.createdAt,
        productName: tx?.productId ? productMap.get(tx.productId) : null,
        membershipName: tx?.membershipId ? membershipMap.get(tx.membershipId) : null,
        itemName: tx?.productId ? productMap.get(tx.productId) : 
                  tx?.membershipId ? membershipMap.get(tx.membershipId) : 'Produk',
        commission: {
          amount: Number(conv.commissionAmount),
          rate: Number(conv.commissionRate),
          paidOut: conv.paidOut,
          paidOutAt: conv.paidOutAt,
        }
      }
    }).filter(t => {
      // Apply status filter (filter after mapping since status comes from transaction)
      if (status !== 'all' && t.status !== status) return false
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchName = t.customerName?.toLowerCase().includes(searchLower)
        const matchEmail = t.customerEmail?.toLowerCase().includes(searchLower)
        const matchInvoice = t.invoiceNumber?.toLowerCase().includes(searchLower)
        if (!matchName && !matchEmail && !matchInvoice) return false
      }
      
      return true
    })

    // Calculate stats using aggregation (more efficient than fetching all records)
    const [statsResult, paidOutStats] = await Promise.all([
      prisma.affiliateConversion.aggregate({
        where: { affiliateId: affiliateProfile.id },
        _count: { id: true },
        _sum: { commissionAmount: true }
      }),
      prisma.affiliateConversion.aggregate({
        where: { 
          affiliateId: affiliateProfile.id,
          paidOut: true
        },
        _sum: { commissionAmount: true }
      })
    ])

    const totalCommission = Number(statsResult._sum.commissionAmount || 0)
    const paidCommission = Number(paidOutStats._sum.commissionAmount || 0)

    const stats = {
      totalTransactions: statsResult._count.id,
      paidTransactions: statsResult._count.id, // Simplified - all conversions are from paid transactions
      pendingTransactions: 0,
      totalRevenue: 0, // Would need separate query - skip for performance
      totalCommission,
      paidCommission,
      pendingCommission: totalCommission - paidCommission,
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
