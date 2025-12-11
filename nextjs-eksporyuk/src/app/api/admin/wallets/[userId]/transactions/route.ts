import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/wallets/[userId]/transactions - Get user transaction history (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { userId } = await params

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wallet: {
          select: {
            balance: true,
            totalEarnings: true,
            totalPayouts: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all transactions
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        metadata: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        role: user.role,
        balance: user.wallet?.balance || 0,
        totalEarnings: user.wallet?.totalEarnings || 0,
        totalPayouts: user.wallet?.totalPayouts || 0,
      },
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        metadata: tx.metadata,
        createdAt: tx.createdAt,
      }))
    })
  } catch (error) {
    console.error('Error fetching user transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
