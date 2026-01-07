import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Bank code mapping for Xendit
const BANK_CODE_MAP: Record<string, string> = {
  'BCA': 'BCA',
  'Mandiri': 'MANDIRI',
  'BNI': 'BNI',
  'BRI': 'BRI',
  'CIMB Niaga': 'CIMB',
  'Permata': 'PERMATA',
  'Danamon': 'DANAMON',
  'BSI': 'BSI',
  'Jenius': 'BTPN', // Jenius is BTPN
  'LINE Bank': 'LINE_BANK',
  'SeaBank': 'SEABANK',
  'Jago': 'JAGO',
  'Neo Commerce': 'NEOCOMMERCE',
  'Blu BCA': 'BCA_DIGITAL',
  'BTN': 'BTN',
  'Maybank': 'MAYBANK',
  'OCBC NISP': 'OCBC',
  'Panin': 'PANIN',
  'BTPN': 'BTPN',
  'Bukopin': 'BUKOPIN',
  'Mega': 'MEGA'
}

/**
 * POST /api/affiliate/validate-bank-account
 * 
 * Try to validate bank account using Xendit Disbursement API
 * Creates a small test disbursement that gets validated by Xendit
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

    const cleanAccountNumber = accountNumber.replace(/\D/g, '')
    
    if (cleanAccountNumber.length < 8 || cleanAccountNumber.length > 20) {
      return NextResponse.json(
        { error: 'Nomor rekening harus 8-20 digit' },
        { status: 400 }
      )
    }

    const bankCode = BANK_CODE_MAP[bankName] || bankName.toUpperCase().replace(/\s+/g, '_')
    const xenditSecretKey = process.env.XENDIT_SECRET_KEY

    if (!xenditSecretKey) {
      return NextResponse.json(
        { error: 'Xendit not configured', requireManualInput: true },
        { status: 503 }
      )
    }

    // Try to get account holder name using Xendit's bank account inquiry
    // This creates a disbursement request that Xendit validates
    const externalId = `inquiry-${session.user.id}-${Date.now()}`
    
    const disbursementResponse = await fetch('https://api.xendit.co/disbursements', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(xenditSecretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'X-IDEMPOTENCY-KEY': externalId
      },
      body: JSON.stringify({
        external_id: externalId,
        bank_code: bankCode,
        account_holder_name: 'INQUIRY',
        account_number: cleanAccountNumber,
        amount: 1, // Minimum amount for inquiry
        description: 'Bank account validation inquiry'
      })
    })

    const disbursementData = await disbursementResponse.json()
    console.log('[BANK VALIDATION] Disbursement response:', JSON.stringify(disbursementData))

    // Check if we got an error with account holder name info
    if (disbursementData.error_code) {
      // If error mentions invalid account, let user know
      if (disbursementData.error_code === 'INVALID_DESTINATION') {
        return NextResponse.json({
          error: 'Nomor rekening tidak valid atau tidak ditemukan di bank ' + bankName,
          requireManualInput: true
        }, { status: 400 })
      }
      
      // For other errors, allow manual input
      return NextResponse.json({
        error: 'Validasi otomatis gagal. Silakan input nama pemilik rekening secara manual.',
        requireManualInput: true,
        details: disbursementData.message
      }, { status: 503 })
    }

    // Disbursement created successfully - this means account exists
    // Unfortunately, Xendit doesn't return actual account holder name in disbursement response
    // The actual name will only be available in the callback/webhook after processing
    
    // For now, we confirm the account EXISTS but user still needs to input name manually
    return NextResponse.json({
      success: false,
      error: 'Rekening valid. Silakan input Nama Pemilik Rekening secara manual.',
      requireManualInput: true,
      accountValid: true,
      bankCode: bankCode,
      message: 'Nomor rekening terdeteksi valid. Masukkan nama sesuai buku tabungan.'
    }, { status: 200 })

  } catch (error: any) {
    console.error('[BANK VALIDATION] API error:', error)
    return NextResponse.json(
      { error: 'Server error. Silakan input nama manual.', requireManualInput: true },
      { status: 500 }
    )
  }
}
