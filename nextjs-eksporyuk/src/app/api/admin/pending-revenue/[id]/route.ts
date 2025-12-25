import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { approvePendingRevenue, rejectPendingRevenue } from '@/lib/commission-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, adjustedAmount, note } = body
    const pendingRevenueId = params.id

    if (action === 'approve') {
      const result = await approvePendingRevenue(
        pendingRevenueId,
        session.user.id,
        adjustedAmount,
        note
      )

      return NextResponse.json({
        success: true,
        message: result.adjusted
          ? `Revenue approved with adjustment: Rp ${result.finalAmount.toLocaleString('id-ID')}`
          : `Revenue approved: Rp ${result.finalAmount.toLocaleString('id-ID')}`,
        data: result,
      })
    } else if (action === 'reject') {
      if (!note) {
        return NextResponse.json(
          { error: 'Rejection note is required' },
          { status: 400 }
        )
      }

      const result = await rejectPendingRevenue(
        pendingRevenueId,
        session.user.id,
        note
      )

      return NextResponse.json({
        success: true,
        message: `Revenue rejected: Rp ${result.rejectedAmount.toLocaleString('id-ID')}`,
        data: result,
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Process pending revenue error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process pending revenue' },
      { status: 500 }
    )
  }
}
