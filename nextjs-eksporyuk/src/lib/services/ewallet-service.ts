import { prisma } from '@/lib/prisma'

export interface EWalletAccountInfo {
  success: boolean
  accountName: string | null
  message: string
  cached?: boolean
}

export interface EWalletProvider {
  name: string
  apiEndpoint: string
  apiKey?: string
  apiSecret?: string
  enabled: boolean
}

// E-wallet provider configurations
const EWALLET_PROVIDERS: Record<string, EWalletProvider> = {
  'OVO': {
    name: 'OVO',
    apiEndpoint: process.env.OVO_API_ENDPOINT || '',
    apiKey: process.env.OVO_API_KEY || '',
    enabled: !!process.env.OVO_API_KEY
  },
  'GoPay': {
    name: 'GoPay',
    apiEndpoint: process.env.GOPAY_API_ENDPOINT || '',
    apiKey: process.env.GOPAY_API_KEY || '',
    enabled: !!process.env.GOPAY_API_KEY
  },
  'DANA': {
    name: 'DANA',
    apiEndpoint: process.env.DANA_API_ENDPOINT || '',
    apiKey: process.env.DANA_API_KEY || '',
    enabled: !!process.env.DANA_API_KEY
  },
  'LinkAja': {
    name: 'LinkAja',
    apiEndpoint: process.env.LINKAJA_API_ENDPOINT || '',
    apiKey: process.env.LINKAJA_API_KEY || '',
    enabled: !!process.env.LINKAJA_API_KEY
  },
  'ShopeePay': {
    name: 'ShopeePay',
    apiEndpoint: process.env.SHOPEEPAY_API_ENDPOINT || '',
    apiKey: process.env.SHOPEEPAY_API_KEY || '',
    enabled: !!process.env.SHOPEEPAY_API_KEY
  }
}

export class EWalletService {
  
