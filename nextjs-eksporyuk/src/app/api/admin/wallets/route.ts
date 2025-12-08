import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/admin/wallets - Get all user wallets with summary (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users with their wallet info
    const users = await prisma.user.findMany({
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
        },
        transactions: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const wallets = users.map(user => ({
      userId: user.id,
      user: {
        name: user.name || 'Unknown',
        email: user.email,
        role: user.role,
      },
      balance: user.wallet?.balance || 0,
      totalEarnings: user.wallet?.totalEarnings || 0,
      totalPayouts: user.wallet?.totalPayouts || 0,
      transactionCount: user._count.transactions,
      lastTransaction: user.transactions[0]?.createdAt || null,
    }))

    return NextResponse.json({ wallets })
  } catch (error) {
    console.error('Error fetching wallets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    )
  }
}
