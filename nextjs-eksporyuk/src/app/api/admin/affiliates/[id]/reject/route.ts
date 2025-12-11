import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/starsender'
import { pusherService } from '@/lib/pusher'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/affiliates/[id]/reject
 * 
 * Reject pending affiliate application
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check admin authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get rejection reason from request body
    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // 3. Get affiliate
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { id: params.id },
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

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Affiliate not found' },
        { status: 404 }
      )
    }

    // 4. Check if already approved (can't reject approved affiliate)
    if (affiliate.approvedAt) {
      return NextResponse.json(
        { success: false, error: 'Cannot reject already approved affiliate. Use toggle status instead.' },
        { status: 400 }
      )
    }

    // 5. Update affiliate status and save rejection reason
    const updatedAffiliate = await prisma.affiliateProfile.update({
      where: { id: params.id },
      data: {
        isActive: false,
        applicationStatus: 'REJECTED',
        applicationNotes: reason,
      },
    })

    // 6. Create a log entry for rejection
    // Note: If you have an AffiliateLog or AdminLog model, use it here
    // For now, we'll just log to console and send email
    console.log('Affiliate Rejected:', {
      affiliateId: params.id,
      userId: affiliate.userId,
      rejectedBy: session.user.id,
      rejectedAt: new Date(),
      reason: reason.trim(),
    })

    // 7. Send multi-channel notification (Email, WA, Push, Realtime)
    try {
      // Use notificationService for multi-channel delivery
      await notificationService.send({
        userId: affiliate.userId,
        type: 'AFFILIATE_REJECTED' as any,
        title: 'Aplikasi Affiliate Ditolak',
        message: `Maaf, aplikasi affiliate Anda tidak dapat disetujui. Alasan: ${reason.trim()}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/affiliate-status`,
        channels: ['pusher', 'onesignal', 'email', 'whatsapp'],
        metadata: {
          rejectionReason: reason.trim(),
        }
      })

      // Also send WhatsApp if configured and user has WA number
      const userWhatsapp = (affiliate as any).whatsapp || (affiliate.user as any)?.whatsapp
      if (userWhatsapp && starsenderService.isConfigured()) {
        await starsenderService.sendWhatsApp({
          to: userWhatsapp,
          message: `Halo ${affiliate.user.name},\n\nMohon maaf, aplikasi affiliate Anda di EksporYuk *belum dapat disetujui*.\n\n📌 *Alasan:* ${reason.trim()}\n\nJika ada pertanyaan, silakan hubungi support kami.\n\nTerima kasih atas minat Anda bergabung! 🙏`
        })
      }

      // Trigger realtime notification
      await pusherService.notifyUser(affiliate.userId, 'affiliate-rejected', {
        reason: reason.trim(),
        message: 'Aplikasi affiliate Anda ditolak'
      })

    } catch (notifError) {
      console.error('Error sending rejection notifications:', notifError)
      // Don't fail the request if notification fails
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      message: 'Affiliate rejected successfully',
      affiliate: updatedAffiliate,
    })

  } catch (error) {
    console.error('Error rejecting affiliate:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
