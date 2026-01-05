import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getXenditPayoutService } from '@/lib/services/xendit-payout'
import { EWalletService } from '@/lib/services/ewallet-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ewallet/check-name-xendit
 * Check e-wallet account name using Xendit API with enhanced error handling
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

    console.log(`[E-Wallet Check] ${provider} - ${phoneNumber} - User: ${session.user.email}`)

    // Normalize phone number for consistency
    const normalizedPhone = phoneNumber.startsWith('0') ? phoneNumber : `0${phoneNumber.replace(/^\+?62/, '')}`
    
    console.log(`[E-Wallet Check] Normalized phone: ${normalizedPhone}`)

    // Try Xendit first if configured
    try {
      const xenditService = getXenditPayoutService()
      
      if (xenditService && xenditService.isConfigured()) {
        console.log('[E-Wallet Check] Attempting Xendit API validation...')
        
        const result = await xenditService.validateAccount(provider, normalizedPhone)
        
        if (result.success && result.accountName) {
          console.log(`[E-Wallet Check] Xendit success: ${result.accountName}`)
          return NextResponse.json({
            success: true,
            accountName: result.accountName,
            source: 'xendit',
            message: 'Account verified via Xendit API'
          })
        } else {
          console.log(`[E-Wallet Check] Xendit failed: ${result.error}`)
        }
      } else {
        console.log('[E-Wallet Check] Xendit service not configured')
      }
    } catch (xenditError) {
      console.error('[E-Wallet Check] Xendit error:', xenditError)
    }

    // Fallback to mock service for development/testing
    try {
      console.log('[E-Wallet Check] Falling back to mock service...')
      const ewalletService = new EWalletService()
      const fallbackResult = await ewalletService.getAccountName(provider, normalizedPhone, session.user.id)
      
      if (fallbackResult.success && fallbackResult.accountName) {
        console.log(`[E-Wallet Check] Mock service success: ${fallbackResult.accountName}`)
        return NextResponse.json({
          success: true,
          accountName: fallbackResult.accountName,
          source: 'mock',
          message: fallbackResult.message || 'Account found (development mode)',
          cached: fallbackResult.cached
        })
      } else {
        console.log(`[E-Wallet Check] Mock service failed: ${fallbackResult.message}`)
      }
    } catch (mockError) {
      console.error('[E-Wallet Check] Mock service error:', mockError)
    }

    // If both services fail, return detailed error
    console.log('[E-Wallet Check] All validation methods failed')
    return NextResponse.json({
      success: false,
      error: 'Account validation failed',
      message: 'Unable to verify account name. Please check your phone number and try again.',
      details: 'Both Xendit API and fallback service unavailable'
    }, { status: 422 })

  } catch (error: any) {
    console.error('[E-Wallet Check] Critical error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Service temporarily unavailable. Please try again later.',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}
