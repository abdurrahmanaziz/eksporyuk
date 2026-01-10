import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/affiliate/commissions - Get affiliate's own commissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // all, pending, paid, refunded
    const period = searchParams.get('period') || 'all' // 7d, 15d, 30d, thisMonth, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build date filter
    let dateFilter: any = {}
    const now = new Date()
    
    if (period === '7d') {
      dateFilter.createdAt = {
        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }
    } else if (period === '15d') {
      dateFilter.createdAt = {
        gte: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
      }
    } else if (period === '30d') {
      dateFilter.createdAt = {
        gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
    } else if (period === 'thisMonth') {
      dateFilter.createdAt = {
        gte: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }

    // Build status filter for transactions
    let statusFilter: any = {}
    if (status === 'pending') {
      statusFilter.paidOut = false
    } else if (status === 'paid') {
      statusFilter.paidOut = true
    } else if (status === 'refunded') {
      statusFilter.status = 'REFUNDED'
    }

    // Get transactions where this affiliate earned commission
    const whereClause = {
      affiliateId: affiliateProfile.id,
      ...dateFilter,
      ...statusFilter
    }

    // Get commissions from AffiliateConversion
    const [conversions, total] = await Promise.all([
      prisma.affiliateConversion.findMany({
        where: whereClause,
        include: {
          transaction: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              membership: {
                select: {
                  id: true,
                  name: true
                }
              },
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
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
      where: {
        affiliateId: affiliateProfile.id,
        ...dateFilter
      },
      select: {
        commissionAmount: true,
        paidOut: true,
        status: true
      }
    })

    const stats = {
      totalCommissions: allConversions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      pendingAmount: allConversions
        .filter(c => !c.paidOut && c.status !== 'REFUNDED')
        .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      paidAmount: allConversions
        .filter(c => c.paidOut)
        .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      refundedAmount: allConversions
        .filter(c => c.status === 'REFUNDED')
        .reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
      totalTransactions: allConversions.length,
      pendingCount: allConversions.filter(c => !c.paidOut && c.status !== 'REFUNDED').length,
      paidCount: allConversions.filter(c => c.paidOut).length
    }

    // Format response
    const formattedCommissions = conversions.map(conv => ({
      id: conv.id,
      transactionId: conv.transactionId,
      transaction: conv.transaction ? {
        id: conv.transaction.id,
        invoiceNumber: conv.transaction.invoiceNumber,
        amount: conv.transaction.amount,
        status: conv.transaction.status,
        createdAt: conv.transaction.createdAt,
        buyer: conv.transaction.user ? {
          name: conv.transaction.user.name,
          email: conv.transaction.user.email
        } : null,
        item: conv.transaction.membership?.name || conv.transaction.product?.name || 'Unknown',
        itemType: conv.transaction.membership ? 'membership' : 'product'
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
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching affiliate commissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}
