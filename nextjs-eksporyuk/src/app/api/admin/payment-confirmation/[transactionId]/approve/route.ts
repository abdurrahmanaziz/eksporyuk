import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/payment-confirmation/[transactionId]/approve
 * Approve payment confirmation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionId } = await params
    const body = await request.json()
    const { notes } = body

    console.log('[Payment Approve] Processing approval for:', transactionId)

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        status: true,
        amount: true,
        type: true,
        userId: true,
        customerName: true,
        customerEmail: true,
        membershipId: true,
        productId: true,
        courseId: true,
        couponId: true,
        affiliateId: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Transaksi tidak dapat diapprove' },
        { status: 400 }
      )
    }

    // Update transaction status to SUCCESS (not COMPLETED)
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'SUCCESS', // This will be seen by /admin/sales as well
        paidAt: new Date(),
        notes: JSON.stringify({
          approvedBy: session.user.id,
          adminNotes: notes || 'Payment approved by admin',
          approvedAt: new Date().toISOString()
        }),
        updatedAt: new Date()
      }
    })

    console.log('[Payment Approve] Transaction status updated to COMPLETED')

    // Process membership/product activation (same logic as /admin/sales)
    if (transaction.type === 'MEMBERSHIP' && transaction.membershipId) {
      try {
        // Find or create user membership
        const existingMembership = await prisma.userMembership.findFirst({
          where: {
            userId: transaction.userId,
            membershipId: transaction.membershipId
          }
        })

        if (existingMembership) {
          // Extend existing membership
          const membership = await prisma.membership.findUnique({
            where: { id: transaction.membershipId },
            select: { duration: true }
          })

          if (membership) {
            const currentExpiry = existingMembership.expiresAt || new Date()
            const newExpiry = new Date(currentExpiry.getTime() + (membership.duration * 24 * 60 * 60 * 1000))

            await prisma.userMembership.update({
              where: { id: existingMembership.id },
              data: {
                status: 'ACTIVE',
                expiresAt: newExpiry,
                activatedAt: new Date()
              }
            })
            console.log('[Payment Approve] Extended existing membership')
          }
        } else {
          // Create new membership
          const membership = await prisma.membership.findUnique({
            where: { id: transaction.membershipId },
            select: { duration: true }
          })

          if (membership) {
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + membership.duration)

            await prisma.userMembership.create({
              data: {
                userId: transaction.userId,
                membershipId: transaction.membershipId,
                status: 'ACTIVE',
                startedAt: new Date(),
                expiresAt,
                activatedAt: new Date(),
                transactionId: transaction.id
              }
            })
            console.log('[Payment Approve] Created new membership')
          }
        }
      } catch (membershipError) {
        console.error('[Payment Approve] Failed to activate membership:', membershipError)
      }
    }

    // Process commission if there's an affiliate
    if (transaction.affiliateId) {
      try {
        // Import commission helper
        const { processTransactionCommission } = await import('@/lib/commission-helper')
        await processTransactionCommission(transaction.id)
        console.log('[Payment Approve] Commission processed successfully')
      } catch (commissionError) {
        console.error('[Payment Approve] Failed to process commission:', commissionError)
      }
    }

    // Create notification for customer
    try {
      if (transaction.userId) {
        await prisma.notification.create({
          data: {
            userId: transaction.userId,
            type: 'PAYMENT',
            title: 'Pembayaran Dikonfirmasi',
            message: 'Pembayaran Anda telah dikonfirmasi dan transaksi berhasil diproses.',
            link: '/dashboard/transactions',
            redirectUrl: `/dashboard/transactions/${transactionId}`,
            sourceType: 'transaction',
            sourceId: transactionId,
            isRead: false,
            isSent: true,
            sentAt: new Date()
          }
        })
        console.log('[Payment Approve] Customer notification created')
      }
    } catch (notifError) {
      console.error('[Payment Approve] Failed to create notification:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil dikonfirmasi'
    })

  } catch (error: any) {
    console.error('[Payment Approve] Error:', error)
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan server',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}