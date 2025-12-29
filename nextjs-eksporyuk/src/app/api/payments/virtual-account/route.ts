import { NextRequest, NextResponse } from 'next/server'
import { xenditProxy } from '@/lib/xendit-proxy'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic';
// Create Virtual Account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, bankCode, customerName } = body

    if (!transactionId || !bankCode || !customerName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found' 
      }, { status: 404 })
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction is not in pending status' 
      }, { status: 400 })
    }

    // Create Virtual Account via Xendit
    const vaResult = await xenditProxy.createVirtualAccount({
      external_id: `VA-${transactionId}`,
      bank_code: bankCode,
      name: customerName,
      amount: transaction.amount,
      is_single_use: true,
      expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })

    if (!vaResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: vaResult.error || 'Failed to create virtual account' 
      }, { status: 500 })
    }

    // Update transaction with VA details
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        metadata: {
          ...transaction.metadata,
          virtualAccount: {
            id: vaResult.data.id,
            bankCode: vaResult.data.bank_code,
            accountNumber: vaResult.data.account_number,
            name: vaResult.data.name,
            expirationDate: vaResult.data.expiration_date
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      virtualAccount: {
        id: vaResult.data.id,
        bankCode: vaResult.data.bank_code,
        bankName: getBankName(vaResult.data.bank_code),
        accountNumber: vaResult.data.account_number,
        name: vaResult.data.name,
        amount: transaction.amount,
        expirationDate: vaResult.data.expiration_date,
        instructions: getVAInstructions(vaResult.data.bank_code)
      }
    })

  } catch (error) {
    console.error('Create VA error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

function getBankName(bankCode: string): string {
  const bankNames: { [key: string]: string } = {
    'BCA': 'Bank Central Asia',
    'BNI': 'Bank Negara Indonesia',
    'BRI': 'Bank Rakyat Indonesia',
    'MANDIRI': 'Bank Mandiri',
    'BSI': 'Bank Syariah Indonesia',
    'CIMB': 'CIMB Niaga'
  }
  
  return bankNames[bankCode] || bankCode
}

function getVAInstructions(bankCode: string): string[] {
  const instructions: { [key: string]: string[] } = {
    'BCA': [
      'Masuk ke menu Transfer di ATM/Mobile Banking BCA',
      'Pilih Virtual Account',
      'Masukkan nomor Virtual Account',
      'Masukkan nominal pembayaran',
      'Konfirmasi pembayaran'
    ],
    'BNI': [
      'Masuk ke menu Transfer di ATM/Mobile Banking BNI',
      'Pilih Virtual Account Billing',
      'Masukkan nomor Virtual Account',
      'Masukkan nominal pembayaran',
      'Konfirmasi pembayaran'
    ],
    'BRI': [
      'Masuk ke menu Transfer di ATM/Mobile Banking BRI',
      'Pilih Virtual Account',
      'Masukkan nomor Virtual Account',
      'Masukkan nominal pembayaran',
      'Konfirmasi pembayaran'
    ],
    'MANDIRI': [
      'Masuk ke menu Transfer di ATM/Mobile Banking Mandiri',
      'Pilih Virtual Account',
      'Masukkan nomor Virtual Account',
      'Masukkan nominal pembayaran',
      'Konfirmasi pembayaran'
    ],
    'BSI': [
      'Masuk ke menu Transfer di ATM/Mobile Banking BSI',
      'Pilih Virtual Account',
      'Masukkan nomor Virtual Account',
      'Masukkan nominal pembayaran',
      'Konfirmasi pembayaran'
    ]
  }
  
  return instructions[bankCode] || [
    'Masuk ke menu Transfer di ATM/Mobile Banking',
    'Pilih Virtual Account',
    'Masukkan nomor Virtual Account',
    'Masukkan nominal pembayaran',
    'Konfirmasi pembayaran'
  ]
}