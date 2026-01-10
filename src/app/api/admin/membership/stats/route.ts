import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET - Fetch membership stats per plan
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ambil semua plan via SQL mentah untuk menghindari enum deserialization error
    const plans = await prisma.$queryRawUnsafe<Array<{
      id: string;
      name: string;
      price: any;
      duration: string;
    }>>(`SELECT id, name, price, duration FROM "Membership" ORDER BY price DESC`)

    // Get stats for each plan
    const stats = await Promise.all(
      plans.map(async (plan) => {
        const [active, expired, pending, total] = await Promise.all([
          prisma.userMembership.count({
            where: { membershipId: plan.id, status: 'ACTIVE' }
          }),
          prisma.userMembership.count({
            where: { membershipId: plan.id, status: 'EXPIRED' }
          }),
          prisma.userMembership.count({
            where: { membershipId: plan.id, status: 'PENDING' }
          }),
          prisma.userMembership.count({
            where: { membershipId: plan.id }
          })
        ])

        return {
          id: plan.id,
          name: plan.name,
          price: Number(plan.price),
          duration: plan.duration,
          active,
          expired,
          pending,
          total
        }
      })
    )

    // Calculate totals
    const totals = {
      active: stats.reduce((sum, s) => sum + s.active, 0),
      expired: stats.reduce((sum, s) => sum + s.expired, 0),
      pending: stats.reduce((sum, s) => sum + s.pending, 0),
      total: stats.reduce((sum, s) => sum + s.total, 0)
    }

    return NextResponse.json({
      stats,
      totals
    })

  } catch (error) {
    console.error('Error fetching membership stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
