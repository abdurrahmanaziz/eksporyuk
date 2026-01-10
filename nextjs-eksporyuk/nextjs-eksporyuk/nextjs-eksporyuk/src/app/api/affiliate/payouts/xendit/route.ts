import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/affiliate/payouts/xendit
 * Process direct withdrawal via Xendit API v2/payouts
 */
export async function POST(request: NextRequest) {
  console.log('[BANK TRANSFER] Starting withdrawal request...')
  
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('[BANK TRANSFER] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { amount, pin, bankName, accountName, accountNumber } = body
    
    console.log('[BANK TRANSFER] Request data:', {
      userId: session.user.id,
      amount: Number(amount),
      bankName,
      accountName: accountName?.substring(0, 10) + '...',
      accountNumber: accountNumber?.substring(0, 5) + '***'
    })

    // 3. Get settings
    const settings = await prisma.settings.findFirst()
    const minPayout = Number(settings?.withdrawalMinAmount || 50000)
    const adminFee = Number(settings?.withdrawalAdminFee || 5000)
    const pinRequired = settings?.withdrawalPinRequired ?? true
    const xenditEnabled = settings?.paymentEnableXendit ?? false

    console.log('[BANK TRANSFER] Settings:', {
      minPayout,
      adminFee,
      pinRequired,
      xenditEnabled
    })

    if (!xenditEnabled) {
      return NextResponse.json({ error: 'Withdrawal otomatis belum tersedia' }, { status: 400 })
    }

    // 4. Validate amount
    if (!amount || Number(amount) < minPayout) {
      return NextResponse.json({
        error: `Minimal penarikan adalah Rp ${minPayout.toLocaleString()}`
      }, { status: 400 })
    }

    // 5. Validate PIN
    if (pinRequired && !pin) {
      return NextResponse.json({ error: 'PIN penarikan diperlukan' }, { status: 400 })
    }

    if (pinRequired) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { withdrawalPin: true },
      })

      if (!user?.withdrawalPin) {
        return NextResponse.json({ error: 'PIN belum diatur' }, { status: 400 })
      }

      const isValidPin = await bcrypt.compare(pin, user.withdrawalPin)
      if (!isValidPin) {
        return NextResponse.json({ error: 'PIN tidak sesuai' }, { status: 400 })
      }
    }

    // 6. Validate bank data
    if (!bankName || !accountName || !accountNumber) {
      return NextResponse.json({ error: 'Data rekening bank harus lengkap' }, { status: 400 })
    }

    // 7. Get wallet and check balance
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id, balance: 0 },
      })
    }

    // Get pending payouts to calculate available balance
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        walletId: wallet.id,
        status: { in: ['PENDING', 'PROCESSING', 'APPROVED'] },
      },
    })

    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0)
    const availableBalance = Number(wallet.balance) - pendingAmount

    console.log('[BANK TRANSFER] Balance check:', {
      walletBalance: Number(wallet.balance),
      pendingAmount,
      availableBalance,
      requestedAmount: Number(amount)
    })

    if (Number(amount) > availableBalance) {
      return NextResponse.json({
        error: `Saldo tidak mencukupi. Tersedia: Rp ${availableBalance.toLocaleString()}`
      }, { status: 400 })
    }

    // 8. Calculate net amount
    const netAmount = Number(amount) - adminFee
    if (netAmount <= 0) {
      return NextResponse.json({
        error: `Jumlah penarikan harus lebih dari biaya admin (Rp ${adminFee.toLocaleString()})`
      }, { status: 400 })
    }

    // 9. Create payout record FIRST
    const referenceId = `payout_${session.user.id}_${Date.now()}`
    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const payoutRecord = await prisma.payout.create({
      data: {
        id: payoutId,
        walletId: wallet.id,
        amount: Number(amount),
        status: 'PENDING',
        bankName,
        accountName,
        accountNumber,
        notes: 'Bank transfer via Xendit - Pending',
        referenceId,
        channelCode: getBankCode(bankName),
        channelCategory: 'BANK',
        adminFee: adminFee,
        netAmount: netAmount,
        metadata: {
          requestedAmount: Number(amount),
          adminFee,
          netAmount,
          bankCode: getBankCode(bankName),
        },
      },
    })

    // 10. Deduct balance immediately
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: Number(amount) } }
    })

    // 11. Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -Number(amount),
        type: 'PAYOUT_PROCESSING',
        description: `Bank transfer Rp ${Number(amount).toLocaleString()} ke ${bankName} - ${accountNumber}`,
        reference: payoutRecord.id,
      },
    })

    console.log('[BANK TRANSFER] DB records created, calling Xendit...')

    // 12. Call Xendit API directly (simplified)
    const xenditApiKey = process.env.XENDIT_SECRET_KEY || process.env.XENDIT_API_KEY
    
    if (!xenditApiKey) {
      console.error('[BANK TRANSFER] No Xendit API key found!')
      throw new Error('Xendit API not configured')
    }

    const xenditRequest = {
      reference_id: referenceId,
      channel_code: getBankCode(bankName),
      channel_properties: {
        account_holder_name: accountName,
        account_number: accountNumber,
      },
      amount: netAmount,
      currency: 'IDR',
      description: `Bank transfer payout - ${session.user?.email}`,
    }

    console.log('[BANK TRANSFER] Sending to Xendit:', {
      reference_id: xenditRequest.reference_id,
      channel_code: xenditRequest.channel_code,
      amount: xenditRequest.amount,
      account_number: xenditRequest.channel_properties.account_number?.substring(0, 5) + '***'
    })

    const xenditResponse = await fetch('https://api.xendit.co/v2/payouts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(xenditApiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': referenceId,
      },
      body: JSON.stringify(xenditRequest)
    })

    if (!xenditResponse.ok) {
      const errorData = await xenditResponse.json().catch(() => ({}))
      console.error('[BANK TRANSFER] Xendit error:', {
        status: xenditResponse.status,
        error: errorData
      })
      
      // Update payout to FAILED
      await prisma.payout.update({
        where: { id: payoutRecord.id },
        data: {
          status: 'FAILED',
          notes: `Xendit error: ${errorData.message || 'API Error'}`,
          failureReason: errorData.message || 'API Error',
          xenditStatus: 'FAILED',
        },
      })
      
      // Refund balance
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: Number(amount) } }
      })
      
      throw new Error(errorData.message || 'Xendit API error')
    }

    const xenditPayout = await xenditResponse.json()
    
    console.log('[BANK TRANSFER] Xendit success:', {
      id: xenditPayout.id,
      status: xenditPayout.status
    })

    // 13. Update payout record with success
    await prisma.payout.update({
      where: { id: payoutRecord.id },
      data: {
        status: 'PROCESSING',
        notes: 'Bank transfer via Xendit - Processing',
        xenditPayoutId: xenditPayout.id,
        xenditStatus: xenditPayout.status,
        estimatedArrival: xenditPayout.estimated_arrival_time ? new Date(xenditPayout.estimated_arrival_time) : null,
        metadata: {
          ...payoutRecord.metadata as object,
          xenditId: xenditPayout.id,
          xenditStatus: xenditPayout.status,
          xenditResponse: xenditPayout,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Penarikan berhasil diproses',
      payout: {
        id: payoutRecord.id,
        amount: Number(amount),
        netAmount,
        adminFee,
        status: 'PROCESSING',
        bankName,
        accountName,
        accountNumber,
      },
      xendit: {
        id: xenditPayout.id,
        status: xenditPayout.status,
      },
    })

  } catch (error: any) {
    console.error('[BANK TRANSFER] Error:', error)
    return NextResponse.json({
      error: error.message || 'Terjadi kesalahan sistem',
    }, { status: 500 })
  }
}

/**
 * Helper function to get Xendit bank code from bank name
 */
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