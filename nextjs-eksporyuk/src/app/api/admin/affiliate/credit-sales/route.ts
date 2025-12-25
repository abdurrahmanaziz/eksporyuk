import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch credit sales report (admin)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status') || 'all'

    // Get credit top-up transactions
    const whereClause: any = {
      metadata: {
        path: ['type'],
        equals: 'CREDIT_TOPUP'
      }
    }

    if (status !== 'all') {
      whereClause.status = status.toUpperCase()
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where: whereClause })
    ])

    // Calculate statistics
    const successTransactions = await prisma.transaction.findMany({
      where: {
        metadata: {
          path: ['type'],
          equals: 'CREDIT_TOPUP'
        },
        status: 'SUCCESS'
      },
      select: {
        amount: true,
        metadata: true,
      }
    })

    const totalRevenue = successTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const totalCredits = successTransactions.reduce((sum, tx) => {
      const metadata = tx.metadata as any
      return sum + (metadata?.credits || 0)
    }, 0)

    // Get today's sales
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todaySales = await prisma.transaction.count({
      where: {
        metadata: {
          path: ['type'],
          equals: 'CREDIT_TOPUP'
        },
        status: 'SUCCESS',
        createdAt: { gte: todayStart }
      }
    })

    const todayRevenue = await prisma.transaction.aggregate({
      where: {
        metadata: {
          path: ['type'],
          equals: 'CREDIT_TOPUP'
        },
        status: 'SUCCESS',
        createdAt: { gte: todayStart }
      },
      _sum: { amount: true }
    })

    // Get this month's sales
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const monthSales = await prisma.transaction.count({
      where: {
        metadata: {
          path: ['type'],
          equals: 'CREDIT_TOPUP'
        },
        status: 'SUCCESS',
        createdAt: { gte: monthStart }
      }
    })

    const monthRevenue = await prisma.transaction.aggregate({
      where: {
        metadata: {
          path: ['type'],
          equals: 'CREDIT_TOPUP'
        },
        status: 'SUCCESS',
        createdAt: { gte: monthStart }
      },
      _sum: { amount: true }
    })

    // Format transactions
    const formattedTransactions = transactions.map(tx => {
      const metadata = tx.metadata as any
      return {
        id: tx.id,
        invoiceNumber: tx.invoiceNumber,
        user: tx.user,
        credits: metadata?.credits || 0,
        packageName: metadata?.packageName || 'Unknown',
        amount: tx.amount,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        paymentProvider: tx.paymentProvider,
        reference: tx.reference,
        createdAt: tx.createdAt,
        paidAt: tx.paidAt,
      }
    })

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      stats: {
        totalRevenue,
        totalCredits,
        totalTransactions: successTransactions.length,
        today: {
          sales: todaySales,
          revenue: todayRevenue._sum.amount || 0,
        },
        thisMonth: {
          sales: monthSales,
          revenue: monthRevenue._sum.amount || 0,
        },
      }
    })
  } catch (error) {
    console.error('Error fetching credit sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
