import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/affiliate-commissions
 * 
 * Get all affiliate commissions with transaction details
 * Filters: status (all, paid, unpaid), period (7d, 15d, 30d, thisMonth, all)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all' // all, paid, unpaid
    const period = searchParams.get('period') || 'all' // 7d, 15d, 30d, thisMonth, all
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build date filter
    let dateFilter: Date | undefined
    const now = new Date()
    
    switch (period) {
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '15d':
        dateFilter = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'thisMonth':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'lastMonth':
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        break
    }

    // Build where clause
    const where: any = {}
    
    if (status === 'paid') {
      where.paidOut = true
    } else if (status === 'unpaid') {
      where.paidOut = false
    }
    
    if (dateFilter) {
      where.createdAt = { gte: dateFilter }
    }

    // Get all conversions with transaction and affiliate details
    const conversions = await prisma.affiliateConversion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Get transaction and affiliate details manually (no relations in schema)
    const enrichedConversions = await Promise.all(
      conversions.map(async (conv) => {
        // Get transaction
        const transaction = await prisma.transaction.findUnique({
          where: { id: conv.transactionId },
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            type: true,
            status: true,
            customerName: true,
            customerEmail: true,
            membershipId: true,
            productId: true,
            courseId: true,
            createdAt: true,
            paidAt: true,
          }
        })

        // Get affiliate profile
        const affiliateProfile = await prisma.affiliateProfile.findFirst({
          where: {
            OR: [
              { id: conv.affiliateId },
              { userId: conv.affiliateId }
            ]
          },
          select: {
            id: true,
            userId: true,
            affiliateCode: true,
            bankName: true,
            bankAccountName: true,
            bankAccountNumber: true,
          }
        })

        // Get affiliate user
        let affiliateUser = null
        if (affiliateProfile) {
          affiliateUser = await prisma.user.findUnique({
            where: { id: affiliateProfile.userId },
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true,
            }
          })
        }

        // Get wallet balance
        let walletBalance = 0
        if (affiliateProfile) {
          const wallet = await prisma.wallet.findUnique({
            where: { userId: affiliateProfile.userId }
          })
          walletBalance = Number(wallet?.balance || 0)
        }

        // Get product/membership/course name
        let itemName = 'Unknown'
        if (transaction?.membershipId) {
          const membership = await prisma.membership.findUnique({
            where: { id: transaction.membershipId },
            select: { name: true }
          })
          itemName = membership?.name || 'Membership'
        } else if (transaction?.productId) {
          const product = await prisma.product.findUnique({
            where: { id: transaction.productId },
            select: { name: true }
          })
          itemName = product?.name || 'Product'
        } else if (transaction?.courseId) {
          const course = await prisma.course.findUnique({
            where: { id: transaction.courseId },
            select: { title: true }
          })
          itemName = course?.title || 'Course'
        }

        return {
          id: conv.id,
          transactionId: conv.transactionId,
          affiliateId: conv.affiliateId,
          commissionAmount: Number(conv.commissionAmount),
          commissionRate: Number(conv.commissionRate),
          commissionType: conv.commissionType || 'PERCENTAGE',
          paidOut: conv.paidOut,
          paidOutAt: conv.paidOutAt,
          createdAt: conv.createdAt,
          transaction: transaction ? {
            ...transaction,
            amount: Number(transaction.amount),
            itemName,
          } : null,
          affiliate: affiliateProfile ? {
            id: affiliateProfile.id,
            userId: affiliateProfile.userId,
            affiliateCode: affiliateProfile.affiliateCode,
            bankName: affiliateProfile.bankName,
            bankAccountName: affiliateProfile.bankAccountName,
            bankAccountNumber: affiliateProfile.bankAccountNumber,
            user: affiliateUser,
            walletBalance,
          } : null,
        }
      })
    )

    // Apply search filter after enrichment
    let filteredConversions = enrichedConversions
    if (search) {
      const searchLower = search.toLowerCase()
      filteredConversions = enrichedConversions.filter(conv => 
        conv.affiliate?.user?.name?.toLowerCase().includes(searchLower) ||
        conv.affiliate?.user?.email?.toLowerCase().includes(searchLower) ||
        conv.affiliate?.affiliateCode?.toLowerCase().includes(searchLower) ||
        conv.transaction?.customerName?.toLowerCase().includes(searchLower) ||
        conv.transaction?.invoiceNumber?.toLowerCase().includes(searchLower)
      )
    }

    // Get total count
    const totalCount = await prisma.affiliateConversion.count({ where })

    // Get stats
    const allConversions = await prisma.affiliateConversion.findMany({
      where: dateFilter ? { createdAt: { gte: dateFilter } } : {},
      select: {
        commissionAmount: true,
        paidOut: true,
      }
    })

    const stats = {
      totalCommissions: allConversions.length,
      totalAmount: allConversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0),
      paidAmount: allConversions.filter(c => c.paidOut).reduce((sum, c) => sum + Number(c.commissionAmount), 0),
      unpaidAmount: allConversions.filter(c => !c.paidOut).reduce((sum, c) => sum + Number(c.commissionAmount), 0),
      paidCount: allConversions.filter(c => c.paidOut).length,
      unpaidCount: allConversions.filter(c => !c.paidOut).length,
    }

    // Get chart data (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const chartConversions = await prisma.affiliateConversion.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        commissionAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }
    })

    // Group by date
    const chartData: { date: string; amount: number; count: number }[] = []
    const dateMap = new Map<string, { amount: number; count: number }>()
    
    chartConversions.forEach(conv => {
      const dateKey = conv.createdAt.toISOString().split('T')[0]
      const existing = dateMap.get(dateKey) || { amount: 0, count: 0 }
      dateMap.set(dateKey, {
        amount: existing.amount + Number(conv.commissionAmount),
        count: existing.count + 1
      })
    })

    // Fill in missing dates
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      const data = dateMap.get(dateKey) || { amount: 0, count: 0 }
      chartData.push({
        date: dateKey,
        amount: data.amount,
        count: data.count
      })
    }

    return NextResponse.json({
      success: true,
      commissions: filteredConversions,
      stats,
      chartData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('[Admin Affiliate Commissions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/affiliate-commissions
 * 
 * Mark commissions as paid (bulk or single)
 * This will:
 * 1. Update AffiliateConversion.paidOut = true
 * 2. Deduct from Wallet.balance
 * 3. Create WalletTransaction record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversionIds, notes } = body

    if (!conversionIds || !Array.isArray(conversionIds) || conversionIds.length === 0) {
      return NextResponse.json(
        { error: 'conversionIds array is required' },
        { status: 400 }
      )
    }

    // Get conversions to process
    const conversions = await prisma.affiliateConversion.findMany({
      where: {
        id: { in: conversionIds },
        paidOut: false // Only process unpaid ones
      }
    })

    if (conversions.length === 0) {
      return NextResponse.json(
        { error: 'No unpaid commissions found with the provided IDs' },
        { status: 400 }
      )
    }

    // Group by affiliate to process wallet updates
    const affiliateAmounts = new Map<string, { total: number; conversionIds: string[] }>()
    
    for (const conv of conversions) {
      // Get affiliate profile to find userId
      const affiliateProfile = await prisma.affiliateProfile.findFirst({
        where: {
          OR: [
            { id: conv.affiliateId },
            { userId: conv.affiliateId }
          ]
        }
      })

      const userId = affiliateProfile?.userId || conv.affiliateId
      const existing = affiliateAmounts.get(userId) || { total: 0, conversionIds: [] }
      affiliateAmounts.set(userId, {
        total: existing.total + Number(conv.commissionAmount),
        conversionIds: [...existing.conversionIds, conv.id]
      })
    }

    // Process each affiliate's payout
    const results: any[] = []
    const errors: any[] = []

    for (const [userId, data] of affiliateAmounts) {
      try {
        // Get wallet
        const wallet = await prisma.wallet.findUnique({
          where: { userId }
        })

        if (!wallet) {
          errors.push({
            userId,
            error: 'Wallet not found'
          })
          continue
        }

        const currentBalance = Number(wallet.balance)
        
        if (currentBalance < data.total) {
          errors.push({
            userId,
            error: `Insufficient balance. Has Rp ${currentBalance.toLocaleString()}, needs Rp ${data.total.toLocaleString()}`
          })
          continue
        }

        // Update in transaction
        await prisma.$transaction(async (tx) => {
          // 1. Mark conversions as paid
          await tx.affiliateConversion.updateMany({
            where: { id: { in: data.conversionIds } },
            data: {
              paidOut: true,
              paidOutAt: new Date()
            }
          })

          // 2. Deduct from wallet balance
          await tx.wallet.update({
            where: { userId },
            data: {
              balance: { decrement: data.total },
              totalPayout: { increment: data.total }
            }
          })

          // 3. Create wallet transaction record
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: -data.total, // Negative for deduction
              type: 'PAYOUT',
              description: `Pembayaran komisi affiliate (${data.conversionIds.length} transaksi)${notes ? ` - ${notes}` : ''}`,
              reference: `payout_${Date.now()}`,
              metadata: {
                conversionIds: data.conversionIds,
                processedBy: session.user.id,
                processedAt: new Date().toISOString(),
                notes
              }
            }
          })
        })

        results.push({
          userId,
          amount: data.total,
          conversionsProcessed: data.conversionIds.length
        })

      } catch (err: any) {
        errors.push({
          userId,
          error: err.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} affiliate(s), ${conversions.length} commission(s)`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      totalPaid: results.reduce((sum, r) => sum + r.amount, 0)
    })

  } catch (error) {
    console.error('[Admin Affiliate Commissions] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to process commissions' },
      { status: 500 }
    )
  }
}
