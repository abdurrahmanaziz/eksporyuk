import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/affiliate-commissions - Get all affiliate commissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const period = searchParams.get('period') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build date filter
    let dateFilter: any = {}
    const now = new Date()
    
    if (period === '7d') {
      dateFilter.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
    } else if (period === '15d') {
      dateFilter.createdAt = { gte: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) }
    } else if (period === '30d') {
      dateFilter.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    } else if (period === 'thisMonth') {
      dateFilter.createdAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    }

    // Build status filter
    let statusFilter: any = {}
    if (status === 'pending') {
      statusFilter.paidOut = false
    } else if (status === 'paid') {
      statusFilter.paidOut = true
    } else if (status === 'refunded') {
      statusFilter.status = 'REFUNDED'
    }

    // Build search filter
    let searchFilter: any = {}
    if (search) {
      searchFilter.OR = [
        { affiliate: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { transactionId: { contains: search, mode: 'insensitive' } }
      ]
    }

    const whereClause = {
      ...dateFilter,
      ...statusFilter,
      ...searchFilter
    }

    // Get commissions
    const [conversions, total] = await Promise.all([
      prisma.affiliateConversion.findMany({
        where: whereClause,
        include: {
          affiliate: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          },
          transaction: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              membership: { select: { id: true, name: true } },
              product: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.affiliateConversion.count({ where: whereClause })
    ])

    // Calculate stats
    const allConversions = await prisma.affiliateConversion.findMany({
      where: dateFilter,
      select: { commissionAmount: true, paidOut: true, status: true }
    })

    const stats = {
      totalCommissions: allConversions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      pendingAmount: allConversions.filter(c => !c.paidOut && c.status !== 'REFUNDED').reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      paidAmount: allConversions.filter(c => c.paidOut).reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      refundedAmount: allConversions.filter(c => c.status === 'REFUNDED').reduce((sum, c) => sum + (c.commissionAmount || 0), 0)
    }

    const formattedCommissions = conversions.map(conv => ({
      id: conv.id,
      transactionId: conv.transactionId,
      transaction: conv.transaction ? {
        id: conv.transaction.id,
        invoiceNumber: conv.transaction.invoiceNumber,
        amount: conv.transaction.amount,
        status: conv.transaction.status,
        createdAt: conv.transaction.createdAt,
        buyer: conv.transaction.user,
        item: conv.transaction.membership?.name || conv.transaction.product?.name || 'Unknown',
        itemType: conv.transaction.membership ? 'membership' : 'product'
      } : null,
      affiliate: conv.affiliate ? {
        id: conv.affiliate.id,
        userId: conv.affiliate.userId,
        name: conv.affiliate.user?.name || 'Unknown',
        email: conv.affiliate.user?.email || ''
      } : null,
      commissionAmount: conv.commissionAmount,
      commissionRate: conv.commissionRate,
      commissionType: conv.commissionType,
      paidOut: conv.paidOut,
      paidAt: conv.paidAt,
      status: conv.status,
      createdAt: conv.createdAt
    }))

    return NextResponse.json({
      success: true,
      data: formattedCommissions,
      stats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching affiliate commissions:', error)
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
  }
}

// POST /api/admin/affiliate-commissions - Mark commission as paid
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversionIds } = body

    if (!conversionIds || !Array.isArray(conversionIds) || conversionIds.length === 0) {
      return NextResponse.json({ error: 'No conversion IDs provided' }, { status: 400 })
    }

    // Update conversions to paid
    const result = await prisma.affiliateConversion.updateMany({
      where: { id: { in: conversionIds }, paidOut: false },
      data: { paidOut: true, paidAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} commission(s) marked as paid`
    })
  } catch (error) {
    console.error('Error marking commissions as paid:', error)
    return NextResponse.json({ error: 'Failed to update commissions' }, { status: 500 })
  }
}
