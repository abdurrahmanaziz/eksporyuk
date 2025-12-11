import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, rejectionReason } = body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get payout request
    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      include: { wallet: true },
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    if (payout.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Payout already processed' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Update payout status to APPROVED
      await prisma.payout.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
          approvedBy: session.user.id,
        },
      })

      // Deduct from wallet balance
      await prisma.wallet.update({
        where: { id: payout.walletId },
        data: {
          balance: { decrement: payout.amount },
          totalPayout: { increment: payout.amount },
        },
      })

      // Create wallet transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: payout.walletId,
          amount: payout.amount,
          type: 'DEBIT',
          description: 'Payout approved and processed',
          reference: payout.id,
        },
      })
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        )
      }

      // Update payout status to REJECTED
      await prisma.payout.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          rejectionReason,
        },
      })

      // Return amount to available balance (if it was held)
      // In this case, we don't need to do anything as the balance wasn't deducted yet
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing payout:', error)
    return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 })
  }
}
