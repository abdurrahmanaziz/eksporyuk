import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getXenditPayoutService } from '@/lib/services/xendit-payout'
import { EWalletService } from '@/lib/services/ewallet-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ewallet/check-name-xendit
 * Check e-wallet account name using Xendit API with fallback to mock
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { provider, phoneNumber } = await request.json()

    if (!provider || !phoneNumber) {
      return NextResponse.json(
        { error: 'Provider and phone number required' },
        { status: 400 }
      )
    }

    console.log(`[Xendit E-Wallet Check] ${provider} - ${phoneNumber}`)

    // Try Xendit first if configured
    const xenditService = getXenditPayoutService()
    
    if (xenditService.isConfigured()) {
      console.log('[Xendit E-Wallet Check] Using Xendit API')
      
      const result = await xenditService.validateAccount(provider, phoneNumber)
      
      if (result.success && result.accountName) {
        return NextResponse.json({
          success: true,
          accountName: result.accountName,
          source: 'xendit',
          message: 'Account verified via Xendit'
        })
      } else {
        console.log('[Xendit E-Wallet Check] Xendit failed:', result.error)
        // Don't return error immediately, try fallback
      }
    } else {
      console.log('[Xendit E-Wallet Check] Xendit not configured, using fallback')
    }

    // Fallback to existing mock service
    console.log('[Xendit E-Wallet Check] Using fallback mock service')
    const ewalletService = new EWalletService()
    const fallbackResult = await ewalletService.getAccountName(provider, phoneNumber, session.user.id)
    
    if (fallbackResult.success && fallbackResult.accountName) {
      return NextResponse.json({
        success: true,
        accountName: fallbackResult.accountName,
        source: 'mock',
        message: fallbackResult.message || 'Account found (development mode)',
        cached: fallbackResult.cached
      })
    }

    // Both failed
    return NextResponse.json({
      success: false,
      error: 'Account not found or verification failed'
    }, { status: 404 })

  } catch (error: any) {
    console.error('[Xendit E-Wallet Check] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}