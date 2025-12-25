import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { getWalletSummary } from '@/lib/commission-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET /api/wallet - Get user wallet summary
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const wallet = await getWalletSummary(session.user.id)

    return NextResponse.json({ wallet })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    )
  }
}
