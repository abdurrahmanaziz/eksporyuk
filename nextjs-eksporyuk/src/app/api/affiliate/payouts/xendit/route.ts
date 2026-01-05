import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { XenditPayout } from '@/lib/services/xendit-bank-payout'
import bcrypt from 'bcryptjs'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/affiliate/payouts/xendit
 * Process direct withdrawal via Xendit
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, pin, bankName, accountName, accountNumber } = body

    // Get withdrawal settings
    const settings = await prisma.settings.findFirst()
    const minPayout = Number(settings?.withdrawalMinAmount || 50000)
    const adminFee = Number(settings?.withdrawalAdminFee || 5000)
    const pinRequired = settings?.withdrawalPinRequired ?? true
    const xenditEnabled = settings?.paymentEnableXendit ?? false

    if (!xenditEnabled) {
      return NextResponse.json(
        { error: 'Withdrawal otomatis belum tersedia' },
        { status: 400 }
      )
    }

    // Validate amount
    if (!amount || amount < minPayout) {
      return NextResponse.json(
        { error: `Minimal penarikan adalah Rp ${minPayout.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Validate PIN
    if (pinRequired) {
      if (!pin) {
        return NextResponse.json(
          { error: 'PIN penarikan diperlukan' },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { withdrawalPin: true },
      })

      if (!user?.withdrawalPin) {
        return NextResponse.json(
          { error: 'PIN belum diatur' },
          { status: 400 }
        )
      }

      const isValidPin = await bcrypt.compare(pin, user.withdrawalPin)
      if (!isValidPin) {
        return NextResponse.json(
          { error: 'PIN tidak sesuai' },
          { status: 400 }
        )
      }
    }

    // Validate bank data
    if (!bankName || !accountName || !accountNumber) {
      return NextResponse.json(
        { error: 'Data rekening bank harus lengkap' },
        { status: 400 }
      )
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Calculate available balance from wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id, balance: 0 },
      })
    }

    // Get pending payouts
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        walletId: wallet.id,
        status: { in: ['PENDING', 'PROCESSING', 'APPROVED'] },
      },
      select: { amount: true },
    })

    const pending = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0)
    const available = Number(wallet.balance) - pending

    console.log('[BANK TRANSFER] Balance check:', {
      walletBalance: Number(wallet.balance),
      pendingAmount: pending,
      availableAmount: available,
      requestedAmount: amount
    })

    if (amount > available) {
      return NextResponse.json(
        { error: `Saldo tidak mencukupi. Available: Rp ${available.toLocaleString()}, Requested: Rp ${amount.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Calculate net amount after admin fee
    const netAmount = amount - adminFee

    if (netAmount <= 0) {
      return NextResponse.json(
        { error: `Jumlah penarikan harus lebih dari biaya admin (Rp ${adminFee.toLocaleString()})` },
        { status: 400 }
      )
    }

    // Create Xendit payout
    console.log('[XENDIT PAYOUT] Initializing Xendit service with user:', {
      userId: session.user.id,
      userEmail: session.user.email,
      amount: netAmount,
      bankName: bankName
    })
    const xenditPayout = new XenditPayout()
    
    // For banks, convert bank name to bank code
    const bankCode = getBankCode(bankName)
    console.log('[XENDIT PAYOUT] Bank code mapping:', { bankName, bankCode })
    
    try {
      console.log('[XENDIT PAYOUT] Creating payout request with:', {
        referenceId: `bank_${session.user.id}_${Date.now()}`,
        channelCode: bankCode,
        amount: netAmount,
        accountHolderName: accountName,
        accountNumber: accountNumber,
        userSession: {
          id: session.user.id,
          name: session.user.name || 'Unknown'
        }
      })
      
      const payout = await xenditPayout.createPayout({
        referenceId: `bank_${session.user.id}_${Date.now()}`,
        channelCode: bankCode,
        channelProperties: {
          accountHolderName: accountName,
          accountNumber: accountNumber,
        },
        amount: netAmount,
        currency: 'IDR',
        description: `Bank transfer payout - ${session.user?.name || session.user?.email || 'User'}`,
        metadata: {
          userId: session.user.id,
          type: 'bank_transfer'
        }
      })
      
      console.log('[XENDIT PAYOUT] Payout created successfully:', {
        id: payout.id,
        referenceId: payout.referenceId,
        status: payout.status,
        amount: netAmount
      })

      // Create payout record with Xendit ID
      const payoutRecord = await prisma.payout.create({
        data: {
          walletId: wallet.id,
          amount,
          status: 'PROCESSING',
          bankName,
          accountName,
          accountNumber,
          notes: 'Bank transfer otomatis via Xendit',
          metadata: {
            adminFee,
            netAmount,
            requestedAmount: amount,
            xenditId: payout.id,
            xenditReferenceId: payout.referenceId,
          },
        },
      })

      // Create wallet transaction (deduct from balance)
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type: 'PAYOUT_PROCESSING',
          description: `Bank transfer sebesar Rp ${amount.toLocaleString()} (Biaya admin: Rp ${adminFee.toLocaleString()}, Nett: Rp ${netAmount.toLocaleString()})`,
          reference: payoutRecord.id,
          metadata: {
            adminFee,
            netAmount,
            xenditId: payout.id,
          },
        },
      })

      // Update wallet balance (deduct the amount)
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount }
        }
      })

      console.log('[BANK TRANSFER] Wallet updated:', {
        previousBalance: Number(wallet.balance),
        newBalance: Number(wallet.balance) - amount,
        deductedAmount: amount
      })

      return NextResponse.json({
        success: true,
        payout: payoutRecord,
        xenditPayout: {
          id: payout.id,
          referenceId: payout.referenceId,
          status: payout.status,
          amount: netAmount,
        },
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
    } catch (xenditError) {
      console.error('[XENDIT BANK TRANSFER ERROR]', xenditError)
      
      // Handle specific Xendit errors
      if (xenditError.message?.includes('DUPLICATE_REFERENCE_ID')) {
        return NextResponse.json(
          { error: 'Permintaan bank transfer sedang diproses, mohon tunggu' },
          { status: 400 }
        )
      }
      
      if (xenditError.message?.includes('INSUFFICIENT_BALANCE')) {
        return NextResponse.json(
          { error: 'Saldo platform tidak mencukupi, hubungi admin' },
          { status: 400 }
        )
      }
      
      if (xenditError.message?.includes('INVALID_ACCOUNT')) {
        return NextResponse.json(
          { error: 'Nomor rekening tidak valid atau bank tidak mendukung transfer otomatis' },
          { status: 400 }
        )
      }
      
      throw xenditError // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('[BANK TRANSFER WITHDRAWAL ERROR] Full error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      response: error?.response,
      stack: error?.stack,
      type: error?.constructor?.name
    })
    
    // Handle Xendit specific errors
    if (error.message?.includes('DUPLICATE_REFERENCE_ID')) {
      return NextResponse.json(
        { error: 'Permintaan bank transfer sedang diproses, mohon tunggu' },
        { status: 400 }
      )
    }
    
    if (error.message?.includes('INSUFFICIENT_BALANCE')) {
      return NextResponse.json(
        { error: 'Saldo platform tidak mencukupi, hubungi admin' },
        { status: 400 }
      )
    }
    
    if (error.message?.includes('INVALID_ACCOUNT')) {
      return NextResponse.json(
        { error: 'Nomor rekening tidak valid atau bank tidak mendukung transfer otomatis' },
        { status: 400 }
      )
    }
    
    // Return more specific error information for debugging
    const errorMessage = error?.message || 'Gagal memproses bank transfer otomatis'
    console.error('[BANK TRANSFER WITHDRAWAL ERROR] Returning error response:', errorMessage)
    
    return NextResponse.json(
      { 
        error: 'Gagal memproses bank transfer otomatis',
        details: errorMessage,
        code: error?.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    )
  }
}

