import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const type = searchParams.get('type')

    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (type) {
      where.type = type
    }

    // Fetch pending revenues without relations (model has no relations defined)
    const pendingRevenues = await prisma.pendingRevenue.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Fetch related data separately
    const walletIds = [...new Set(pendingRevenues.map(pr => pr.walletId))]
    const transactionIds = [...new Set(pendingRevenues.map(pr => pr.transactionId))]

    const [wallets, transactions] = await Promise.all([
      prisma.wallet.findMany({
        where: { id: { in: walletIds } },
        select: {
          id: true,
          userId: true,
          balance: true,
          balancePending: true,
          totalEarnings: true,
        }
      }),
      prisma.transaction.findMany({
        where: { id: { in: transactionIds } },
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          createdAt: true,
          customerName: true,
          customerEmail: true,
          productId: true,
        }
      })
    ])

    // Get users for wallets
    const userIds = [...new Set(wallets.map(w => w.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    // Get products for transactions
    const productIds = [...new Set(transactions.filter(t => t.productId).map(t => t.productId!))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
      }
    })

    // Create lookup maps
    const walletMap = new Map(wallets.map(w => [w.id, w]))
    const transactionMap = new Map(transactions.map(t => [t.id, t]))
    const userMap = new Map(users.map(u => [u.id, u]))
    const productMap = new Map(products.map(p => [p.id, p]))

    // Calculate totals
    const totals = {
      pending: 0,
      approved: 0,
      adjusted: 0,
      rejected: 0,
    }

    pendingRevenues.forEach((pr) => {
      const amount = parseFloat(pr.amount.toString())
      if (pr.status === 'PENDING') totals.pending += amount
      else if (pr.status === 'APPROVED') totals.approved += amount
      else if (pr.status === 'ADJUSTED') totals.adjusted += amount
      else if (pr.status === 'REJECTED') totals.rejected += amount
    })

    return NextResponse.json({
      pendingRevenues: pendingRevenues.map((pr) => {
        const wallet = walletMap.get(pr.walletId)
        const transaction = transactionMap.get(pr.transactionId)
        const user = wallet ? userMap.get(wallet.userId) : null
        const product = transaction?.productId ? productMap.get(transaction.productId) : null

        return {
          ...pr,
          amount: parseFloat(pr.amount.toString()),
          adjustedAmount: pr.adjustedAmount ? parseFloat(pr.adjustedAmount.toString()) : null,
          percentage: parseFloat(pr.percentage.toString()),
          transaction: transaction ? {
            ...transaction,
            amount: parseFloat(transaction.amount.toString()),
            product: product ? { name: product.name } : null,
          } : null,
          wallet: wallet ? {
            ...wallet,
            balance: parseFloat(wallet.balance.toString()),
            balancePending: parseFloat(wallet.balancePending.toString()),
            totalEarnings: parseFloat(wallet.totalEarnings.toString()),
            user: user || null,
          } : null,
        }
      }),
      totals,
    })
  } catch (error) {
    console.error('Get pending revenues error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending revenues' },
      { status: 500 }
    )
  }
}
