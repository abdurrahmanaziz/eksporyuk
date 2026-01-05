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

    // Validate provider is in allowed list
    const allowedProviders = ['OVO', 'GoPay', 'DANA', 'LinkAja', 'ShopeePay']
    if (!allowedProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Provider tidak didukung. Gunakan: ${allowedProviders.join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`[E-Wallet Check] ${provider} - ${phoneNumber} - User: ${session.user.id}/${session.user.email}`)

    // Normalize phone number for consistency
    const normalizedPhone = phoneNumber.startsWith('0') ? phoneNumber : `0${phoneNumber.replace(/^\+?62/, '')}`
    
    console.log(`[E-Wallet Check] Normalized phone: ${normalizedPhone}`)

    // Try Xendit first if configured
    let xenditAttempted = false
    let xenditSuccess = false
    let xenditError = null

    try {
      const xenditService = getXenditPayoutService()
      
      if (xenditService && xenditService.isConfigured()) {
        console.log('[E-Wallet Check] Attempting Xendit API validation...')
        xenditAttempted = true
        
        const result = await xenditService.validateAccount(provider, normalizedPhone)
        
        if (result.success && result.accountName) {
          console.log(`[E-Wallet Check] Xendit success: ${result.accountName}`)
          xenditSuccess = true
          return NextResponse.json({
            success: true,
            accountName: result.accountName,
            source: 'xendit',
            message: 'Account verified via Xendit API'
          })
        } else {
          console.log(`[E-Wallet Check] Xendit failed: ${result.error}`)
          xenditError = result.error
          
          // If Xendit fails with "account not found", we can still try mock
          if (result.error?.includes('not found') || result.error?.includes('invalid')) {
            console.log('[E-Wallet Check] Account not found in Xendit, trying fallback...')
          }
        }
      } else {
        console.log('[E-Wallet Check] Xendit service not configured')
      }
    } catch (error) {
      console.error('[E-Wallet Check] Xendit service error:', error)
      xenditError = error.message
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

    // If both services fail, return user-friendly response instead of server error
    console.log('[E-Wallet Check] All validation methods failed')
    
    // Provide helpful response based on what was attempted
    let message = 'Unable to verify account name. Please check your phone number and try again.'
    let details = []
    
    if (xenditAttempted) {
      if (xenditError?.includes('not found') || xenditError?.includes('invalid')) {
        message = `${provider} account with number ${normalizedPhone} not found. Please check the phone number.`
      } else if (xenditError?.includes('401') || xenditError?.includes('authentication')) {
        details.push('Xendit API authentication issue')
      } else {
        details.push(`Xendit error: ${xenditError}`)
      }
    } else {
      details.push('Xendit service not configured')
    }
    
    details.push('Fallback service also unavailable')
    
    // Return 422 for validation issues, but make it clear this is expected behavior
    return NextResponse.json({
      success: false,
      error: 'Account validation failed',
      message,
      details: details.join(', '),
      attempted: {
        xendit: xenditAttempted,
        xenditSuccess,
        fallback: true
      }
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
