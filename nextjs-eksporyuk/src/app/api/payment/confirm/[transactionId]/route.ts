import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/payment/confirm/[transactionId]
 * Get transaction details for payment confirmation page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        status: true,
        type: true,
        customerName: true,
        customerEmail: true,
        paymentMethod: true,
        paymentProofUrl: true,
        paymentProofSubmittedAt: true,
        createdAt: true,
        metadata: true,
        product: {
          select: { id: true, name: true }
        },
        membership: {
          select: { id: true, name: true }
        },
        course: {
          select: { id: true, title: true }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Determine item name
    let itemName = 'Produk'
    if (transaction.product) {
      itemName = transaction.product.name
    } else if (transaction.membership) {
      itemName = transaction.membership.name
    } else if (transaction.course) {
      itemName = transaction.course.title
    }

    // Get bank account if manual payment
    let bankAccount = null
    if (transaction.paymentMethod === 'MANUAL' || transaction.paymentMethod === 'manual') {
      const metadata = transaction.metadata as any
      if (metadata?.selectedBank) {
        const bank = await prisma.manualBankAccount.findFirst({
          where: { 
            OR: [
              { id: metadata.selectedBank },
              { bankCode: metadata.selectedBank }
            ],
            isActive: true 
          },
          select: {
            bankName: true,
            accountNumber: true,
            accountName: true
          }
        })
        bankAccount = bank
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        invoiceNumber: transaction.invoiceNumber || transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        type: transaction.type,
        itemName,
        customerName: transaction.customerName,
        customerEmail: transaction.customerEmail,
        paymentMethod: transaction.paymentMethod,
        paymentProofUrl: transaction.paymentProofUrl,
        paymentProofSubmittedAt: transaction.paymentProofSubmittedAt,
        createdAt: transaction.createdAt,
        bankAccount
      }
    })
  } catch (error) {
    console.error('[Payment Confirm API] Error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payment/confirm/[transactionId]
 * Submit payment proof for confirmation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params
    const body = await request.json()
    const { paymentProofUrl } = body

    if (!paymentProofUrl) {
      return NextResponse.json(
        { error: 'URL bukti pembayaran diperlukan' },
        { status: 400 }
      )
    }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { 
        id: true, 
        status: true,
        invoiceNumber: true,
        amount: true,
        customerName: true,
        customerEmail: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Only allow for PENDING or PENDING_CONFIRMATION status
    if (!['PENDING', 'PENDING_CONFIRMATION'].includes(transaction.status)) {
      return NextResponse.json(
        { error: 'Transaksi tidak dapat dikonfirmasi' },
        { status: 400 }
      )
    }

    // Update transaction with proof
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProofUrl,
        paymentProofSubmittedAt: new Date(),
        status: 'PENDING_CONFIRMATION'
      }
    })

    // Create notification for admin
    try {
      // Find admin users
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      })

      // Create notification for each admin
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'TRANSACTION',
            title: 'Bukti Pembayaran Baru',
            message: `${transaction.customerName || 'Customer'} mengirim bukti pembayaran untuk invoice ${transaction.invoiceNumber || transactionId}`,
            link: '/admin/payment-confirmation',
            redirectUrl: '/admin/payment-confirmation',
            sourceType: 'transaction',
            sourceId: transactionId,
            isRead: false,
            isSent: true,
            sentAt: new Date()
          }
        })
      }
    } catch (notifError) {
      console.error('[Payment Confirm] Failed to create admin notification:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Bukti pembayaran berhasil dikirim'
    })
  } catch (error) {
    console.error('[Payment Confirm API] Error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
