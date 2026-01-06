import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/affiliate/validate-bank-account
 * Validate bank account and get account holder name from Xendit
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bankName, accountNumber } = body

    if (!bankName || !accountNumber) {
      return NextResponse.json(
        { error: 'Bank name and account number are required' },
        { status: 400 }
      )
    }

    // Map bank name to Xendit bank code
    const bankCode = getBankCode(bankName)
    
    console.log('[BANK VALIDATION] Validating account:', {
      bankName,
      bankCode,
      accountNumber: accountNumber.substring(0, 4) + '****'
    })

    // Call Xendit Bank Account Validation API
    const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY
    
    if (!XENDIT_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Xendit not configured' },
        { status: 503 }
      )
    }

    const auth = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64')
    
    // Xendit Bank Account Data API
    // https://developers.xendit.co/api-reference/#bank-account-data
    const response = await fetch('https://api.xendit.co/bank_account_data_requests', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bank_account_number: accountNumber,
        bank_code: bankCode,
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[BANK VALIDATION] Error:', {
        status: response.status,
        error: errorData
      })
      
      // Handle specific errors
      if (response.status === 400) {
        return NextResponse.json(
          { error: 'Nomor rekening tidak valid' },
          { status: 400 }
        )
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Bank account not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Gagal validasi rekening bank' },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    console.log('[BANK VALIDATION] Success:', {
      accountHolderName: data.account_holder_name,
      bankCode: data.bank_code
    })

    return NextResponse.json({
      success: true,
      accountHolderName: data.account_holder_name,
      bankCode: data.bank_code,
      accountNumber: data.account_number,
      isValid: true
    })

  } catch (error: any) {
    console.error('[BANK VALIDATION ERROR]', error)
    
    return NextResponse.json(
      { 
        error: 'Gagal validasi rekening bank',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

function getBankCode(bankName: string): string {
  const bankCodes: Record<string, string> = {
    'BCA': 'BCA',
    'BNI': 'BNI',
    'BRI': 'BRI',
    'MANDIRI': 'MANDIRI',
    'PERMATA': 'PERMATA',
    'CIMB': 'CIMB',
    'CIMB NIAGA': 'CIMB',
    'DANAMON': 'DANAMON',
    'BSI': 'BSI',
    'BTN': 'BTN',
    'BTPN': 'BTPN',
    'MAYBANK': 'MAYBANK',
    'OCBC NISP': 'OCBC',
    'PANIN': 'PANIN',
    'BUKOPIN': 'BUKOPIN',
    'MEGA': 'MEGA',
  }
  
  const upperBankName = bankName.toUpperCase().trim()
  return bankCodes[upperBankName] || 'BCA'
}
