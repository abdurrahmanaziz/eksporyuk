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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { ...where.createdAt, lte: end }
    }

    // Total sales (SUCCESS only)
    const totalSales = await prisma.transaction.count({
      where: { ...where, status: 'SUCCESS' },
    })

    // Total revenue (SUCCESS only)
    const revenueData = await prisma.transaction.aggregate({
      where: { ...where, status: 'SUCCESS' },
      _sum: { amount: true },
    })

    // Total transactions (all statuses)
    const totalTransactions = await prisma.transaction.count({ where })

    // Transaction counts by status
    const successTransactions = await prisma.transaction.count({
      where: { ...where, status: 'SUCCESS' },
    })
    const failedTransactions = await prisma.transaction.count({
      where: { ...where, status: 'FAILED' },
    })
    const pendingTransactions = await prisma.transaction.count({
      where: { ...where, status: 'PENDING' },
    })

    // Total discounts given
    const discountData = await prisma.transaction.aggregate({
      where: { ...where, status: 'SUCCESS' },
      _sum: { discountAmount: true },
    })

    // Total affiliate commissions
    const commissionData = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true },
    })
    
    // Pending affiliate commissions (not paid out)
    const pendingCommissionData = await prisma.affiliateConversion.aggregate({
      where: { paidOut: false },
      _sum: { commissionAmount: true },
    })

    // Average order value
    const averageOrderValue =
      totalSales > 0 ? Number(revenueData._sum.amount || 0) / totalSales : 0

    return NextResponse.json({
      totalSales,
      totalRevenue: Number(revenueData._sum.amount || 0),
      totalTransactions,
      averageOrderValue: Math.round(averageOrderValue),
      successTransactions,
      failedTransactions,
      pendingTransactions,
      totalDiscount: Number(discountData._sum.discountAmount || 0),
      totalCommissions: Number(commissionData._sum.commissionAmount || 0),
      pendingCommissions: Number(pendingCommissionData._sum.commissionAmount || 0),
    })
  } catch (error) {
    console.error('Error fetching transaction stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
