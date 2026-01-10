import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ewalletService } from '@/lib/services/ewallet-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ewallet/check-name
 * Check account name for e-wallet phone number with caching and real API integration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phoneNumber, provider, useCache = true } = await request.json()

    if (!phoneNumber || !provider) {
      return NextResponse.json({ 
        error: 'Phone number and provider required',
        success: false 
      }, { status: 400 })
    }

    // Validate provider
    const validProviders = ['OVO', 'GoPay', 'DANA', 'LinkAja', 'ShopeePay']
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ 
        error: 'Invalid e-wallet provider',
        success: false 
      }, { status: 400 })
    }

    // Check account using service
    const result = await ewalletService.checkAccountName(
      phoneNumber, 
      provider, 
      session.user.id,
      useCache
    )

    return NextResponse.json({
      success: result.success,
      accountName: result.accountName,
      message: result.message,
      cached: result.cached || false,
      provider,
      phoneNumber
    })

  } catch (error) {
    console.error('[EWALLET NAME CHECK ERROR]', error)
    return NextResponse.json(
      { 
        error: 'Failed to check e-wallet name',
        success: false 
      },
      { status: 500 }
    )
  }
}