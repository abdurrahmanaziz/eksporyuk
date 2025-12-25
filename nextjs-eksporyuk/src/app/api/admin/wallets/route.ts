import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/wallets - Get all user wallets with summary (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const userIds = users.map(u => u.id)

    // Get wallets and transactions separately (no relations in schema)
    const [allWallets, transactionCounts, latestTransactions] = await Promise.all([
      prisma.wallet.findMany({
        where: { userId: { in: userIds } }
      }),
      prisma.transaction.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _count: true
      }),
      prisma.transaction.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'desc' },
        select: { userId: true, createdAt: true },
        distinct: ['userId']
      })
    ])

    const walletMap = new Map(allWallets.map(w => [w.userId, w]))
    const countMap = new Map(transactionCounts.map(tc => [tc.userId, tc._count]))
    const latestTxMap = new Map(latestTransactions.map(t => [t.userId, t.createdAt]))

    const wallets = users.map(user => ({
      userId: user.id,
      user: {
        name: user.name || 'Unknown',
        email: user.email,
        role: user.role,
      },
      balance: walletMap.get(user.id)?.balance || 0,
      totalEarnings: walletMap.get(user.id)?.totalEarnings || 0,
      totalPayouts: walletMap.get(user.id)?.totalPayout || 0,
      transactionCount: countMap.get(user.id) || 0,
      lastTransaction: latestTxMap.get(user.id) || null,
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
