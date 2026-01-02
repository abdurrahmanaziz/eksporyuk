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
    console.log('[Payment Confirm GET] Transaction ID:', transactionId)

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
        productId: true,
        membershipId: true,
        courseId: true
      }
    })

    console.log('[Payment Confirm GET] Transaction found:', !!transaction)
    if (transaction) {
      console.log('[Payment Confirm GET] Transaction type:', transaction.type)
      console.log('[Payment Confirm GET] Transaction status:', transaction.status)
    }

    if (!transaction) {
      console.log('[Payment Confirm GET] Transaction not found with ID:', transactionId)
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Manual enrichment - fetch related data
    let product = null, membership = null, course = null

    if (transaction.productId) {
      product = await prisma.product.findUnique({
        where: { id: transaction.productId },
        select: { id: true, name: true }
      })
    }

    if (transaction.membershipId) {
      membership = await prisma.membership.findUnique({
        where: { id: transaction.membershipId },
        select: { id: true, name: true }
      })
    }

    if (transaction.courseId) {
      course = await prisma.course.findUnique({
        where: { id: transaction.courseId },
        select: { id: true, title: true }
      })
    }

    // Determine item name
    let itemName = 'Produk'
    if (product) {
      itemName = product.name
    } else if (membership) {
      itemName = membership.name
    } else if (course) {
      itemName = course.title
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
  } catch (error: any) {
    console.error('[Payment Confirm GET] Error:', error)
    console.error('[Payment Confirm GET] Error message:', error.message)
    console.error('[Payment Confirm GET] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan server',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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
    const { 
      paymentProofUrl, 
      senderName, 
      senderBank, 
      transferAmount,
      notes 
    } = body

    if (!paymentProofUrl) {
      return NextResponse.json(
        { error: 'URL bukti pembayaran diperlukan' },
        { status: 400 }
      )
    }

    if (!senderName || !senderBank) {
      return NextResponse.json(
        { error: 'Nama pengirim dan bank pengirim harus diisi' },
        { status: 400 }
      )
    }

    console.log('[Payment Confirm POST] Updating transaction with:', {
      transactionId,
      paymentProofUrl,
      senderName,
      senderBank,
      transferAmount
    })

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

    // Prepare metadata for additional transfer information
    const transferMetadata = {
      senderName,
      senderBank,
      transferAmount: transferAmount || transaction.amount,
      submittedAt: new Date().toISOString()
    }

    if (notes) {
      transferMetadata.notes = notes
    }

    // Update transaction with proof and additional data
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProofUrl,
        paymentProofSubmittedAt: new Date(),
        status: 'PENDING_CONFIRMATION',
        // Store additional transfer data in metadata or notes field
        notes: JSON.stringify(transferMetadata)
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
            message: `${transaction.customerName || 'Customer'} mengirim bukti pembayaran untuk invoice ${transaction.invoiceNumber || transactionId} dari ${senderName} (${senderBank})`,
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