  /**
   * Check account name for e-wallet phone number
   */
  async checkAccountName(
    phoneNumber: string, 
    provider: string, 
    userId?: string,
    useCache: boolean = true
  ): Promise<EWalletAccountInfo> {
    try {
      // Normalize phone number (remove +62, add 62)
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber)
      
      // Check cache first if enabled
      if (useCache) {
        const cached = await this.getCachedAccount(provider, normalizedPhone)
        if (cached && this.isCacheValid(cached.lastChecked)) {
          return {
            success: true,
            accountName: cached.accountName,
            message: 'Account found (cached)',
            cached: true
          }
        }
      }

      // Get provider configuration
      const providerConfig = EWALLET_PROVIDERS[provider]
      if (!providerConfig || !providerConfig.enabled) {
        // Fallback to mock data if API not configured
        return await this.getMockAccountInfo(provider, normalizedPhone, userId)
      }

      // Call real API
      const result = await this.callProviderAPI(providerConfig, normalizedPhone)
      
      // Cache the result
      if (result.success && result.accountName) {
        await this.cacheAccountInfo(provider, normalizedPhone, result.accountName, userId)
      }

      return result

    } catch (error) {
      console.error('[EWALLET SERVICE ERROR]', error)
      return {
        success: false,
        accountName: null,
        message: 'Failed to check account'
      }
    }
  }

  /**
   * Call provider API to check account
   */
  private async callProviderAPI(
    provider: EWalletProvider, 
    phoneNumber: string
  ): Promise<EWalletAccountInfo> {
    try {
      const response = await fetch(provider.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
          'X-API-Key': provider.apiKey || ''
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          provider: provider.name
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: data.success || false,
        accountName: data.account_name || data.accountName || null,
        message: data.message || (data.success ? 'Account found' : 'Account not found')
      }

    } catch (error) {
      console.error(`[${provider.name} API ERROR]`, error)
      return {
        success: false,
        accountName: null,
        message: `Failed to check ${provider.name} account`
      }
    }
  }

  /**
   * Get cached account info from database
   */
  private async getCachedAccount(provider: string, phoneNumber: string) {
    try {
      return await prisma.eWalletAccount.findUnique({
        where: {
          provider_phoneNumber: {
            provider,
            phoneNumber
          }
        }
      })
    } catch (error) {
      console.error('[CACHE LOOKUP ERROR]', error)
      return null
    }
  }

  /**
   * Cache account information in database
   */
  private async cacheAccountInfo(
    provider: string, 
    phoneNumber: string, 
    accountName: string, 
    userId?: string
  ) {
    try {
      await prisma.eWalletAccount.upsert({
        where: {
          provider_phoneNumber: {
            provider,
            phoneNumber
          }
        },
        update: {
          accountName,
          isVerified: true,
          lastChecked: new Date(),
          userId: userId || undefined
        },
        create: {
          provider,
          phoneNumber,
          accountName,
          isVerified: true,
          userId: userId || undefined
        }
      })
    } catch (error) {
      console.error('[CACHE SAVE ERROR]', error)
    }
  }

  /**
   * Check if cache is still valid (24 hours)
   */
  private isCacheValid(lastChecked: Date): boolean {
    const now = new Date()
    const diffHours = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60)
    return diffHours < 24
  }

  /**
   * Normalize Indonesian phone number
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '')
    
    // Convert 0 to 62
    if (normalized.startsWith('0')) {
      normalized = '62' + normalized.substring(1)
    }
    
    // Add 62 if missing
    if (!normalized.startsWith('62')) {
      normalized = '62' + normalized
    }
    
    return normalized
  }

  /**
   * Mock account data for testing/fallback
   */
  private async getMockAccountInfo(
    provider: string, 
    phoneNumber: string, 
    userId?: string
  ): Promise<EWalletAccountInfo> {
    // Check cache first for mock data too
    const cached = await this.getCachedAccount(provider, phoneNumber)
    if (cached) {
      return {
        success: true,
        accountName: cached.accountName,
        message: 'Account found (mock/cached)',
        cached: true
      }
    }

    // Mock data based on provider and phone pattern
    const mockAccounts: Record<string, Record<string, string>> = {
      'OVO': {
        '628123456789': 'John Doe',
        '628987654321': 'Jane Smith',
        '628111222333': 'Ahmad Rizki',
        '628118748177': 'Abdurrahman Aziz'
      },
      'GoPay': {
        '628123456789': 'Budi Santoso',
        '628987654321': 'Siti Nurhaliza',
        '628111222333': 'Andi Wijaya',
        '628118748177': 'Rahman Abdul'
      },
      'DANA': {
        '628123456789': 'Charlie Brown',
        '628987654321': 'Diana Prince',
        '628111222333': 'Erik Johnson',
        '628118748177': 'Aziz Rahman'
      },
      'LinkAja': {
        '628123456789': 'Frank Castle',
        '628987654321': 'Grace Kelly',
        '628111222333': 'Henry Ford',
        '628118748177': 'Rahman Aziz'
      },
      'ShopeePay': {
        '628123456789': 'Ivan Petrov',
        '628987654321': 'Julia Roberts',
        '628111222333': 'Kevin Hart',
        '628118748177': 'Abdur Rahman'
      }
    }

    const accountName = mockAccounts[provider]?.[phoneNumber]

    if (accountName) {
      // Cache mock data
      await this.cacheAccountInfo(provider, phoneNumber, accountName, userId)
      
      return {
        success: true,
        accountName,
        message: 'Account found (mock data)'
      }
    }

    return {
      success: false,
      accountName: null,
      message: 'Account not found'
    }
  }

  /**
   * Get user's saved e-wallet accounts
   */
  async getUserEWalletAccounts(userId: string) {
    try {
      return await prisma.eWalletAccount.findMany({
        where: {
          userId,
          isVerified: true
        },
        orderBy: {
          lastChecked: 'desc'
        }
      })
    } catch (error) {
      console.error('[USER EWALLET ACCOUNTS ERROR]', error)
      return []
    }
  }

  /**
   * Delete cached account
   */
  async deleteCachedAccount(provider: string, phoneNumber: string) {
    try {
      const normalized = this.normalizePhoneNumber(phoneNumber)
      await prisma.eWalletAccount.delete({
        where: {
          provider_phoneNumber: {
            provider,
            phoneNumber: normalized
          }
        }
      })
      return true
    } catch (error) {
      console.error('[DELETE CACHE ERROR]', error)
      return false
    }
  }
}

export const ewalletService = new EWalletService()