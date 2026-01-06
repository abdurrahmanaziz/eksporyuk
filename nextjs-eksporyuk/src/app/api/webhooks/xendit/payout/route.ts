import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks/xendit/payout
 * Handle Xendit payout status updates
 */
export async function POST(request: NextRequest) {
  try {
    const webhookToken = request.headers.get('x-callback-token')
    
    if (!webhookToken || webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      console.error('[Xendit Payout Webhook] Invalid webhook token')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('[Xendit Payout Webhook] Received:', JSON.stringify(body, null, 2))

    const {
      id: xenditPayoutId,
      reference_id: referenceId,
      status,
      failure_reason,
      updated,
      channel_code,
      channel_category,
      amount,
      account_holder
    } = body

    if (!xenditPayoutId || !status) {
      console.error('[Xendit Payout Webhook] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find payout by Xendit ID using dedicated field
    const payout = await prisma.payout.findFirst({
      where: {
        xenditPayoutId: xenditPayoutId
      }
    })

    if (!payout) {
      console.error('[Xendit Payout Webhook] Payout not found for Xendit ID:', xenditPayoutId)
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      )
    }

    console.log(`[Xendit Payout Webhook] Processing status update for payout ${payout.id}: ${status}`)

    // Map Xendit status to our PayoutStatus enum
    let newStatus: 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED'
    let description: string

    switch (status.toUpperCase()) {
      case 'SUCCEEDED':
        newStatus = 'PAID'
        description = `Withdrawal completed successfully to ${channel_code}`
        break
        
      case 'FAILED':
        newStatus = 'FAILED'
        description = `Withdrawal failed: ${failure_reason || 'Unknown error'}`
        break
        
      case 'CANCELLED':
        newStatus = 'FAILED'
        description = `Withdrawal cancelled: ${failure_reason || 'Cancelled by system'}`
        break
        
      case 'REVERSED':
        newStatus = 'REVERSED'
        description = `Withdrawal reversed: ${failure_reason || 'Reversed by payment provider'}`
        break
        
      case 'PENDING':
      case 'ACCEPTED':
        newStatus = 'PROCESSING'
        description = 'Withdrawal is being processed'
        break
        
      default:
        console.log(`[Xendit Payout Webhook] Unknown status: ${status}`)
        return NextResponse.json({ success: true }) // Don't process unknown statuses
    }

    // Update payout status with dedicated fields
    await prisma.$transaction(async (tx) => {
      // Update payout record with Xendit fields
      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: newStatus,
          xenditStatus: status,
          failureReason: failure_reason || null,
          paidAt: newStatus === 'PAID' ? new Date(updated) : null,
          updatedAt: new Date(updated)
        }
      })

      // If failed or reversed, refund the balance
      if (newStatus === 'FAILED' || newStatus === 'REVERSED') {
        console.log(`[Xendit Payout Webhook] Refunding ${newStatus.toLowerCase()} withdrawal: ${payout.amount}`)
        
        // Refund to wallet
        await tx.wallet.update({
          where: { id: payout.walletId },
          data: {
            balance: { increment: payout.amount }
          }
        })

        // Create refund transaction
        await tx.walletTransaction.create({
          data: {
            walletId: payout.walletId,
            amount: payout.amount,
            type: 'WITHDRAWAL_REFUND',
            description: `Refund for ${newStatus.toLowerCase()} withdrawal: ${description}`,
            reference: payout.id,
            metadata: {
              originalPayoutId: payout.id,
              xenditPayoutId: xenditPayoutId,
              failureReason: failure_reason,
              refundReason: `Xendit payout ${newStatus.toLowerCase()}`,
              refundedAt: new Date().toISOString()
            }
          }
        })
      }
    })

    // Log the status update
    console.log(`[Xendit Payout Webhook] Payout ${payout.id} updated to ${newStatus}`)

    // TODO: Send notification to user
    // You can add email/push notification here
    
    return NextResponse.json({ 
      success: true,
      processed: true,
      payoutId: payout.id,
      newStatus: newStatus
    })

  } catch (error: any) {
    console.error('[Xendit Payout Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}