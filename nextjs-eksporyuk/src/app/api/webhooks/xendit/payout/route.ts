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

    // Find payout by Xendit ID
    const payout = await prisma.payout.findFirst({
      where: {
        metadata: {
          path: ['xenditPayoutId'],
          equals: xenditPayoutId
        }
      },
      include: {
        wallet: {
          include: {
            user: true
          }
        }
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

    // Map Xendit status to our status
    let newStatus: string
    let description: string

    switch (status.toUpperCase()) {
      case 'SUCCEEDED':
        newStatus = 'COMPLETED'
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
        
      case 'PENDING':
        newStatus = 'PROCESSING'
        description = 'Withdrawal is being processed'
        break
        
      default:
        console.log(`[Xendit Payout Webhook] Unknown status: ${status}`)
        return NextResponse.json({ success: true }) // Don't process unknown statuses
    }

    // Update payout status
    await prisma.$transaction(async (tx) => {
      // Update payout record
      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: newStatus as any,
          metadata: {
            ...payout.metadata,
            xenditStatus: status,
            xenditUpdated: updated,
            failureReason: failure_reason,
            webhookProcessedAt: new Date().toISOString()
          }
        }
      })

      // If failed, refund the balance
      if (newStatus === 'FAILED') {
        console.log(`[Xendit Payout Webhook] Refunding failed withdrawal: ${payout.amount}`)
        
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
            description: `Refund for failed withdrawal: ${description}`,
            reference: payout.id,
            metadata: {
              originalPayoutId: payout.id,
              xenditPayoutId: xenditPayoutId,
              failureReason: failure_reason,
              refundReason: 'Xendit payout failed'
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