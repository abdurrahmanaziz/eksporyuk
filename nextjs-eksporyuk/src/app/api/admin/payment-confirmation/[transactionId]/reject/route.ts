import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/payment-confirmation/[transactionId]/reject
 * Reject payment confirmation
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
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Alasan penolakan harus diisi' },
        { status: 400 }
      )
    }

    console.log('[Payment Reject] Processing rejection for:', transactionId)

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        status: true,
        userId: true,
        customerName: true,
        customerEmail: true,
        invoiceNumber: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'PENDING_CONFIRMATION') {
      return NextResponse.json(
        { error: 'Transaksi tidak dapat ditolak' },
        { status: 400 }
      )
    }

    // Update transaction status to REJECTED
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'REJECTED', // This will be seen by /admin/sales as well  
        rejectedAt: new Date(),
        rejectedBy: session.user.id,
        adminNotes: reason,
        // Also update fields used by /admin/sales
        updatedAt: new Date()
      }
    })

    console.log('[Payment Reject] Transaction status updated to REJECTED')

    // Create notification for customer
    try {
      if (transaction.userId) {
        await prisma.notification.create({
          data: {
            userId: transaction.userId,
            type: 'PAYMENT',
            title: 'Pembayaran Ditolak',
            message: `Pembayaran untuk invoice ${transaction.invoiceNumber || transactionId} ditolak. Alasan: ${reason}`,
            link: '/dashboard/transactions',
            redirectUrl: `/dashboard/transactions/${transactionId}`,
            sourceType: 'transaction',
            sourceId: transactionId,
            isRead: false,
            isSent: true,
            sentAt: new Date()
          }
        })
        console.log('[Payment Reject] Customer notification created')
      }
    } catch (notifError) {
      console.error('[Payment Reject] Failed to create notification:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil ditolak'
    })

  } catch (error: any) {
    console.error('[Payment Reject] Error:', error)
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan server',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}