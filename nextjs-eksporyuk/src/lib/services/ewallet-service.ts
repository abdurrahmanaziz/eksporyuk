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
   * Keep original format for e-wallet (08xxx), don't force 62xxx conversion
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digits first
    let normalized = phone.replace(/\D/g, '')
    
    // Handle empty or too short numbers
    if (!normalized || normalized.length < 10) {
      return normalized
    }
    
    // For Indonesian mobile numbers starting with 0, keep original format
    // E-wallets work with 08xxx format, not 62xxx
    if (normalized.startsWith('0') && normalized.length >= 11 && normalized.charAt(1) === '8') {
      return normalized  // Keep 08118748177 as is
    }
    
    // If starts with +62, convert to 08xxx format
    if (normalized.startsWith('62') && normalized.length >= 12 && normalized.charAt(2) === '8') {
      return '0' + normalized.substring(2)  // 628118748177 → 08118748177
    }
    
    // If it's just 8xxx format, add 0
    if (normalized.startsWith('8') && normalized.length >= 10) {
      return '0' + normalized  // 8118748177 → 08118748177
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

    // Normalize phone number for consistent lookup
    let normalizedPhone = phoneNumber.replace(/\D/g, '') // Remove all non-digits
    
    console.log(`[Mock E-Wallet] Starting lookup for ${provider}:`, {
      inputPhone: phoneNumber,
      cleanedPhone: normalizedPhone,
      length: normalizedPhone.length
    })
    
    // Try different phone number formats for mock lookup with more variations
    const phoneFormats = [
      normalizedPhone,  // As-is: 081234567890
      normalizedPhone.startsWith('62') ? '0' + normalizedPhone.substring(2) : null,  // 628123456789 → 08123456789
      normalizedPhone.startsWith('8') ? '0' + normalizedPhone : null,  // 8123456789 → 08123456789
      normalizedPhone.startsWith('0') ? '62' + normalizedPhone.substring(1) : null,  // 08123456789 → 628123456789
      normalizedPhone.startsWith('+62') ? normalizedPhone.substring(3) : null,  // +628123456789 → 8123456789
      normalizedPhone.startsWith('+62') ? '0' + normalizedPhone.substring(3) : null,  // +628123456789 → 08123456789
      // Add additional 11-digit format variations
      normalizedPhone.length === 12 && normalizedPhone.startsWith('0') ? normalizedPhone.substring(0, 11) : null, // 081187481771 → 08118748177
      normalizedPhone.length === 13 && normalizedPhone.startsWith('62') ? '0' + normalizedPhone.substring(2, 12) : null,
    ].filter(Boolean) as string[] // Remove null values

    console.log(`[Mock E-Wallet] Testing phone formats for ${provider} (input: ${phoneNumber}):`, phoneFormats)

    // Comprehensive mock data - covers common patterns and test numbers
    const mockAccounts: Record<string, Record<string, string>> = {
      'OVO': {
        '08123456789': 'John Doe',
        '08987654321': 'Jane Smith', 
        '08111222333': 'Ahmad Rizki',
        '08118748177': 'Abdurrahman Aziz',  // Original format
        '081187481771': 'Abdurrahman Aziz',
        '081187481772': 'Rahman Aziz',
        '05520467850': 'Abdurrahman Aziz',  // Test number from production
        '08112345678': 'Test User OVO',
        '08551234567': 'Demo Account',
        '08811223344': 'Sample User',
        // Keep 62xxx for backward compatibility
        '628123456789': 'John Doe',
        '628987654321': 'Jane Smith', 
        '628111222333': 'Ahmad Rizki',
        '628118748177': 'Abdurrahman Aziz',
        '6281187481771': 'Abdurrahman Aziz',
        '6281187481772': 'Rahman Aziz',
        '625520467850': 'Abdurrahman Aziz'
      },
      'GoPay': {
        '08123456789': 'Budi Santoso',
        '08987654321': 'Siti Nurhaliza',
        '08111222333': 'Andi Wijaya', 
        '08118748177': 'Rahman Abdul',  // Original format
        '081187481771': 'Rahman Abdul',
        '081187481772': 'Abdul Rahman',
        '05520467850': 'Abdurrahman Aziz',
        '08112345678': 'Test User GoPay',
        '08551234567': 'Demo GoPay',
        '08811223344': 'Sample GoPay',
        // Keep 62xxx for backward compatibility
        '628123456789': 'Budi Santoso',
        '628987654321': 'Siti Nurhaliza',
        '628111222333': 'Andi Wijaya', 
        '628118748177': 'Rahman Abdul',
        '6281187481771': 'Rahman Abdul',
        '6281187481772': 'Abdul Rahman',
        '625520467850': 'Abdurrahman Aziz'
      },
      'DANA': {
        '08123456789': 'Charlie Brown',
        '08987654321': 'Diana Prince',
        '08111222333': 'Erik Johnson',
        '08118748177': 'Aziz Rahman',  // Original format - ini yang dicari!
        '081187481771': 'Aziz Rahman',
        '081187481772': 'Rahman Aziz',
        '05520467850': 'Abdurrahman Aziz',
        '08112345678': 'Test User DANA',
        '08551234567': 'Demo DANA',
        '08811223344': 'Sample DANA',
        // Keep 62xxx for backward compatibility
        '628123456789': 'Charlie Brown',
        '628987654321': 'Diana Prince',
        '628111222333': 'Erik Johnson',
        '628118748177': 'Aziz Rahman',
        '6281187481771': 'Aziz Rahman',
        '6281187481772': 'Rahman Aziz',
        '625520467850': 'Abdurrahman Aziz'
      },
      'LinkAja': {
        '08123456789': 'Frank Castle',
        '08987654321': 'Grace Kelly',
        '08111222333': 'Henry Ford',
        '08118748177': 'Rahman Aziz',  // Original format
        '081187481771': 'Rahman Aziz', 
        '081187481772': 'Aziz Rahman',
        '05520467850': 'Abdurrahman Aziz',
        '08112345678': 'Test User LinkAja',
        '08551234567': 'Demo LinkAja',
        '08811223344': 'Sample LinkAja',
        // Keep 62xxx for backward compatibility
        '628123456789': 'Frank Castle',
        '628987654321': 'Grace Kelly',
        '628111222333': 'Henry Ford',
        '628118748177': 'Rahman Aziz',
        '6281187481771': 'Rahman Aziz', 
        '6281187481772': 'Aziz Rahman',
        '625520467850': 'Abdurrahman Aziz'
      },
      'ShopeePay': {
        '08123456789': 'Ivan Petrov',
        '08987654321': 'Julia Roberts',
        '08111222333': 'Kevin Hart',
        '08118748177': 'Abdur Rahman',  // Original format
        '081187481771': 'Abdur Rahman',
        '081187481772': 'Rahman Abdul',
        '05520467850': 'Abdurrahman Aziz',
        '08112345678': 'Test User ShopeePay',
        '08551234567': 'Demo ShopeePay',
        '08811223344': 'Sample ShopeePay',
        // Keep 62xxx for backward compatibility
        '628123456789': 'Ivan Petrov',
        '628987654321': 'Julia Roberts',
        '628111222333': 'Kevin Hart',
        '628118748177': 'Abdur Rahman',
        '6281187481771': 'Abdur Rahman',
        '6281187481772': 'Rahman Abdul',
        '625520467850': 'Abdurrahman Aziz',
        '628112345678': 'Test User ShopeePay',
        '628551234567': 'Demo ShopeePay',
        '628811223344': 'Sample ShopeePay'
      }
    }

    // Try to find account with any of the phone formats
    let accountName: string | null = null
    let matchedFormat: string | null = null

    for (const format of phoneFormats) {
      const foundName = mockAccounts[provider]?.[format]
      if (foundName) {
        accountName = foundName
        matchedFormat = format
        console.log(`[Mock E-Wallet] Found match for ${provider} with format: ${format} → ${foundName}`)
        break
      }
    }

    if (accountName && matchedFormat) {
      // Cache mock data using the matched format for consistency
      await this.cacheAccountInfo(provider, matchedFormat, accountName, userId)
      
      return {
        success: true,
        accountName,
        message: `Account found (mock data) - matched format: ${matchedFormat}`
      }
    }

    console.log(`[Mock E-Wallet] No account found for ${provider} with any format:`, phoneFormats)
    console.log(`[Mock E-Wallet] Available ${provider} accounts:`, Object.keys(mockAccounts[provider] || {}))

    return {
      success: false,
      accountName: null,
      message: `Account not found for ${provider} (tried formats: ${phoneFormats.join(', ')})`
    }
  }

  /**
   * Public method to get account name - wrapper for checkAccountName
   * Used by API routes for account verification
   */
  async getAccountName(
    provider: string,
    phoneNumber: string,
    userId?: string
  ): Promise<EWalletAccountInfo> {
    return this.checkAccountName(phoneNumber, provider, userId, true)
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