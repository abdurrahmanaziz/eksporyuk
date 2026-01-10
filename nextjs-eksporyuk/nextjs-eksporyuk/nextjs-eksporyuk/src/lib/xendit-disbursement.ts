import Xendit from 'xendit-node'

// Initialize Xendit client
const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
})

export interface DisbursementParams {
  externalId: string
  amount: number
  bankCode: string
  accountHolderName: string
  accountNumber: string
  description: string
  emailTo?: string[]
  emailCc?: string[]
  emailBcc?: string[]
}

export interface EWalletDisbursementParams {
  externalId: string
  amount: number
  phoneNumber: string
  channelCode: 'ID_OVO' | 'ID_DANA' | 'ID_GOPAY'
  description: string
}

/**
 * Create bank disbursement via Xendit
 */
export async function createBankDisbursement(params: DisbursementParams) {
  try {
    const { Disbursement } = xendit

    const disbursement = await Disbursement.create({
      externalID: params.externalId,
      amount: params.amount,
      bankCode: params.bankCode,
      accountHolderName: params.accountHolderName,
      accountNumber: params.accountNumber,
      description: params.description,
      emailTo: params.emailTo,
      emailCC: params.emailCc,
      emailBCC: params.emailBcc,
    })

    return {
      success: true,
      data: disbursement,
    }
  } catch (error: any) {
    console.error('Xendit bank disbursement error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create bank disbursement',
    }
  }
}

/**
 * Create e-wallet disbursement via Xendit
 */
export async function createEWalletDisbursement(params: EWalletDisbursementParams) {
  try {
    const { EWallet } = xendit

    const disbursement = await EWallet.createEWalletCharge({
      referenceID: params.externalId,
      currency: 'IDR',
      amount: params.amount,
      checkoutMethod: 'ONE_TIME_PAYMENT',
      channelCode: params.channelCode,
      channelProperties: {
        mobileNumber: params.phoneNumber,
      },
      metadata: {
        description: params.description,
      },
    })

    return {
      success: true,
      data: disbursement,
    }
  } catch (error: any) {
    console.error('Xendit e-wallet disbursement error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create e-wallet disbursement',
    }
  }
}

/**
 * Get disbursement by external ID
 */
export async function getDisbursementByExternalId(externalId: string) {
  try {
    const { Disbursement } = xendit

    const disbursement = await Disbursement.getByExternalID({
      externalID: externalId,
    })

    return {
      success: true,
      data: disbursement,
    }
  } catch (error: any) {
    console.error('Xendit get disbursement error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get disbursement',
    }
  }
}

/**
 * Get available disbursement banks
 */
export async function getAvailableDisbursementBanks() {
  try {
    const { Disbursement } = xendit

    const banks = await Disbursement.getAvailableBanks()

    return {
      success: true,
      data: banks,
    }
  } catch (error: any) {
    console.error('Xendit get banks error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get available banks',
    }
  }
}

/**
 * Map bank name to Xendit bank code
 */
export function getBankCode(bankName: string): string {
  const bankCodes: Record<string, string> = {
    'BCA': 'BCA',
    'MANDIRI': 'MANDIRI',
    'BNI': 'BNI',
    'BRI': 'BRI',
    'PERMATA': 'PERMATA',
    'CIMB': 'CIMB',
    'BNC': 'BNC',
    'MUAMALAT': 'MUAMALAT',
    'SAHABAT_SAMPOERNA': 'SAHABAT_SAMPOERNA',
    'BSI': 'BSI',
    'JAGO': 'JAGO',
    'JENIUS': 'JENIUS',
    'NEO': 'NEO',
    'SEABANK': 'SEABANK',
  }

  return bankCodes[bankName.toUpperCase()] || bankName.toUpperCase()
}

/**
 * Map e-wallet method to Xendit channel code
 */
export function getEWalletChannelCode(method: string): 'ID_OVO' | 'ID_DANA' | 'ID_GOPAY' | null {
  const channelMap: Record<string, 'ID_OVO' | 'ID_DANA' | 'ID_GOPAY'> = {
    'OVO': 'ID_OVO',
    'DANA': 'ID_DANA',
    'GOPAY': 'ID_GOPAY',
  }

  return channelMap[method.toUpperCase()] || null
}
