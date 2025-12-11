import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { 
  createBankDisbursement, 
  createEWalletDisbursement,
  getBankCode,
  getEWalletChannelCode 
} from '@/lib/xendit-disbursement'
import { notificationService } from '@/lib/services/notificationService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'
import { starsenderService } from '@/lib/starsender'

// POST /api/admin/payouts/[id]/approve - Approve payout request with auto disbursement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { autoDisbursement = false } = body // Option to enable auto transfer

    // Get payout
    const payout = await prisma.payout.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    if (payout.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Payout sudah diproses sebelumnya' },
        { status: 400 }
      )
    }

    let disbursementResult: any = null
    let disbursementError: string | null = null

    // AUTO DISBURSEMENT via Xendit
    if (autoDisbursement && process.env.XENDIT_SECRET_KEY) {
      const externalId = `PAYOUT-${payout.id}-${Date.now()}`

      if (payout.method === 'BANK_TRANSFER' && payout.bankName && payout.accountNumber && payout.accountName) {
        // Bank Transfer
        const result = await createBankDisbursement({
          externalId,
          amount: Number(payout.amount),
          bankCode: getBankCode(payout.bankName),
          accountHolderName: payout.accountName,
          accountNumber: payout.accountNumber,
          description: `Payout untuk ${payout.user.name || payout.user.email}`,
          emailTo: [payout.user.email],
        })

        if (result.success) {
          disbursementResult = result.data
        } else {
          disbursementError = result.error
        }
      } else if (['OVO', 'DANA', 'GOPAY'].includes(payout.method) && payout.accountNumber) {
        // E-Wallet Transfer
        const channelCode = getEWalletChannelCode(payout.method)
        
        if (channelCode) {
          const result = await createEWalletDisbursement({
            externalId,
            amount: Number(payout.amount),
            phoneNumber: payout.accountNumber, // Phone number for e-wallet
            channelCode,
            description: `Payout untuk ${payout.user.name || payout.user.email}`,
          })

          if (result.success) {
            disbursementResult = result.data
          } else {
            disbursementError = result.error
          }
        }
      }
    }

    // Update payout status to COMPLETED
    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        notes: autoDisbursement 
          ? `Approved with auto disbursement by ${session.user.email}${disbursementError ? ` - Disbursement Error: ${disbursementError}` : ''}`
          : `Approved by admin: ${session.user.email} (Manual transfer required)`,
      }
    })

    // Create transaction record for payout
    await prisma.transaction.create({
      data: {
        userId: payout.userId,
        type: 'WITHDRAWAL',
        amount: payout.amount,
        status: disbursementError ? 'PENDING' : 'SUCCESS',
        description: `Payout approved - ${payout.method}${payout.bankName ? ` (${payout.bankName})` : ''}`,
        metadata: {
          payoutId: payout.id,
          method: payout.method,
          bankName: payout.bankName,
          accountNumber: payout.accountNumber,
          accountName: payout.accountName,
          autoDisbursement,
          disbursementId: disbursementResult?.id,
          disbursementStatus: disbursementResult?.status,
          disbursementError,
        }
      }
    })

    // TODO: Send notification to user (email/WhatsApp)
    console.log(`✅ Payout approved: ${payout.id} for user ${payout.user.email}`)
    if (autoDisbursement && disbursementResult) {
      console.log(`   💰 Auto disbursement created: ${disbursementResult.id}`)
    }
    if (disbursementError) {
      console.log(`   ⚠️ Disbursement error: ${disbursementError}`)
    }

    // Send notification to user - MULTI CHANNEL
    const amount = Number(payout.amount)
    await notificationService.send({
      userId: payout.userId,
      type: 'AFFILIATE' as any,
      title: '💰 Penarikan Disetujui!',
      message: `Permintaan penarikan sebesar Rp ${amount.toLocaleString()} telah disetujui dan ${autoDisbursement && !disbursementError ? 'sedang diproses' : 'akan segera ditransfer'}.`,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/payouts`,
      channels: ['pusher', 'onesignal', 'email', 'whatsapp'],
      metadata: {
        payoutId: payout.id,
        amount,
        method: payout.method,
        bankName: payout.bankName,
      }
    })

    // Send WhatsApp notification to user
    const userWhatsapp = (payout.user as any).whatsapp || (payout.user as any).phone
    if (userWhatsapp && starsenderService.isConfigured()) {
      await starsenderService.sendWhatsApp({
        to: userWhatsapp,
        message: `🎉 *Penarikan Disetujui!*\n\nHalo ${payout.user.name}!\n\nPermintaan penarikan Anda telah *DISETUJUI*:\n\n💰 *Jumlah:* Rp ${amount.toLocaleString()}\n🏦 *Metode:* ${payout.method}${payout.bankName ? ` (${payout.bankName})` : ''}\n📊 *Status:* ${autoDisbursement && !disbursementError ? 'Sedang Diproses' : 'Akan Ditransfer'}\n\nDana akan segera masuk ke rekening Anda.\n\nTerima kasih! 🙏`
      })
    }

    return NextResponse.json({
      message: autoDisbursement 
        ? disbursementError 
          ? 'Payout approved but auto disbursement failed. Please transfer manually.'
          : 'Payout approved and disbursement initiated successfully'
        : 'Payout approved successfully. Please transfer manually.',
      payout: updatedPayout,
      disbursement: disbursementResult,
      disbursementError,
    })
  } catch (error) {
    console.error('Error approving payout:', error)
    return NextResponse.json(
      { error: 'Failed to approve payout' },
      { status: 500 }
    )
  }
}
