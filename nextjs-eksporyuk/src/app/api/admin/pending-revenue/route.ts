import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const type = searchParams.get('type')

    const where: any = {
      status: status === 'ALL' ? undefined : status,
      type: type || undefined,
    }

    const pendingRevenues = await prisma.pendingRevenue.findMany({
      where,
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        transaction: {
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            createdAt: true,
            customerName: true,
            customerEmail: true,
            productId: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

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
      pendingRevenues: pendingRevenues.map((pr) => ({
        ...pr,
        amount: parseFloat(pr.amount.toString()),
        adjustedAmount: pr.adjustedAmount ? parseFloat(pr.adjustedAmount.toString()) : null,
        percentage: parseFloat(pr.percentage.toString()),
        transaction: {
          ...pr.transaction,
          amount: parseFloat(pr.transaction.amount.toString()),
        },
        wallet: {
          ...pr.wallet,
          balance: parseFloat(pr.wallet.balance.toString()),
          balancePending: parseFloat(pr.wallet.balancePending.toString()),
          totalEarnings: parseFloat(pr.wallet.totalEarnings.toString()),
        },
      })),
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