// Map bank names to Xendit bank channel codes (Payout API v2)
function getBankCode(bankName: string): string {
  const bankCodes: Record<string, string> = {
    // Major Banks
    'BCA': 'ID_BCA',
    'BNI': 'ID_BNI',
    'BRI': 'ID_BRI', 
    'MANDIRI': 'ID_MANDIRI',
    'PERMATA': 'ID_PERMATA',
    'CIMB': 'ID_CIMB',
    'CIMB NIAGA': 'ID_CIMB',
    'DANAMON': 'ID_DANAMON',
    'BSI': 'ID_BSI',
    'BTN': 'ID_BTN',
    'BTPN': 'ID_BTPN',
    'MAYBANK': 'ID_MAYBANK',
    'OCBC NISP': 'ID_OCBC_NISP',
    'PANIN': 'ID_PANIN',
    'BUKOPIN': 'ID_BUKOPIN',
    'MEGA': 'ID_MEGA',
    
    // Digital Banks
    'JENIUS': 'ID_BTPN',
    'LINE BANK': 'ID_LINEBANK',
    'SEABANK': 'ID_SEABANK',
    'JAGO': 'ID_JAGO',
    'NEO COMMERCE': 'ID_NEO',
    'BLU BCA': 'ID_BCA',
    'BLU BY BCA DIGITAL': 'ID_BCA',
  }
  
  const upperBankName = bankName.toUpperCase().trim()
  return bankCodes[upperBankName] || 'ID_BCA' // Default to BCA if not found
}