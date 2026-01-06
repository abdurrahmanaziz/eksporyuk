import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

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

    // Validate account number format
    const cleanAccountNumber = accountNumber.replace(/\D/g, '')
    
    if (cleanAccountNumber.length < 8 || cleanAccountNumber.length > 20) {
      return NextResponse.json(
        { error: 'Nomor rekening harus 8-20 digit' },
        { status: 400 }
      )
    }

    // Get client IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Map bank name to Xendit bank code
    const bankCode = getBankCode(bankName)
    
    console.log('[BANK VALIDATION] Validating account:', {
      userId: session.user.id,
      bankName,
      bankCode,
      accountNumber: cleanAccountNumber.substring(0, 4) + '****',
      ipAddress
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
    
    let validationRecord
    
    try {
      // Xendit Bank Account Data API
      const xenditPayload = {
        bank_account_number: cleanAccountNumber,
        bank_code: bankCode,
      }
      
      console.log('[BANK VALIDATION] Calling Xendit API:', {
        bank_code: bankCode,
        account_length: cleanAccountNumber.length
      })
      
      const response = await fetch('https://api.xendit.co/bank_account_data_requests', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(xenditPayload)
      })

      const responseText = await response.text()
      let errorData: any = {}
      
      try {
        errorData = JSON.parse(responseText)
      } catch (e) {
        errorData = { raw_response: responseText }
      }

      if (!response.ok) {
        console.error('[BANK VALIDATION] Xendit error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          bankCode,
          accountNumberLength: cleanAccountNumber.length
        })
        
        // Log failed validation
        validationRecord = await prisma.bankAccountValidation.create({
          data: {
            userId: session.user.id,
            bankName,
            bankCode,
            accountNumber: cleanAccountNumber,
            isValid: false,
            errorMessage: JSON.stringify(errorData),
            ipAddress,
            userAgent,
          }
        })
        
        // Handle specific Xendit error codes
        const errorCode = errorData.error_code || ''
        const errorMsg = errorData.message || ''
        
        if (errorCode === 'INVALID_BANK_ACCOUNT_NUMBER' || errorMsg.includes('invalid')) {
          return NextResponse.json(
            { error: `Nomor rekening ${bankName} tidak valid atau format salah` },
            { status: 400 }
          )
        }
        
        if (errorCode === 'BANK_ACCOUNT_NOT_FOUND' || response.status === 404 || errorMsg.includes('not found')) {
          return NextResponse.json(
            { error: `Rekening ${bankName} ${cleanAccountNumber} tidak ditemukan. Pastikan nomor rekening benar dan aktif.` },
            { status: 404 }
          )
        }
        
        if (errorCode === 'BANK_CODE_NOT_SUPPORTED') {
          return NextResponse.json(
            { error: `Bank ${bankName} belum didukung untuk validasi otomatis. Silakan input nama manual atau hubungi admin.` },
            { status: 400 }
          )
        }
        
        // Generic error with details
        return NextResponse.json(
          { 
            error: `Gagal validasi rekening: ${errorMsg || 'Server error'}`,
            details: errorCode 
          },
          { status: response.status }
        )
      }

      const data = errorData
      
      console.log('[BANK VALIDATION] Success:', {
        accountHolderName: data.account_holder_name,
        bankCode: data.bank_code,
        userId: session.user.id
      })

      // Log successful validation
      validationRecord = await prisma.bankAccountValidation.create({
        data: {
          userId: session.user.id,
          bankName,
          bankCode,
          accountNumber: cleanAccountNumber,
          accountHolderName: data.account_holder_name,
          isValid: true,
          validatedAt: new Date(),
          ipAddress,
          userAgent,
        }
      })

      return NextResponse.json({
        success: true,
        accountHolderName: data.account_holder_name,
        bankCode: data.bank_code,
        accountNumber: data.account_number || cleanAccountNumber,
        isValid: true,
        validationId: validationRecord.id
      })

    } catch (xenditError: any) {
      console.error('[BANK VALIDATION] Xendit API error:', xenditError)
      
      // Log failed validation
      await prisma.bankAccountValidation.create({
        data: {
          userId: session.user.id,
          bankName,
          bankCode,
          accountNumber: cleanAccountNumber,
          isValid: false,
          errorMessage: xenditError.message || 'Unknown error',
          ipAddress,
          userAgent,
        }
      })
      
      throw xenditError
    }

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
    // Major Banks
    'BCA': 'BCA',
    'BNI': 'BNI',
    'BRI': 'BRI',
    'MANDIRI': 'MANDIRI',
    
    // Other Banks
    'PERMATA': 'PERMATA',
    'CIMB': 'CIMB',
    'CIMB NIAGA': 'CIMB',
    'DANAMON': 'DANAMON',
    'BSI': 'BSI',
    'BANK SYARIAH INDONESIA': 'BSI',
    'BTN': 'BTN',
    'BTPN': 'BTPN',
    'MAYBANK': 'MAYBANK',
    'OCBC': 'OCBC',
    'OCBC NISP': 'OCBC',
    'PANIN': 'PANIN',
    'BUKOPIN': 'BUKOPIN',
    'MEGA': 'MEGA',
    'BANK MEGA': 'MEGA',
    
    // Digital Banks (may not be supported by Xendit validation)
    'JENIUS': 'BTPN',  // Jenius is part of BTPN
    'JAGO': 'JAGO',
    'BANK JAGO': 'JAGO',
    'SEABANK': 'SEABANK',
    'NEO COMMERCE': 'NEO_COMMERCE',
    'BLU BCA': 'BCA', // Blu is BCA digital
    'LINE BANK': 'LINE_BANK',
  }
  
  const upperBankName = bankName.toUpperCase().trim()
  const bankCode = bankCodes[upperBankName]
  
  if (!bankCode) {
    console.warn('[BANK VALIDATION] Unknown bank name:', bankName)
    return 'BCA' // Default fallback
  }
  
  return bankCode
}
