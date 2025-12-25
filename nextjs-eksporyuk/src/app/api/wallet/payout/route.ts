import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { processPayout } from '@/lib/commission-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/wallet/payout - Request payout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, method, accountDetails } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!method) {
      return NextResponse.json(
        { error: 'Payment method required' },
        { status: 400 }
      )
    }

    const result = await processPayout(
      session.user.id,
      amount,
      method,
      accountDetails
    )

    return NextResponse.json({
      success: true,
      payout: result.payout
    })
  } catch (error: any) {
    console.error('Payout request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process payout' },
      { status: 500 }
    )
  }
}
