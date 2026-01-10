import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'


export const dynamic = 'force-dynamic';
/**
 * DEV ONLY: Simulate payment webhook callback
 * This endpoint simulates what Xendit webhook would do after payment
 */
export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { invoiceId, externalId, amount, status } = await request.json()

    console.log('[Dev Simulate Payment] Received:', { invoiceId, externalId, amount, status })

    if (!externalId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find transaction by external ID
    const transaction = await prisma.transaction.findFirst({
      where: { externalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!transaction) {
      console.error('[Dev Simulate Payment] Transaction not found:', externalId)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    console.log('[Dev Simulate Payment] Found transaction:', transaction.id)

    // Check if already processed
    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Already processed',
        transactionId: transaction.id,
      })
    }

    // Get metadata
    const metadata = transaction.metadata as any
    const isCreditTopup = metadata?.type === 'CREDIT_TOPUP'

    if (status === 'PAID') {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
          reference: invoiceId,
        },
      })

      console.log('[Dev Simulate Payment] Transaction marked as SUCCESS')

      // Process credit top-up if applicable
      if (isCreditTopup && metadata.affiliateId && metadata.credits) {
        const credits = parseInt(metadata.credits)
        const affiliateId = metadata.affiliateId

        console.log('[Dev Simulate Payment] Processing credit top-up:', { affiliateId, credits })

        // Update or create affiliate credit
        await prisma.affiliateCredit.upsert({
          where: { affiliateId },
          create: {
            affiliateId,
            balance: credits,
            totalTopUp: credits,
            totalUsed: 0,
          },
          update: {
            balance: { increment: credits },
            totalTopUp: { increment: credits },
          },
        })

        // Create credit transaction record
        const affiliateCredit = await prisma.affiliateCredit.findUnique({
          where: { affiliateId },
        })

        await prisma.affiliateCreditTransaction.create({
          data: {
            creditId: affiliateCredit!.id,
            affiliateId: affiliateId,
            type: 'TOPUP',
            amount: credits,
            balanceBefore: (affiliateCredit?.balance || 0) - credits,
            balanceAfter: affiliateCredit?.balance || credits,
            description: `Top up ${credits} kredit - ${metadata.packageName || 'Paket Kredit'}`,
            referenceType: 'PAYMENT',
            referenceId: transaction.id,
            status: 'COMPLETED',
          },
        })

        console.log('[Dev Simulate Payment] Credits added:', credits)

        // Send notification to user
        try {
          await notificationService.send({
            userId: transaction.userId,
            type: 'TRANSACTION_SUCCESS',
            title: '✅ Top Up Kredit Berhasil',
            message: `${credits} kredit berhasil ditambahkan ke akun Anda`,
            transactionId: transaction.id,
            redirectUrl: '/affiliate/credits',
            channels: ['pusher', 'onesignal'],
          })
        } catch (notifError) {
          console.error('[Dev Simulate Payment] Notification error:', notifError)
        }

        // Send notification to admins
        try {
          const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true }
          })

          for (const admin of admins) {
            await notificationService.send({
              userId: admin.id,
              type: 'TRANSACTION_SUCCESS',
              title: '💰 Penjualan Kredit Baru',
              message: `${transaction.user.name} membeli ${credits} kredit senilai Rp ${amount.toLocaleString('id-ID')}`,
              transactionId: transaction.id,
              redirectUrl: '/admin/affiliates/credits',
              channels: ['pusher', 'onesignal'],
            })
          }
        } catch (adminNotifError) {
          console.error('[Dev Simulate Payment] Admin notification error:', adminNotifError)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        transactionId: transaction.id,
        creditsAdded: isCreditTopup ? metadata.credits : 0,
      })
    } else {
      // Payment failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...metadata,
            failedAt: new Date().toISOString(),
            failureReason: 'Payment cancelled or failed',
          },
        },
      })

      console.log('[Dev Simulate Payment] Transaction marked as FAILED')

      return NextResponse.json({
        success: true,
        message: 'Payment marked as failed',
        transactionId: transaction.id,
      })
    }
  } catch (error: any) {
    console.error('[Dev Simulate Payment] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 })
  }
}
