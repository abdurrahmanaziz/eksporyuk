import { NextRequest, NextResponse } from 'next/server'
import { getAvailablePaymentMethods, groupChannelsByType } from '@/lib/payment-methods'

/**
 * GET /api/payment-methods
 * Returns available payment methods based on admin settings
 */
export async function GET(request: NextRequest) {
  try {
    const { xenditChannels, manualBankAccounts, settings } = await getAvailablePaymentMethods()
    
    // Group Xendit channels by type
    const groupedChannels = groupChannelsByType(xenditChannels)
    
    return NextResponse.json({
      success: true,
      data: {
        xendit: {
          enabled: settings.enableXendit,
          channels: xenditChannels,
          grouped: groupedChannels,
        },
        manual: {
          enabled: settings.enableManualBank,
          bankAccounts: manualBankAccounts,
        },
        settings: {
          sandboxMode: settings.sandboxMode,
          minAmount: settings.minAmount,
          maxAmount: settings.maxAmount,
        },
      }
    })
  } catch (error) {
    console.error('[Payment Methods API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch payment methods' 
      },
      { status: 500 }
    )
  }
}
