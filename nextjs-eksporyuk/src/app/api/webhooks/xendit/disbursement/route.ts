import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/webhooks/xendit/disbursement
 * Handle Xendit disbursement status updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN

    // Verify webhook signature if token is set
    if (webhookToken) {
      const signature = request.headers.get('x-callback-token')
      
      if (!signature || signature !== webhookToken) {
        console.error('[XENDIT WEBHOOK] Invalid signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const data = JSON.parse(body)
    console.log('[XENDIT WEBHOOK] Received disbursement update:', data)

    const { 
      id: xenditId,
      external_id,
      status,
      bank_code,
      account_holder_name,
      account_number,
      amount,
      failure_reason
    } = data

    if (!external_id) {
      console.error('[XENDIT WEBHOOK] Missing external_id')
      return NextResponse.json({ error: 'Missing external_id' }, { status: 400 })
    }

    // Find payout record by Xendit ID
    const payout = await prisma.payout.findFirst({
      where: {
        metadata: {
          path: ['xenditId'],
          equals: xenditId,
        },
      },
      include: {
        wallet: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!payout) {
      console.warn(`[XENDIT WEBHOOK] Payout not found for xenditId: ${xenditId}`)
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    // Map Xendit status to our status
    let newStatus = 'PROCESSING'
    let description = 'Status pembayaran diperbarui'

    switch (status) {
      case 'COMPLETED':
        newStatus = 'COMPLETED'
        description = `Penarikan berhasil dikirim ke rekening ${bank_code} ${account_number} a.n. ${account_holder_name}`
        
        // Mark related affiliate conversions as paid out
        await markConversionsAsPaidOut(payout.walletId, Number(payout.amount))
        break
        
      case 'FAILED':
        newStatus = 'CANCELLED'
        description = `Penarikan gagal: ${failure_reason || 'Kesalahan sistem bank'}`
        
        // Refund the amount back to wallet
        await refundFailedWithdrawal(payout.walletId, Number(payout.amount))
        break
        
      case 'PENDING':
        newStatus = 'PROCESSING'
        description = 'Penarikan sedang diproses oleh bank'
        break
        
      default:
        console.log(`[XENDIT WEBHOOK] Unhandled status: ${status}`)
        break
    }

    // Update payout status
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: newStatus,
        metadata: {
          ...(payout.metadata as object || {}),
          xenditStatus: status,
          xenditFailureReason: failure_reason,
          lastUpdated: new Date().toISOString(),
        },
      },
    })

    // Create wallet transaction for status update
    await prisma.walletTransaction.create({
      data: {
        walletId: payout.walletId,
        amount: 0, // Status update, no amount change
        type: newStatus === 'COMPLETED' ? 'PAYOUT_COMPLETED' : 
              newStatus === 'CANCELLED' ? 'PAYOUT_REFUNDED' : 'PAYOUT_UPDATE',
        description,
        reference: payout.id,
        metadata: {
          xenditId,
          xenditStatus: status,
          originalAmount: payout.amount,
          failureReason: failure_reason,
        },
      },
    })

    // Send notification based on status
    if (payout.wallet.user) {
      await sendWithdrawalNotification(payout.wallet.user, {
        status: newStatus,
        amount: Number(payout.amount),
        description,
        xenditId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[XENDIT WEBHOOK] Error processing disbursement webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Mark affiliate conversions as paid out
 */
async function markConversionsAsPaidOut(walletId: string, amount: number) {
  try {
    // Get wallet user
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: { user: { include: { affiliateProfile: true } } },
    })

    if (!wallet?.user?.affiliateProfile) {
      return
    }

    // Get unpaid conversions
    const unpaidConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: wallet.user.affiliateProfile.id,
        paidOut: false,
      },
      orderBy: { createdAt: 'asc' },
    })

    let remainingAmount = amount
    const conversionsToUpdate = []

    for (const conversion of unpaidConversions) {
      const commissionAmount = Number(conversion.commissionAmount)
      
      if (remainingAmount >= commissionAmount) {
        conversionsToUpdate.push(conversion.id)
        remainingAmount -= commissionAmount
        
        if (remainingAmount <= 0) break
      }
    }

    // Update conversions as paid out
    if (conversionsToUpdate.length > 0) {
      await prisma.affiliateConversion.updateMany({
        where: { id: { in: conversionsToUpdate } },
        data: { 
          paidOut: true,
          paidOutAt: new Date(),
        },
      })

      console.log(`[XENDIT WEBHOOK] Marked ${conversionsToUpdate.length} conversions as paid out`)
    }
  } catch (error) {
    console.error('[XENDIT WEBHOOK] Error marking conversions as paid out:', error)
  }
}

/**
 * Refund failed withdrawal amount back to wallet
 */
async function refundFailedWithdrawal(walletId: string, amount: number) {
  try {
    // Create refund transaction
    await prisma.walletTransaction.create({
      data: {
        walletId,
        amount: amount,
        type: 'PAYOUT_REFUND',
        description: `Refund penarikan yang gagal sebesar Rp ${amount.toLocaleString()}`,
        metadata: {
          refundReason: 'Xendit disbursement failed',
          originalAmount: amount,
        },
      },
    })

    console.log(`[XENDIT WEBHOOK] Refunded ${amount} to wallet ${walletId}`)
  } catch (error) {
    console.error('[XENDIT WEBHOOK] Error refunding failed withdrawal:', error)
  }
}

/**
 * Send withdrawal notification to user
 */
async function sendWithdrawalNotification(user: any, data: any) {
  try {
    // Import notification service dynamically to avoid circular dependencies
    const { notificationService } = await import('@/lib/services/notificationService')
    
    const statusText = {
      COMPLETED: 'berhasil',
      CANCELLED: 'gagal',
      PROCESSING: 'sedang diproses',
    }[data.status] || 'diperbarui'

    const message = data.status === 'COMPLETED' 
      ? `🎉 Penarikan sebesar Rp ${data.amount.toLocaleString()} berhasil dikirim ke rekening Anda!`
      : data.status === 'CANCELLED'
      ? `❌ Penarikan sebesar Rp ${data.amount.toLocaleString()} gagal diproses. Dana akan dikembalikan ke saldo Anda.`
      : `⏳ Penarikan sebesar Rp ${data.amount.toLocaleString()} sedang diproses oleh bank.`

    await notificationService.sendWithdrawalUpdate(user.id, {
      title: `Penarikan ${statusText}`,
      message,
      amount: data.amount,
      status: data.status,
      xenditId: data.xenditId,
    })
  } catch (error) {
    console.error('[XENDIT WEBHOOK] Error sending notification:', error)
  }
}