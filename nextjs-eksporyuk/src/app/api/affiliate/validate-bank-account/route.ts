import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/affiliate/validate-bank-account
 * 
 * TEMPORARY: Bank validation feature disabled
 * Xendit Bank Account Validation API not available in current account
 * Returns error instructing user to input account holder name manually
 * 
 * Future: Will validate bank account via Xendit and auto-fetch account holder name
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

    // Validate account number format
    const cleanAccountNumber = accountNumber.replace(/\D/g, '')
    
    if (cleanAccountNumber.length < 8 || cleanAccountNumber.length > 20) {
      return NextResponse.json(
        { error: 'Nomor rekening harus 8-20 digit' },
        { status: 400 }
      )
    }

    // TEMPORARY: Bank validation feature not yet available
    // Xendit Bank Validation API requires activation or different endpoint
    // User must input account holder name manually for now
    return NextResponse.json(
      { 
        error: 'Validasi otomatis belum tersedia. Silakan input Nama Pemilik Rekening secara manual di bawah.',
        requireManualInput: true
      },
      { status: 503 }
    )

  } catch (error: any) {
    console.error('[BANK VALIDATION] API error:', error)
    return NextResponse.json(
      { error: 'Server error. Silakan input nama manual.' },
      { status: 500 }
    )
  }
}
