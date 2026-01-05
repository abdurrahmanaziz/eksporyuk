import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Xendit } from '@/lib/xendit'
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

    // Calculate available balance
    const allConversions = await prisma.affiliateConversion.findMany({
      where: { affiliateId: affiliateProfile.id },
      select: { commissionAmount: true, paidOut: true },
    })

    const totalEarnings = allConversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)
    const paidOutTotal = allConversions
      .filter(c => c.paidOut)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    // Get or create wallet
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
    const available = totalEarnings - paidOutTotal - pending

    if (amount > available) {
      return NextResponse.json(
        { error: 'Saldo tidak mencukupi' },
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

    // Create Xendit disbursement
    const xendit = new Xendit({
      secretKey: process.env.XENDIT_SECRET_KEY!,
    })

    const disbursement = await xendit.Disbursement.create({
      external_id: `withdrawal_${session.user.id}_${Date.now()}`,
      bank_code: getBankCode(bankName),
      account_holder_name: accountName,
      account_number: accountNumber,
      description: `Penarikan komisi affiliate - ${session.user.name}`,
      amount: netAmount,
      email_to: [session.user.email],
      email_cc: [],
      email_bcc: [],
    })

    // Create payout record with Xendit ID
    const payout = await prisma.payout.create({
      data: {
        walletId: wallet.id,
        amount,
        status: 'PROCESSING',
        bankName,
        accountName,
        accountNumber,
        notes: 'Penarikan otomatis via Xendit',
        metadata: {
          adminFee,
          netAmount,
          requestedAmount: amount,
          xenditId: disbursement.id,
          xenditExternalId: disbursement.external_id,
        },
      },
    })

    // Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type: 'PAYOUT_PROCESSING',
        description: `Penarikan dana otomatis sebesar Rp ${amount.toLocaleString()} (Biaya admin: Rp ${adminFee.toLocaleString()}, Nett: Rp ${netAmount.toLocaleString()})`,
        reference: payout.id,
        metadata: {
          adminFee,
          netAmount,
          xenditId: disbursement.id,
        },
      },
    })

    return NextResponse.json({
      success: true,
      payout,
      disbursement: {
        id: disbursement.id,
        external_id: disbursement.external_id,
        status: disbursement.status,
        amount: netAmount,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('[XENDIT WITHDRAWAL ERROR]', error)
    
    // Handle Xendit specific errors
    if (error.message?.includes('DUPLICATE_EXTERNAL_ID')) {
      return NextResponse.json(
        { error: 'Permintaan penarikan sedang diproses, mohon tunggu' },
        { status: 400 }
      )
    }
    
    if (error.message?.includes('INSUFFICIENT_BALANCE')) {
      return NextResponse.json(
        { error: 'Saldo platform tidak mencukupi, hubungi admin' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Gagal memproses penarikan otomatis' },
      { status: 500 }
    )
  }
}

// Map bank/e-wallet names to Xendit bank codes
function getBankCode(bankName: string): string {
  const bankCodes: Record<string, string> = {
    // E-Wallets
    'OVO': 'OVO',
    'GOPAY': 'GOPAY',
    'DANA': 'DANA',
    'LINKAJA': 'LINKAJA',
    'SHOPEEPAY': 'SHOPEEPAY',
    
    // Major Banks
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
    
    // Digital Banks
    'JENIUS': 'BTPN',
    'LINE BANK': 'LINE_BANK',
    'SEABANK': 'SEABANK',
    'JAGO': 'JAGO',
    'NEO COMMERCE': 'NEO_COMMERCE',
    'BLU BCA': 'BCA',
    'BLU BY BCA DIGITAL': 'BCA',
  }
  
  const upperBankName = bankName.toUpperCase().trim()
  return bankCodes[upperBankName] || bankName.toUpperCase()
}