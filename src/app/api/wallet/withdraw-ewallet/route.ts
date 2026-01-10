import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { getXenditPayoutService } from '@/lib/services/xendit-payout'

export const dynamic = 'force-dynamic'

/**
 * POST /api/wallet/withdraw-ewallet
 * Process e-wallet withdrawal via Xendit Payout API
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { 
      provider, 
      phoneNumber, 
      accountName, 
      amount, 
      pin 
    } = await request.json()

    // Validation
    if (!provider || !phoneNumber || !accountName || !amount || !pin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount < 10000) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is Rp 10,000' },
        { status: 400 }
      )
    }

    console.log(`[E-Wallet Withdrawal] User: ${session.user.id}, Provider: ${provider}, Amount: ${amount}`)

    // Get user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Check balance
    if (wallet.balance < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: Rp ${wallet.balance.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Verify PIN
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { withdrawalPin: true }
    })

    if (!user?.withdrawalPin) {
      return NextResponse.json(
        { error: 'Withdrawal PIN not set' },
        { status: 400 }
      )
    }

    const bcrypt = require('bcrypt')
    const pinValid = await bcrypt.compare(pin, user.withdrawalPin)
    
    if (!pinValid) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 400 }
      )
    }

    // Get withdrawal settings
    const settings = await prisma.platformSetting.findFirst()
    const adminFee = Number(settings?.withdrawalAdminFee || 2500)
    const minAmount = Number(settings?.withdrawalMinAmount || 10000)

    if (amount < minAmount) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is Rp ${minAmount.toLocaleString()}` },
        { status: 400 }
      )
    }

    const netAmount = amount - adminFee

    if (netAmount <= 0) {
      return NextResponse.json(
        { error: `Amount must be greater than admin fee (Rp ${adminFee.toLocaleString()})` },
        { status: 400 }
      )
    }

    // Check if Xendit is configured
    const xenditService = getXenditPayoutService()
    
    if (!xenditService.isConfigured()) {
      return NextResponse.json(
        { error: 'Withdrawal service not available' },
        { status: 503 }
      )
    }

    // Generate unique reference ID
    const referenceId = `withdrawal_${session.user.id}_${Date.now()}`

    try {
      // Create payout via Xendit
      console.log(`[E-Wallet Withdrawal] Creating Xendit payout: ${referenceId}`)
      
      const payoutResult = await xenditService.createPayout(
        provider,
        phoneNumber,
        accountName,
        netAmount,
        referenceId,
        {
          userId: session.user.id,
          userEmail: session.user.email,
          userName: session.user.name,
          originalAmount: amount,
          adminFee: adminFee,
          provider: provider
        }
      )

      if (!payoutResult.success || !payoutResult.payout) {
        console.error('[E-Wallet Withdrawal] Xendit payout failed:', payoutResult.error)
        return NextResponse.json(
          { error: payoutResult.error || 'Payout creation failed' },
          { status: 400 }
        )
      }

      const xenditPayout = payoutResult.payout

      // Create database records in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct from wallet balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: amount }
          }
        })

        // Create payout record with Xendit integration fields
        const payout = await tx.payout.create({
          data: {
            walletId: wallet.id,
            amount: amount,
            status: 'PROCESSING',
            bankName: provider,
            accountName: accountName,
            accountNumber: phoneNumber,
            notes: `E-wallet withdrawal via ${provider}`,
            // Xendit integration fields
            xenditPayoutId: xenditPayout.id,
            channelCode: xenditPayout.channel_code || provider,
            channelCategory: 'EWALLET',
            phoneNumber: phoneNumber,
            referenceId: xenditPayout.reference_id,
            xenditStatus: xenditPayout.status,
            estimatedArrival: xenditPayout.estimated_arrival_time ? new Date(xenditPayout.estimated_arrival_time) : null,
            adminFee: adminFee,
            netAmount: netAmount,
            metadata: {
              userId: session.user.id,
              userEmail: session.user.email,
              userName: session.user.name,
              originalAmount: amount
            }
          }
        })

        // Create wallet transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: -amount,
            type: 'WITHDRAWAL',
            description: `Withdrawal to ${provider} ${phoneNumber} - ${accountName}`,
            reference: payout.id,
            metadata: {
              provider: provider,
              phoneNumber: phoneNumber,
              accountName: accountName,
              adminFee: adminFee,
              netAmount: netAmount,
              xenditPayoutId: xenditPayout.id,
              referenceId: xenditPayout.reference_id,
              xenditStatus: xenditPayout.status,
              channelCode: xenditPayout.channel_code
            }
          }
        })

        return payout
      })

      console.log(`[E-Wallet Withdrawal] Success: Payout ID ${result.id}, Xendit ID ${xenditPayout.id}`)

      return NextResponse.json({
        success: true,
        payout: {
          id: result.id,
          amount: amount,
          netAmount: netAmount,
          adminFee: adminFee,
          provider: provider,
          accountName: accountName,
          phoneNumber: phoneNumber,
          status: 'PROCESSING',
          estimatedArrival: xenditPayout.estimated_arrival_time,
          xenditId: xenditPayout.id
        },
        message: `Withdrawal of Rp ${netAmount.toLocaleString()} to ${provider} is being processed. Net amount after admin fee: Rp ${netAmount.toLocaleString()}`
      })

    } catch (xenditError: any) {
      console.error('[E-Wallet Withdrawal] Xendit error:', xenditError)
      return NextResponse.json(
        { error: 'Withdrawal service temporarily unavailable' },
        { status: 503 }
      )
    }

  } catch (error: any) {
    console.error('[E-Wallet Withdrawal] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}