import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        affiliateConversion: {
          include: {
            affiliate: true
          }
        }
      }
    })

    // Calculate stats
    const stats = {
      totalSales: transactions.length,
      totalRevenue: transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
      totalTransactions: transactions.length,
      averageOrderValue: transactions.length > 0 
        ? transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0) / transactions.length 
        : 0,
      totalCommissions: transactions.reduce((sum, tx) => 
        sum + (tx.affiliateConversion?.commissionAmount || 0), 0
      ),
      pendingCommissions: transactions
        .filter(tx => tx.status === 'PENDING')
        .reduce((sum, tx) => sum + (tx.affiliateConversion?.commissionAmount || 0), 0),
      successTransactions: transactions.filter(tx => tx.status === 'SUCCESS').length,
      failedTransactions: transactions.filter(tx => tx.status === 'FAILED').length,
      pendingTransactions: transactions.filter(tx => tx.status === 'PENDING').length,
      totalDiscount: transactions.reduce((sum, tx) => sum + (tx.discountAmount || 0), 0),
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
