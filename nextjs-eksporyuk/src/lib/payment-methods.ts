/**
 * Payment Methods Helper
 * Filters available payment methods based on admin settings
 */

import { prisma } from './prisma'

export interface PaymentMethod {
  code: string
  name: string
  type: 'bank_transfer' | 'ewallet' | 'qris' | 'retail' | 'cardless_credit' | 'manual'
  icon: string
  isActive: boolean
  customLogoUrl?: string
  fee?: number
  description?: string
}

export interface BankAccount {
  id: string
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
  branch?: string
  isActive: boolean
  customLogoUrl?: string
  logo?: string
  order: number
}

/**
 * Get available payment methods based on settings
 */
export async function getAvailablePaymentMethods(): Promise<{
  xenditChannels: PaymentMethod[]
  manualBankAccounts: BankAccount[]
  settings: {
    enableManualBank: boolean
    enableXendit: boolean
    sandboxMode: boolean
    minAmount: number
    maxAmount: number
  }
}> {
  try {
    // Get payment settings
    const settings = await prisma.settings.findFirst({
      select: {
        paymentBankAccounts: true,
        paymentXenditChannels: true,
        paymentEnableManual: true,
        paymentEnableXendit: true,
        paymentSandboxMode: true,
        paymentMinAmount: true,
        paymentMaxAmount: true,
      }
    })

    // Default values if no settings
    const enableManualBank = settings?.paymentEnableManual ?? true
    const enableXendit = settings?.paymentEnableXendit ?? true
    const sandboxMode = settings?.paymentSandboxMode ?? false
    const minAmount = settings?.paymentMinAmount ?? 10000
    const maxAmount = settings?.paymentMaxAmount ?? 100000000

    // Get manual bank accounts (only active ones)
    let manualBankAccounts: BankAccount[] = []
    if (enableManualBank && settings?.paymentBankAccounts) {
      try {
        const accounts = Array.isArray(settings.paymentBankAccounts) 
          ? settings.paymentBankAccounts 
          : JSON.parse(String(settings.paymentBankAccounts))
        
        manualBankAccounts = accounts.filter((acc: BankAccount) => acc.isActive)
      } catch (e) {
        console.error('[Payment Methods] Error parsing bank accounts:', e)
      }
    }

    // Get Xendit channels (only active ones)
    let xenditChannels: PaymentMethod[] = []
    if (enableXendit && settings?.paymentXenditChannels) {
      try {
        const channels = Array.isArray(settings.paymentXenditChannels) 
          ? settings.paymentXenditChannels 
          : JSON.parse(String(settings.paymentXenditChannels))
        
        xenditChannels = channels.filter((ch: PaymentMethod) => ch.isActive)
      } catch (e) {
        console.error('[Payment Methods] Error parsing Xendit channels:', e)
        // Fallback to default active channels
        if (enableXendit) {
          xenditChannels = getDefaultActiveChannels()
        }
      }
    }

    return {
      xenditChannels,
      manualBankAccounts,
      settings: {
        enableManualBank,
        enableXendit,
        sandboxMode,
        minAmount,
        maxAmount,
      }
    }
  } catch (error) {
    console.error('[Payment Methods] Error fetching payment methods:', error)
    
    // Return defaults on error
    return {
      xenditChannels: getDefaultActiveChannels(),
      manualBankAccounts: [],
      settings: {
        enableManualBank: true,
        enableXendit: true,
        sandboxMode: false,
        minAmount: 10000,
        maxAmount: 100000000,
      }
    }
  }
}

/**
 * Get default active Xendit channels (used as fallback)
 */
function getDefaultActiveChannels(): PaymentMethod[] {
  return [
    { code: 'BCA', name: 'Bank Central Asia (BCA)', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'MANDIRI', name: 'Bank Mandiri', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'BNI', name: 'Bank Negara Indonesia (BNI)', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)', type: 'bank_transfer', icon: '🏦', isActive: true },
    { code: 'OVO', name: 'OVO', type: 'ewallet', icon: '💳', isActive: true },
    { code: 'DANA', name: 'DANA', type: 'ewallet', icon: '💳', isActive: true },
    { code: 'GOPAY', name: 'GoPay', type: 'ewallet', icon: '💳', isActive: true },
    { code: 'QRIS', name: 'QRIS (Scan QR)', type: 'qris', icon: '📱', isActive: true },
    { code: 'ALFAMART', name: 'Alfamart', type: 'retail', icon: '🏪', isActive: true },
    { code: 'INDOMARET', name: 'Indomaret', type: 'retail', icon: '🏪', isActive: true },
  ]
}

/**
 * Check if payment method is available
 */
export async function isPaymentMethodAvailable(code: string): Promise<boolean> {
  const { xenditChannels, manualBankAccounts, settings } = await getAvailablePaymentMethods()
  
  // Check Xendit channels
  if (settings.enableXendit) {
    const xenditAvailable = xenditChannels.some(ch => ch.code === code && ch.isActive)
    if (xenditAvailable) return true
  }
  
  // Check manual bank accounts
  if (settings.enableManualBank) {
    const manualAvailable = manualBankAccounts.some(acc => acc.bankCode === code && acc.isActive)
    if (manualAvailable) return true
  }
  
  return false
}

/**
 * Validate payment amount
 */
export async function validatePaymentAmount(amount: number): Promise<{ valid: boolean; error?: string }> {
  const { settings } = await getAvailablePaymentMethods()
  
  if (amount < settings.minAmount) {
    return {
      valid: false,
      error: `Minimum payment amount is Rp ${settings.minAmount.toLocaleString('id-ID')}`
    }
  }
  
  if (amount > settings.maxAmount) {
    return {
      valid: false,
      error: `Maximum payment amount is Rp ${settings.maxAmount.toLocaleString('id-ID')}`
    }
  }
  
  return { valid: true }
}

/**
 * Group Xendit channels by type
 */
export function groupChannelsByType(channels: PaymentMethod[]): Record<string, PaymentMethod[]> {
  return channels.reduce((acc, channel) => {
    if (!acc[channel.type]) {
      acc[channel.type] = []
    }
    acc[channel.type].push(channel)
    return acc
  }, {} as Record<string, PaymentMethod[]>)
}

/**
 * Get payment method display name
 */
export function getPaymentMethodName(code: string, channels: PaymentMethod[], bankAccounts: BankAccount[]): string {
  // Check Xendit channels
  const xenditChannel = channels.find(ch => ch.code === code)
  if (xenditChannel) return xenditChannel.name
  
  // Check manual bank accounts
  const bankAccount = bankAccounts.find(acc => acc.bankCode === code)
  if (bankAccount) return `${bankAccount.bankName} - Manual Transfer`
  
  return code
}
