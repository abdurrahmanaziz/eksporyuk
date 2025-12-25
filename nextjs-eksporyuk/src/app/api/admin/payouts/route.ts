import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/payouts - Get all payout requests (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, COMPLETED, REJECTED

    const where: any = {}
    if (status && ['PENDING', 'COMPLETED', 'REJECTED'].includes(status)) {
      where.status = status
    }

    // Payout model has no relations - only walletId
    const payouts = await prisma.payout.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch wallets to get user IDs
    const walletIds = [...new Set(payouts.map(p => p.walletId))]
    const wallets = await prisma.wallet.findMany({
      where: { id: { in: walletIds } },
      select: { id: true, userId: true }
    })

    // Fetch users
    const userIds = [...new Set(wallets.map(w => w.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
      }
    })

    // Create lookup maps
    const walletMap = new Map(wallets.map(w => [w.id, w]))
    const userMap = new Map(users.map(u => [u.id, u]))

    // Enrich payouts with user data
    const enrichedPayouts = payouts.map(payout => {
      const wallet = walletMap.get(payout.walletId)
      const user = wallet ? userMap.get(wallet.userId) : null
      return {
        ...payout,
        amount: parseFloat(payout.amount.toString()),
        user: user || null,
      }
    })

    return NextResponse.json({ payouts: enrichedPayouts })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}
