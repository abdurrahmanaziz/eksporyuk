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
  'Jenius': 'BTPN',
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
 * IMPORTANT: Xendit Indonesia does NOT provide a standalone Bank Account Inquiry API.
 * The `can_name_validate: true` field in available_disbursements_banks means Xendit
 * will validate the account holder name DURING the actual disbursement process,
 * not before.
 * 
 * For pre-disbursement validation, you need either:
 * 1. Third-party services (FLIP, DANA Business, etc.)
 * 2. Contact Xendit for enterprise Bank Account Inquiry access
 * 3. Manual input from user (current implementation)
 * 
 * This endpoint validates that the bank code exists and account number format is valid,
 * then requires manual name input from user.
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
      return NextResponse.json({
        success: false,
        requireManualInput: true,
        bankCode: bankCode,
        message: 'Silakan masukkan nama pemilik rekening sesuai buku tabungan.'
      }, { status: 200 })
    }

    // Validate that the bank code exists in Xendit's supported banks
    const banksResponse = await fetch('https://api.xendit.co/available_disbursements_banks', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(xenditSecretKey + ':').toString('base64')}`,
      }
    })

    if (!banksResponse.ok) {
      console.error('[BANK VALIDATION] Failed to fetch banks list')
      return NextResponse.json({
        success: false,
        requireManualInput: true,
        bankCode: bankCode,
        message: 'Silakan masukkan nama pemilik rekening sesuai buku tabungan.'
      }, { status: 200 })
    }

    const banks = await banksResponse.json()
    const bankExists = banks.find((b: any) => b.code === bankCode)
    
    if (!bankExists) {
      return NextResponse.json({
        error: `Bank "${bankName}" tidak ditemukan dalam daftar bank yang didukung`,
        requireManualInput: false
      }, { status: 400 })
    }

    // Bank exists, account number format is valid
    // Return success with requireManualInput to get account holder name
    return NextResponse.json({
      success: true,
      requireManualInput: true,
      bankCode: bankCode,
      bankName: bankExists.name,
      canNameValidate: bankExists.can_name_validate || false,
      message: bankExists.can_name_validate 
        ? 'Nama pemilik rekening akan diverifikasi saat proses withdrawal.'
        : 'Silakan masukkan nama pemilik rekening sesuai buku tabungan.'
    }, { status: 200 })

  } catch (error: any) {
    console.error('[BANK VALIDATION] API error:', error)
    return NextResponse.json({
      success: false,
      requireManualInput: true,
      message: 'Silakan masukkan nama pemilik rekening sesuai buku tabungan.'
    }, { status: 200 })
  }
}
