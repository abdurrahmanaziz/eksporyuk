import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { updateWallet } from '@/lib/commission-helper'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/starsender'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/admin/payouts/[id]/reject - Reject payout and refund to wallet
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
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

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

    // Refund amount back to user wallet
    await updateWallet(
      payout.userId,
      Number(payout.amount),
      'REFUND',
      `Payout rejected - Refund: ${reason}`,
      null
    )

    // Update payout status to REJECTED
    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
        notes: `Rejected by admin (${session.user.email}): ${reason}`,
      }
    })

    // TODO: Send notification to user (email/WhatsApp)
    console.log(`❌ Payout rejected: ${payout.id} for user ${payout.user.email}`)
    console.log(`   Amount ${payout.amount} refunded to wallet`)

    // Send notification to user - MULTI CHANNEL
    const amount = Number(payout.amount)
    await notificationService.send({
      userId: payout.userId,
      type: 'AFFILIATE' as any,
      title: 'Penarikan Ditolak',
      message: `Permintaan penarikan sebesar Rp ${amount.toLocaleString()} tidak dapat diproses. Alasan: ${reason}. Saldo telah dikembalikan ke wallet Anda.`,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/payouts`,
      channels: ['pusher', 'onesignal', 'email', 'whatsapp'],
      metadata: {
        payoutId: payout.id,
        amount,
        reason,
        refunded: true,
      }
    })

    // Send WhatsApp notification to user
    const userWhatsapp = (payout.user as any).whatsapp || (payout.user as any).phone
    if (userWhatsapp && starsenderService.isConfigured()) {
      await starsenderService.sendWhatsApp({
        to: userWhatsapp,
        message: `Halo ${payout.user.name},\n\nMohon maaf, permintaan penarikan Anda tidak dapat diproses.\n\n💰 *Jumlah:* Rp ${amount.toLocaleString()}\n📝 *Alasan:* ${reason}\n✅ *Saldo:* Dikembalikan ke wallet\n\nSilakan cek kembali data rekening Anda dan ajukan ulang.\n\nTerima kasih! 🙏`
      })
    }

    return NextResponse.json({
      message: 'Payout rejected and amount refunded to user wallet',
      payout: updatedPayout
    })
  } catch (error) {
    console.error('Error rejecting payout:', error)
    return NextResponse.json(
      { error: 'Failed to reject payout' },
      { status: 500 }
    )
  }
}
