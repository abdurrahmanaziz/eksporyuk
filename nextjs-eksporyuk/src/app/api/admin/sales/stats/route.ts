import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || searchParams.get('dateFrom')
    const endDate = searchParams.get('endDate') || searchParams.get('dateTo')

    const where: any = {}
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Get aggregate stats without relations
    const [totalStats, successStats, pendingStats, failedStats, commissionStats] = await Promise.all([
      prisma.transaction.aggregate({
        where,
        _count: true,
        _sum: { amount: true, discountAmount: true }
      }),
      prisma.transaction.aggregate({
        where: { ...where, status: 'SUCCESS' },
        _count: true,
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { ...where, status: 'PENDING' },
        _count: true,
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { ...where, status: 'FAILED' },
        _count: true
      }),
      prisma.affiliateConversion.aggregate({
        where: where.createdAt ? { createdAt: where.createdAt } : {},
        _sum: { commissionAmount: true }
      })
    ])

    const totalRevenue = Number(totalStats._sum.amount || 0)
    const totalCount = totalStats._count || 0

    const stats = {
      totalSales: totalCount,
      totalRevenue,
      totalTransactions: totalCount,
      averageOrderValue: totalCount > 0 ? totalRevenue / totalCount : 0,
      totalCommissions: Number(commissionStats._sum.commissionAmount || 0),
      pendingCommissions: 0, // Would need separate query
      successTransactions: successStats._count || 0,
      failedTransactions: failedStats._count || 0,
      pendingTransactions: pendingStats._count || 0,
      totalDiscount: Number(totalStats._sum.discountAmount || 0),
    }

    return NextResponse.json({ success: true, stats })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
