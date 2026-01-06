/**
 * Xendit Bank Payout Service
 * Handles bank transfers via Xendit Payout API v2
 * Docs: https://docs.xendit.co/api-reference/payouts
 */

interface XenditBankPayoutRequest {
  referenceId: string
  channelCode: string
  channelProperties: {
    accountHolderName: string
    accountNumber: string
  }
  amount: number
  currency: 'IDR'
  description?: string
  metadata?: Record<string, any>
}

interface XenditBankPayoutResponse {
  id: string
  referenceId: string
  channelCode: string
  channelProperties: {
    accountHolderName: string
    accountNumber: string
  }
  amount: number
  currency: string
  description: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
  created: string
  updated: string
  metadata?: Record<string, any>
  failureReason?: string
  estimatedArrivalTime?: string
}

export class XenditPayout {
  private baseURL: string
  private secretKey: string

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.xendit.co'
      : 'https://api.xendit.co'
    
    this.secretKey = process.env.XENDIT_SECRET_KEY || ''
    
    if (!this.secretKey) {
      console.warn('[Xendit Bank Payout] Secret key not configured')
    }
  }

  /**
   * Get authorization header for Xendit API
   */
  private getAuthHeader(): string {
    const encoded = Buffer.from(this.secretKey + ':').toString('base64')
    return `Basic ${encoded}`
  }

  /**
   * Create bank transfer payout via Xendit
   */
  async createPayout(request: XenditBankPayoutRequest): Promise<XenditBankPayoutResponse> {
    try {
      if (!this.secretKey) {
        throw new Error('Xendit not configured')
      }

      console.log('[Xendit Bank Payout] Creating payout:', {
        referenceId: request.referenceId,
        channelCode: request.channelCode,
        amount: request.amount,
        accountNumber: request.channelProperties.accountNumber,
        accountHolderName: request.channelProperties.accountHolderName
      })

      const response = await fetch(`${this.baseURL}/v2/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          'Idempotency-Key': request.referenceId, // Required by Xendit Payout API v2
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Xendit Bank Payout] Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        
        // Handle specific error cases
        if (response.status === 400) {
          if (errorData.error_code === 'DUPLICATE_REFERENCE_ID') {
            throw new Error('DUPLICATE_REFERENCE_ID')
          }
          if (errorData.error_code === 'INVALID_ACCOUNT') {
            throw new Error('INVALID_ACCOUNT')
          }
        }
        
        if (response.status === 402) {
          throw new Error('INSUFFICIENT_BALANCE')
        }
        
        throw new Error(errorData.message || `Bank payout failed: ${response.status}`)
      }

      const payout: XenditBankPayoutResponse = await response.json()
      
      console.log('[Xendit Bank Payout] Success:', {
        id: payout.id,
        referenceId: payout.referenceId,
        status: payout.status,
        amount: payout.amount
      })
      
      return payout

    } catch (error: any) {
      console.error('[Xendit Bank Payout] Exception:', error)
      throw error
    }
  }

  /**
   * Get bank payout status from Xendit
   */
  async getPayoutStatus(payoutId: string): Promise<XenditBankPayoutResponse | null> {
    try {
      if (!this.secretKey) {
        throw new Error('Xendit not configured')
      }

      const response = await fetch(`${this.baseURL}/v2/payouts/${payoutId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        console.error('[Xendit Get Bank Payout] Error:', response.status)
        return null
      }

      return await response.json()
    } catch (error: any) {
      console.error('[Xendit Get Bank Payout] Exception:', error)
      return null
    }
  }

  /**
   * Check if Xendit is configured and available
   */
  isConfigured(): boolean {
    return !!this.secretKey && this.secretKey.length > 10
  }

  /**
   * Validate bank account via Xendit (if supported)
   */
  async validateBankAccount(
    bankCode: string, 
    accountNumber: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      // Note: Bank account validation may not be available for all banks in Xendit
      // This is a placeholder implementation
      return {
        success: false,
        error: 'Bank account validation not yet implemented'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Bank account validation failed'
      }
    }
  }
}

// Singleton instance
let xenditPayoutInstance: XenditPayout | null = null

export function getXenditPayout(): XenditPayout {
  try {
    if (!xenditPayoutInstance) {
      xenditPayoutInstance = new XenditPayout()
    }
    return xenditPayoutInstance
  } catch (error) {
    console.error('[Xendit Bank Payout] Failed to create instance:', error)
    return new XenditPayout()
  }
}