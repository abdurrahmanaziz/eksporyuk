import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get transaction stats
    const [total, pending, paid, failed, paidTransactions] = await Promise.all([
      prisma.transaction.count({ where: { userId } }),
      prisma.transaction.count({ where: { userId, status: 'PENDING' } }),
      prisma.transaction.count({ where: { userId, status: 'SUCCESS' } }),
      prisma.transaction.count({ where: { userId, status: 'FAILED' } }),
      prisma.transaction.findMany({
        where: { userId, status: 'SUCCESS' },
        select: { amount: true }
      }),
    ])

    // Calculate total amount from paid transactions
    const totalAmount = paidTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)

    return NextResponse.json({
      success: true,
      stats: {
        total,
        pending,
        paid,
        failed,
        totalAmount,
      }
    })

  } catch (error) {
    console.error('[API] Error fetching transaction stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
