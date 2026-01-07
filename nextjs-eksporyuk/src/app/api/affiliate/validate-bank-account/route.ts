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

    // TEMPORARY: Bank validation feature not yet available in current Xendit account
    // Return error instructing user to input name manually
    return NextResponse.json(
      { 
        error: 'Validasi otomatis belum tersedia. Silakan input Nama Pemilik Rekening secara manual di bawah.',
        requireManualInput: true
      },
      { status: 503 }
    )

    /* TODO: Enable when Xendit Bank Validation is activated
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const bankCode = getBankCode(bankName)
    const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY
    
    if (!XENDIT_SECRET_KEY) {
      return NextResponse.json({ error: 'Xendit not configured' }, { status: 503 })
    }
    
    const auth = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64')
    
    // Call Xendit Bank Account Inquiry API
    const response = await fetch('https://api.xendit.co/bank_account_data_requests', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_number: cleanAccountNumber,
        bank_code: bankCode
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Gagal validasi rekening. Silakan input nama manual.' },
        { status: response.status }
      )
    }
    
    return NextResponse.json({
      success: true,
      accountHolderName: data.account_holder_name,
      isValid: true
    })
    */

  } catch (error: any) {
    console.error('[BANK VALIDATION] API error:', error)
    return NextResponse.json(
      { error: 'Server error. Silakan input nama manual.' },
      { status: 500 }
    )
  }
}

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
      
      // Xendit Bank Account Data Request returns account details after processing
      // Response format: { account_number, bank_code, account_holder_name, account_status, etc }
      const accountHolderName = data.account_holder_name || ''
      const accountStatus = data.account_status || data.status || ''
      
      console.log('[BANK VALIDATION] Response received:', {
        accountHolderName: accountHolderName,
        accountStatus: accountStatus,
        bankCode: data.bank_code,
        accountNumber: data.account_number,
        userId: session.user.id,
        responseId: data.id
      })
      
      // If we got account holder name, validation successful
      if (!accountHolderName) {
        // If status is PENDING, we need to poll or wait for callback
        return NextResponse.json(
          { error: 'Validasi sedang diproses. Silakan coba lagi dalam beberapa saat.' },
          { status: 202 }
        )
      }

      // Log successful validation
      validationRecord = await prisma.bankAccountValidation.create({
        data: {
          userId: session.user.id,
          bankName,
          bankCode,
          accountNumber: cleanAccountNumber,
          accountHolderName: accountHolderName,
          isValid: true,
          validatedAt: new Date(),
          ipAddress,
          userAgent,
        }
      })

      return NextResponse.json({
        success: true,
        accountHolderName: accountHolderName,
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
      
      return NextResponse.json(
        { error: 'Gagal menghubungi server validasi bank. Silakan coba lagi.' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('[BANK VALIDATION] API error:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

/**
 * Map bank name to Xendit bank code
 */
function getBankCode(bankName: string): string {
  const bankMap: Record<string, string> = {
    'BCA': 'BCA',
    'BNI': 'BNI',
    'BRI': 'BRI',
    'MANDIRI': 'MANDIRI',
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
    'PANIN': 'PANIN',
    'BUKOPIN': 'BUKOPIN',
    'MEGA': 'MEGA',
  }

  return bankMap[bankName.toUpperCase()] || bankName.toUpperCase()
}
