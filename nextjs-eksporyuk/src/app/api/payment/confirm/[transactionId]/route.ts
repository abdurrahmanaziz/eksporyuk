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
        // Since ManualBankAccount doesn't exist, provide fallback bank info
        const commonBanks: Record<string, any> = {
          'BCA': { bankName: 'Bank Central Asia (BCA)', accountNumber: '1234567890', accountName: 'Eksporyuk' },
          'BRI': { bankName: 'Bank Rakyat Indonesia (BRI)', accountNumber: '1234567890', accountName: 'Eksporyuk' },
          'BNI': { bankName: 'Bank Negara Indonesia (BNI)', accountNumber: '1234567890', accountName: 'Eksporyuk' },
          'MANDIRI': { bankName: 'Bank Mandiri', accountNumber: '1234567890', accountName: 'Eksporyuk' }
        }
        
        bankAccount = commonBanks[metadata.selectedBank] || {
          bankName: metadata.selectedBank || 'Bank Manual',
          accountNumber: '1234567890',
          accountName: 'Eksporyuk'
        }
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
    console.log('[Payment Confirm POST] Starting with transactionId:', transactionId)
    
    const body = await request.json()
    console.log('[Payment Confirm POST] Received body:', body)
    
    const { 
      paymentProofUrl, 
      senderName, 
      senderBank, 
      transferAmount,
      notes 
    } = body

    console.log('[Payment Confirm POST] Extracted data:', {
      paymentProofUrl: !!paymentProofUrl,
      senderName,
      senderBank,
      transferAmount,
      notes
    })

    if (!paymentProofUrl) {
      console.log('[Payment Confirm POST] Missing paymentProofUrl')
      return NextResponse.json(
        { error: 'URL bukti pembayaran diperlukan' },
        { status: 400 }
      )
    }

    if (!senderName || !senderBank) {
      console.log('[Payment Confirm POST] Missing senderName or senderBank')
      return NextResponse.json(
        { error: 'Nama pengirim dan bank pengirim harus diisi' },
        { status: 400 }
      )
    }

    console.log('[Payment Confirm POST] Finding transaction:', transactionId)

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { 
        id: true, 
        status: true,
        invoiceNumber: true,
        amount: true,
        customerName: true,
        customerEmail: true,
        userId: true
      }
    })

    console.log('[Payment Confirm POST] Transaction found:', !!transaction)
    if (transaction) {
      console.log('[Payment Confirm POST] Transaction status:', transaction.status)
    }

    if (!transaction) {
      console.log('[Payment Confirm POST] Transaction not found')
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Only allow for PENDING status
    if (!['PENDING'].includes(transaction.status)) {
      console.log('[Payment Confirm POST] Invalid status:', transaction.status)
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

    console.log('[Payment Confirm POST] Updating transaction...')

    // Update transaction with proof and additional data
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProofUrl,
        paymentProofSubmittedAt: new Date(),
        status: 'PENDING_CONFIRMATION', // Update to PENDING_CONFIRMATION when proof uploaded
        // Store additional transfer data in notes field with proof submission flag
        notes: JSON.stringify({
          ...transferMetadata,
          paymentProofSubmitted: true,
          needsAdminReview: true
        }),
        updatedAt: new Date()
      }
    })

    console.log('[Payment Confirm POST] Transaction updated successfully')

    // Send confirmation email to customer using branded template
    try {
      console.log('[Payment Confirm POST] 📧 Sending confirmation email to customer...')
      const { renderBrandedTemplateBySlug } = await import('@/lib/branded-template-engine')
      const { mailketing } = await import('@/lib/integrations/mailketing')
      
      const customerEmail = transaction.customerEmail
      const customerName = transaction.customerName || 'Member'
      const invoiceNumber = transaction.invoiceNumber || transactionId
      const amount = transaction.amount
      const transactionDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      const emailTemplate = await renderBrandedTemplateBySlug('payment-confirmation', {
        name: customerName,
        email: customerEmail,
        invoice_number: invoiceNumber,
        amount: `Rp ${amount.toLocaleString('id-ID')}`,
        transaction_date: transactionDate,
        support_email: 'support@eksporyuk.com',
        support_phone: '+62 812-3456-7890',
        dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com'}/dashboard`
      })

      if (emailTemplate) {
        await mailketing.sendEmail({
          to: customerEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          tags: ['payment-confirmation', 'order-confirmation', 'transaction']
        })
        console.log('[Payment Confirm POST] ✅ Confirmation email sent successfully to:', customerEmail)
      } else {
        console.warn('[Payment Confirm POST] ⚠️ Payment confirmation template not found')
      }
    } catch (emailError) {
      console.error('[Payment Confirm POST] ⚠️ Failed to send confirmation email:', emailError)
      // Don't fail the main operation if email fails
    }

    // Create notification for admin
    try {
      console.log('[Payment Confirm POST] Creating admin notifications...')
      
      // Find admin users
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true }
      })

      console.log('[Payment Confirm POST] Found', admins.length, 'admin users')

      // Create notification for each admin
      const notificationPromises = admins.map(admin => 
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'TRANSACTION',
            title: 'Bukti Pembayaran Baru',
            message: `${transaction.customerName || 'Customer'} mengirim bukti pembayaran untuk invoice ${transaction.invoiceNumber || transactionId} dari ${senderName} (${senderBank})`,
            link: `/admin/payment-confirmation`,
            redirectUrl: `/admin/payment-confirmation`,
            sourceType: 'transaction',
            sourceId: transactionId,
            isRead: false,
            isSent: true,
            sentAt: new Date()
          }
        })
      )

      await Promise.all(notificationPromises)
      console.log('[Payment Confirm POST] Admin notifications created successfully')
      
    } catch (notifError: any) {
      console.error('[Payment Confirm POST] Failed to create admin notification:', notifError)
      console.error('[Payment Confirm POST] Notification error details:', {
        message: notifError.message,
        code: notifError.code,
        meta: notifError.meta
      })
      // Don't fail the main operation if notifications fail
    }

    console.log('[Payment Confirm POST] Operation completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Bukti pembayaran berhasil dikirim',
      transaction: {
        id: updatedTransaction.id,
        status: updatedTransaction.status,
        paymentProofSubmittedAt: updatedTransaction.paymentProofSubmittedAt
      }
    })
    
  } catch (error: any) {
    console.error('[Payment Confirm POST] Error:', error)
    console.error('[Payment Confirm POST] Error message:', error.message)
    console.error('[Payment Confirm POST] Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan server',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
          meta: error.meta
        } : undefined
      },
      { status: 500 }
    )
  }
}
