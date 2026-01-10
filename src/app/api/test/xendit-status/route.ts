import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET/POST /api/test/xendit-status
 * Test Xendit configuration and connectivity
 */
export async function GET() {
  try {
    // Check environment variables
    const hasSecretKey = !!process.env.XENDIT_SECRET_KEY
    const secretKeyLength = process.env.XENDIT_SECRET_KEY?.length || 0
    const isPlaceholder = process.env.XENDIT_SECRET_KEY?.includes('PASTE') || 
                         process.env.XENDIT_SECRET_KEY?.includes('YOUR_KEY')

    // Test Xendit API connectivity
    let xenditConnectivity = 'unknown'
    let xenditError = null

    if (hasSecretKey && !isPlaceholder) {
      try {
        const testResponse = await fetch('https://api.xendit.co/balance', {
          headers: {
            'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (testResponse.ok) {
          xenditConnectivity = 'success'
        } else {
          xenditConnectivity = 'api_error'
          xenditError = `HTTP ${testResponse.status}`
        }
      } catch (error) {
        xenditConnectivity = 'network_error'
        xenditError = error.message
      }
    }

    // Check Xendit services
    let xenditPayoutService = 'unknown'
    try {
      const { getXenditPayoutService } = await import('@/lib/services/xendit-payout')
      const service = getXenditPayoutService()
      xenditPayoutService = service.isConfigured() ? 'configured' : 'not_configured'
    } catch (error) {
      xenditPayoutService = 'service_error'
    }

    // Check Xendit bank service
    let xenditBankService = 'unknown'
    try {
      const { XenditPayout } = await import('@/lib/services/xendit-bank-payout')
      const bankService = new XenditPayout()
      xenditBankService = bankService.isConfigured() ? 'configured' : 'not_configured'
    } catch (error) {
      xenditBankService = 'service_error'
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        hasSecretKey,
        secretKeyLength,
        isPlaceholder,
        nodeEnv: process.env.NODE_ENV
      },
      xendit: {
        connectivity: xenditConnectivity,
        error: xenditError,
        payoutService: xenditPayoutService,
        bankService: xenditBankService
      },
      services: {
        ewalletEndpoint: '/api/ewallet/check-name-xendit',
        bankEndpoint: '/api/affiliate/payouts/xendit',
        ewalletWithdrawEndpoint: '/api/wallet/withdraw-ewallet'
      },
      diagnosis: {
        overall: hasSecretKey && !isPlaceholder && xenditConnectivity === 'success' ? 'healthy' : 'issues_detected',
        recommendations: [
          !hasSecretKey ? 'Set XENDIT_SECRET_KEY environment variable' : null,
          isPlaceholder ? 'Replace placeholder XENDIT_SECRET_KEY with real key' : null,
          xenditConnectivity !== 'success' ? 'Fix Xendit API connectivity' : null,
          xenditPayoutService !== 'configured' ? 'Configure Xendit payout service' : null,
          xenditBankService !== 'configured' ? 'Configure Xendit bank service' : null
        ].filter(Boolean)
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check Xendit status',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  return GET() // Same logic for POST
}