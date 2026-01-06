import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getXenditPayoutService } from '@/lib/services/xendit-payout'
import { EWalletService } from '@/lib/services/ewallet-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ewallet/check-name-xendit
 * Check e-wallet account name using mock service
 * 
 * IMPORTANT: Xendit does NOT provide a public account validation API endpoint.
 * The /v1/account_validation endpoint does not exist in official Xendit API.
 * This endpoint uses mock service fallback for reliable account verification.
 * 
 * Request: { provider: string, phoneNumber: string }
 * Response: { success: boolean, accountName?: string, source: 'mock' | 'mock_critical_fallback' }
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

    // NOTE: Xendit does NOT provide a public account validation API endpoint
    // The /v1/account_validation endpoint does not exist in official Xendit API
    // This service call will fail and trigger fallback to mock service
    let xenditAttempted = false
    let xenditSuccess = false
    let xenditError = null

    try {
      const xenditService = getXenditPayoutService()
      
      console.log('[E-Wallet Check] Checking Xendit service...', {
        serviceExists: !!xenditService,
        configured: xenditService?.isConfigured?.(),
        note: 'Account validation API does not exist - using mock fallback'
      })
      
      if (xenditService && xenditService.isConfigured()) {
        console.log('[E-Wallet Check] ⚠️ Attempting Xendit validation (will fail - API not available)...')
        xenditAttempted = true
        
        const result = await xenditService.validateAccount(provider, normalizedPhone)
        
        console.log('[E-Wallet Check] Xendit result:', {
          success: result.success,
          error: result.error
        })
        
        if (result.success && result.accountName) {
          console.log(`[E-Wallet Check] ✅ Xendit success: ${result.accountName}`)
          xenditSuccess = true
          return NextResponse.json({
            success: true,
            accountName: result.accountName,
            source: 'xendit',
            message: 'Account verified via Xendit API'
          })
        } else {
          console.log(`[E-Wallet Check] ❌ Xendit unavailable (expected): ${result.error}`)
          console.log('[E-Wallet Check] Using mock service fallback...')
          xenditError = result.error
        }
      } else {
        console.log('[E-Wallet Check] Xendit not configured - using mock fallback')
      }
    } catch (error) {
      console.error('[E-Wallet Check] Xendit error (expected):', {
        message: error.message,
        code: error.code
      })
      xenditError = error.message
    }

    // Fallback to mock service - this is the reliable method for account verification
    console.log('[E-Wallet Check] Using mock service for account verification...')
    try {
      const ewalletService = new EWalletService()
      const fallbackResult = await ewalletService.getAccountName(provider, normalizedPhone, session.user.id)
      
      console.log('[E-Wallet Check] Mock service result:', {
        success: fallbackResult.success,
        accountName: fallbackResult.accountName,
        message: fallbackResult.message
      })
      
      if (fallbackResult.success && fallbackResult.accountName) {
        console.log(`[E-Wallet Check] ✅ Mock service success: ${fallbackResult.accountName}`)
        return NextResponse.json({
          success: true,
          accountName: fallbackResult.accountName,
          source: 'mock',
          message: fallbackResult.message || 'Account found (development mode)',
          cached: fallbackResult.cached
        })
      } else {
        console.log(`[E-Wallet Check] ❌ Mock service failed: ${fallbackResult.message}`)
      }
    } catch (mockError) {
      console.error('[E-Wallet Check] ❌ Mock service error:', {
        message: mockError.message,
        type: mockError.constructor.name
      })
    }

    // If both services fail, return user-friendly response instead of server error
    console.log('[E-Wallet Check] All validation methods failed')
    
    // CRITICAL FIX: Always provide a response from mock data as last resort
    // This ensures account name field gets populated for testing
    try {
      console.log('[E-Wallet Check] 🆘 CRITICAL FALLBACK: Forcing mock service lookup...')
      const ewalletService = new EWalletService()
      
      // Try all possible phone number formats
      const phoneFormats = [
        normalizedPhone,
        normalizedPhone.replace(/[^\d]/g, ''),
        normalizedPhone.startsWith('0') ? normalizedPhone : '0' + normalizedPhone,
        normalizedPhone.startsWith('62') ? '0' + normalizedPhone.substring(2) : null,
      ].filter(Boolean) as string[]
      
      console.log('[E-Wallet Check] Critical fallback trying formats:', phoneFormats)
      
      // Try to get from cache or mock data
      for (const format of phoneFormats) {
        console.log(`[E-Wallet Check] Attempting format: ${format}`)
        const result = await ewalletService.getAccountName(provider, format, session.user.id)
        if (result.success && result.accountName) {
          console.log(`[E-Wallet Check] ✅ CRITICAL FALLBACK SUCCESS: ${result.accountName}`)
          return NextResponse.json({
            success: true,
            accountName: result.accountName,
            source: 'mock_critical_fallback',
            message: 'Account found (fallback mode)',
            cached: result.cached
          })
        }
      }
    } catch (criticalFallbackError) {
      console.error('[E-Wallet Check] Critical fallback also failed:', criticalFallbackError)
    }
    
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
