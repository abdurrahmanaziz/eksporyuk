import { NextRequest, NextResponse } from 'next/server'
import { xenditService } from '@/lib/xendit'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic';
// Create eWallet Payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, ewalletType, phoneNumber } = body

    if (!transactionId || !ewalletType || !phoneNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Validate eWallet type
    const validEWallets = ['OVO', 'DANA', 'LINKAJA', 'GOPAY']
    if (!validEWallets.includes(ewalletType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid eWallet type' 
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

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)

    // Create eWallet payment via Xendit
    const paymentResult = await xenditService.createEWalletPayment(
      transactionId,
      transaction.amount,
      formattedPhone,
      ewalletType as 'OVO' | 'DANA' | 'LINKAJA' | 'GOPAY'
    )

    if (!paymentResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: paymentResult.error || 'Failed to create eWallet payment' 
      }, { status: 500 })
    }

    // Update transaction with eWallet payment details
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        metadata: {
          ...transaction.metadata,
          ewalletPayment: {
            id: paymentResult.data.id,
            referenceId: paymentResult.data.referenceId,
            ewalletType: ewalletType,
            phoneNumber: formattedPhone,
            actionUrl: paymentResult.data.actions?.desktopWebCheckoutUrl || paymentResult.data.actions?.mobileWebCheckoutUrl,
            qrCode: paymentResult.data.actions?.qrCheckoutString
          }
        }
      }
    })

    // Determine redirect URL or action
    let actionUrl = null
    let qrCode = null
    let instructions = []

    if (paymentResult.data.actions) {
      actionUrl = paymentResult.data.actions.desktopWebCheckoutUrl || paymentResult.data.actions.mobileWebCheckoutUrl
      qrCode = paymentResult.data.actions.qrCheckoutString
    }

    // Get instructions based on eWallet type
    instructions = getEWalletInstructions(ewalletType, formattedPhone, actionUrl, qrCode)

    return NextResponse.json({
      success: true,
      ewalletPayment: {
        id: paymentResult.data.id,
        referenceId: paymentResult.data.referenceId,
        ewalletType,
        phoneNumber: formattedPhone,
        amount: Number(transaction.amount),
        actionUrl,
        qrCode,
        instructions,
        status: paymentResult.data.status
      }
    })

  } catch (error) {
    console.error('Create eWallet payment error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleanPhone = phone.replace(/\D/g, '')
  
  // Convert to +62 format
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '+62' + cleanPhone.substring(1)
  } else if (cleanPhone.startsWith('62')) {
    cleanPhone = '+' + cleanPhone
  } else if (!cleanPhone.startsWith('+62')) {
    cleanPhone = '+62' + cleanPhone
  }
  
  return cleanPhone
}

function getEWalletInstructions(ewalletType: string, phoneNumber: string, actionUrl?: string | null, qrCode?: string | null): string[] {
  const baseInstructions: { [key: string]: string[] } = {
    'OVO': [
      'Pastikan nomor HP terdaftar di OVO',
      'Buka aplikasi OVO di HP Anda',
      'Akan ada notifikasi pembayaran masuk',
      'Konfirmasi pembayaran dengan PIN OVO'
    ],
    'DANA': [
      'Pastikan nomor HP terdaftar di DANA',
      'Buka aplikasi DANA di HP Anda',
      'Akan ada notifikasi pembayaran masuk',
      'Konfirmasi pembayaran dengan PIN DANA'
    ],
    'GOPAY': [
      'Pastikan nomor HP terdaftar di GoPay',
      'Buka aplikasi Gojek di HP Anda',
      'Akan ada notifikasi pembayaran masuk',
      'Konfirmasi pembayaran dengan PIN GoPay'
    ],
    'LINKAJA': [
      'Pastikan nomor HP terdaftar di LinkAja',
      'Buka aplikasi LinkAja di HP Anda',
      'Akan ada notifikasi pembayaran masuk',
      'Konfirmasi pembayaran dengan PIN LinkAja'
    ]
  }
  
  let instructions = [...(baseInstructions[ewalletType] || [])]
  
  // Add specific instructions based on available actions
  if (actionUrl) {
    instructions.unshift('Klik tombol "Buka Aplikasi" di bawah atau scan QR code')
  }
  
  if (qrCode) {
    instructions.push('Atau scan QR code yang tersedia')
  }
  
  return instructions
}