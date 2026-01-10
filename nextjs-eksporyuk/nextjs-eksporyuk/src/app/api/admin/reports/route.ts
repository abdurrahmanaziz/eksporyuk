import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths } from 'date-fns'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin - first check session role, then fallback to database
    let isAdmin = session.user.role === 'ADMIN'
    
    if (!isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      isAdmin = user?.role === 'ADMIN'
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'thisMonth'

    // Calculate date ranges
    let startDate: Date
    let endDate: Date
    let previousStartDate: Date
    let previousEndDate: Date
    const now = new Date()

    switch (period) {
      case 'today':
        startDate = startOfDay(now)
        endDate = endOfDay(now)
        previousStartDate = startOfDay(subDays(now, 1))
        previousEndDate = endOfDay(subDays(now, 1))
        break
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1))
        endDate = endOfDay(subDays(now, 1))
        previousStartDate = startOfDay(subDays(now, 2))
        previousEndDate = endOfDay(subDays(now, 2))
        break
      case 'thisWeek':
        startDate = startOfWeek(now, { weekStartsOn: 1 })
        endDate = endOfWeek(now, { weekStartsOn: 1 })
        previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        previousEndDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        break
      case 'lastWeek':
        startDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        endDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        previousStartDate = startOfWeek(subWeeks(now, 2), { weekStartsOn: 1 })
        previousEndDate = endOfWeek(subWeeks(now, 2), { weekStartsOn: 1 })
        break
      case 'thisMonth':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        previousStartDate = startOfMonth(subMonths(now, 1))
        previousEndDate = endOfMonth(subMonths(now, 1))
        break
      case 'lastMonth':
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfMonth(subMonths(now, 1))
        previousStartDate = startOfMonth(subMonths(now, 2))
        previousEndDate = endOfMonth(subMonths(now, 2))
        break
      case 'thisYear':
        startDate = startOfYear(now)
        endDate = endOfYear(now)
        previousStartDate = startOfYear(subMonths(now, 12))
        previousEndDate = endOfYear(subMonths(now, 12))
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        previousStartDate = startOfMonth(subMonths(now, 1))
        previousEndDate = endOfMonth(subMonths(now, 1))
    }

    // Get revenue data from Transaction model
    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: previousStartDate, lte: previousEndDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    // Get expenses (affiliate commissions from AffiliateConversion)
    const [currentExpenses, previousExpenses] = await Promise.all([
      prisma.affiliateConversion.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { commissionAmount: true },
      }),
      prisma.affiliateConversion.aggregate({
        where: {
          createdAt: { gte: previousStartDate, lte: previousEndDate },
        },
        _sum: { commissionAmount: true },
      }),
    ])

    const totalRevenue = Number(currentRevenue._sum.amount) || 0
    const prevRevenue = Number(previousRevenue._sum.amount) || 0
    const totalExpenses = Number(currentExpenses._sum.commissionAmount) || 0
    const prevExpenses = Number(previousExpenses._sum.commissionAmount) || 0
    const netProfit = totalRevenue - totalExpenses
    const prevNetProfit = prevRevenue - prevExpenses

    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
    const expenseGrowth = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0
    const profitGrowth = prevNetProfit > 0 ? ((netProfit - prevNetProfit) / prevNetProfit) * 100 : 0

    const totalTransactions = currentRevenue._count
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    // Revenue by transaction type
    const transactionsByType = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    })

    const revenueByCategory = transactionsByType.map(item => ({
      category: item.type || 'Other',
      amount: Number(item._sum.amount) || 0,
      percentage: totalRevenue > 0 ? Math.round((Number(item._sum.amount) || 0) / totalRevenue * 100) : 0,
    }))

    // Top products from transactions
    const topProducts = await prisma.transaction.groupBy({
      by: ['productId'],
      where: {
        status: 'SUCCESS',
        productId: { not: null },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    })

    const productIds = topProducts.map(p => p.productId).filter(Boolean) as string[]
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    }) : []

    const topProductsFormatted = topProducts.map(p => ({
      name: products.find(prod => prod.id === p.productId)?.name || 'Unknown',
      revenue: Number(p._sum.amount) || 0,
      quantity: p._count,
    }))

    // Affiliate commissions from AffiliateConversion
    const affiliateCommissions = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { commissionAmount: true },
      _count: true,
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: 10,
    })

    const affiliateIds = affiliateCommissions.map(a => a.affiliateId)
    const affiliates = affiliateIds.length > 0 ? await prisma.affiliateProfile.findMany({
      where: { id: { in: affiliateIds } }
    }) : []

    // Fetch users for affiliates
    const affiliateUserIds = affiliates.map(a => a.userId)
    const affiliateUsers = affiliateUserIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: affiliateUserIds } },
      select: { id: true, name: true }
    }) : []
    const affiliateUserMap = new Map(affiliateUsers.map(u => [u.id, u]))

    const affiliateCommissionsFormatted = affiliateCommissions.map(a => {
      const affiliate = affiliates.find(aff => aff.id === a.affiliateId)
      const user = affiliate ? affiliateUserMap.get(affiliate.userId) : null
      return {
        name: user?.name || 'Unknown',
        totalCommission: Number(a._sum.commissionAmount) || 0,
        sales: a._count,
      }
    })

    // Payout summary
    const [pendingPayouts, approvedPayouts, paidPayouts] = await Promise.all([
      prisma.payout.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.payout.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      prisma.payout.aggregate({
        where: { 
          status: 'PAID',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
    ])

    return NextResponse.json({
      overview: {
        totalRevenue,
        revenueGrowth,
        totalExpenses,
        expenseGrowth,
        netProfit,
        profitGrowth,
        totalTransactions,
        avgOrderValue,
      },
      revenueByCategory,
      revenueByPeriod: [],
      topProducts: topProductsFormatted,
      affiliateCommissions: affiliateCommissionsFormatted,
      payoutSummary: {
        pending: Number(pendingPayouts._sum.amount) || 0,
        approved: Number(approvedPayouts._sum.amount) || 0,
        paid: Number(paidPayouts._sum.amount) || 0,
      },
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
