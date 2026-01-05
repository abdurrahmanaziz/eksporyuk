/**
 * Xendit Payout Service
 * Integrates with Xendit Payout API for e-wallet withdrawals
 * Docs: https://docs.xendit.co/api-reference/payouts
 */

interface XenditPayoutRequest {
  amount: number
  channelCategory: 'EWALLET' | 'BANK'
  channelCode: string // DANA, OVO, GOPAY, LINKAJA, SHOPEEPAY
  accountHolder: {
    name: string
    phoneNumber?: string
    accountNumber?: string
  }
  reference_id: string
  description?: string
  metadata?: Record<string, any>
}

interface XenditPayoutResponse {
  id: string
  reference_id: string
  channel_category: string
  channel_code: string
  account_holder: {
    name: string
    phone_number?: string
    account_number?: string
  }
  amount: number
  description: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
  created: string
  updated: string
  metadata?: Record<string, any>
  failure_reason?: string
  estimated_arrival_time?: string
}

interface XenditAccountValidationRequest {
  channelCategory: 'EWALLET' | 'BANK'
  channelCode: string
  accountHolder: {
    phoneNumber?: string
    accountNumber?: string
  }
}

interface XenditAccountValidationResponse {
  account_holder_name: string
  channel_category: string
  channel_code: string
  account_number?: string
  phone_number?: string
  is_verified: boolean
}

export class XenditPayoutService {
  private baseURL: string
  private secretKey: string

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.xendit.co'
      : 'https://api.xendit.co' // Xendit uses same URL for both
    
    this.secretKey = process.env.XENDIT_SECRET_KEY || ''
    
    if (!this.secretKey) {
      console.warn('[Xendit Payout] Secret key not configured')
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
   * Validate e-wallet account name via Xendit
   */
  async validateAccount(
    provider: string, 
    phoneNumber: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      if (!this.secretKey) {
        throw new Error('Xendit not configured')
      }

      // Map provider to Xendit channel code
      const channelCode = this.mapProviderToChannelCode(provider)
      if (!channelCode) {
        throw new Error(`Provider ${provider} not supported`)
      }

      // Xendit account validation endpoint
      const response = await fetch(`${this.baseURL}/v1/account_validation`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_category: 'EWALLET',
          channel_code: channelCode,
          account_holder: {
            phone_number: phoneNumber
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Xendit Account Validation] Error:', errorData)
        
        if (response.status === 400) {
          return { 
            success: false, 
            error: errorData.message || 'Invalid account details' 
          }
        }
        
        throw new Error(`API Error: ${response.status}`)
      }

      const data: XenditAccountValidationResponse = await response.json()
      
      if (!data.is_verified) {
        return {
          success: false,
          error: 'Account not found or not verified'
        }
      }

      return {
        success: true,
        accountName: data.account_holder_name
      }

    } catch (error: any) {
      console.error('[Xendit Account Validation] Exception:', error)
      return {
        success: false,
        error: error.message || 'Validation failed'
      }
    }
  }

  /**
   * Create payout to e-wallet via Xendit
   */
  async createPayout(
    provider: string,
    phoneNumber: string, 
    accountName: string,
    amount: number,
    referenceId: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; payout?: XenditPayoutResponse; error?: string }> {
    try {
      if (!this.secretKey) {
        throw new Error('Xendit not configured')
      }

      const channelCode = this.mapProviderToChannelCode(provider)
      if (!channelCode) {
        throw new Error(`Provider ${provider} not supported`)
      }

      const payoutData: XenditPayoutRequest = {
        reference_id: referenceId,
        channel_category: 'EWALLET',
        channel_code: channelCode,
        account_holder: {
          name: accountName,
          phoneNumber: phoneNumber
        },
        amount: amount,
        description: `Withdrawal via ${provider} - ${accountName}`,
        metadata: metadata
      }

      const response = await fetch(`${this.baseURL}/v2/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payoutData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Xendit Payout] Error:', errorData)
        
        return { 
          success: false, 
          error: errorData.message || `Payout failed: ${response.status}` 
        }
      }

      const payout: XenditPayoutResponse = await response.json()
      
      return {
        success: true,
        payout: payout
      }

    } catch (error: any) {
      console.error('[Xendit Payout] Exception:', error)
      return {
        success: false,
        error: error.message || 'Payout creation failed'
      }
    }
  }

  /**
   * Get payout status from Xendit
   */
  async getPayoutStatus(payoutId: string): Promise<XenditPayoutResponse | null> {
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
        console.error('[Xendit Get Payout] Error:', response.status)
        return null
      }

      return await response.json()
    } catch (error: any) {
      console.error('[Xendit Get Payout] Exception:', error)
      return null
    }
  }

  /**
   * Map internal provider names to Xendit channel codes
   */
  private mapProviderToChannelCode(provider: string): string | null {
    const mapping: Record<string, string> = {
      'DANA': 'ID_DANA',
      'OVO': 'ID_OVO', 
      'GoPay': 'ID_GOPAY',
      'GOPAY': 'ID_GOPAY',
      'LinkAja': 'ID_LINKAJA',
      'LINKAJA': 'ID_LINKAJA',
      'ShopeePay': 'ID_SHOPEEPAY',
      'SHOPEEPAY': 'ID_SHOPEEPAY'
    }
    
    return mapping[provider.toUpperCase()] || null
  }

  /**
   * Check if Xendit is configured and available
   */
  isConfigured(): boolean {
    return !!this.secretKey && this.secretKey.length > 10
  }

  /**
   * Get supported e-wallet providers
   */
  getSupportedProviders(): string[] {
    return ['DANA', 'OVO', 'GoPay', 'LinkAja', 'ShopeePay']
  }
}

// Singleton instance
let xenditPayoutService: XenditPayoutService | null = null

export function getXenditPayoutService(): XenditPayoutService {
  if (!xenditPayoutService) {
    xenditPayoutService = new XenditPayoutService()
  }
  return xenditPayoutService
}