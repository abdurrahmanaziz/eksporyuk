import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [pending, approved, rejected, totalAmountData] = await Promise.all([
      prisma.payout.count({ where: { status: 'PENDING' } }),
      prisma.payout.count({ where: { status: 'APPROVED' } }),
      prisma.payout.count({ where: { status: 'REJECTED' } }),
      prisma.payout.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
    ])

    return NextResponse.json({
      pending,
      approved,
      rejected,
      totalAmount: Number(totalAmountData._sum.amount || 0),
    })
  } catch (error) {
    console.error('Error fetching payout stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
