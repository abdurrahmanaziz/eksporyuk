import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/starsender'
import { pusherService } from '@/lib/pusher'

/**
 * POST /api/admin/affiliates/[id]/approve
 * 
 * Approve pending affiliate application
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

    // 2. Get affiliate
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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

    // 3. Check if already approved
    if (affiliate.approvedAt) {
      return NextResponse.json(
        { success: false, error: 'Affiliate already approved' },
        { status: 400 }
      )
    }

    // 4. Update affiliate status
    const updatedAffiliate = await prisma.affiliateProfile.update({
      where: { id: params.id },
      data: {
        isActive: true,
        applicationStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    })

    // 5. Update user role to AFFILIATE if not already
    if (affiliate.user.role !== 'AFFILIATE' && affiliate.user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: affiliate.userId },
        data: {
          role: 'AFFILIATE',
        },
      })
    }

    // 6. Create wallet if doesn't exist
    await prisma.wallet.upsert({
      where: { userId: affiliate.userId },
      update: {},
      create: {
        userId: affiliate.userId,
        balance: 0,
        balancePending: 0,
        totalEarnings: 0,
        totalPayout: 0,
      },
    })

    // 7. Send multi-channel notification (Email, WA, Push, Realtime)
    try {
      // Use notificationService for multi-channel delivery
      await notificationService.send({
        userId: affiliate.userId,
        type: 'AFFILIATE_APPROVED' as any,
        title: '🎉 Aplikasi Affiliate Disetujui!',
        message: `Selamat ${affiliate.user.name}! Aplikasi affiliate Anda telah disetujui. Kode affiliate: ${affiliate.affiliateCode}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/welcome`,
        channels: ['pusher', 'onesignal', 'email', 'whatsapp'],
        metadata: {
          affiliateCode: affiliate.affiliateCode,
          tier: affiliate.tier,
          commissionRate: affiliate.commissionRate,
        }
      })

      // Also send WhatsApp if configured and user has WA number
      const userWhatsapp = affiliate.whatsapp || affiliate.user?.whatsapp
      if (userWhatsapp && starsenderService.isConfigured()) {
        await starsenderService.sendWhatsApp({
          to: userWhatsapp,
          message: `🎉 *Selamat ${affiliate.user.name}!*\n\nAplikasi affiliate Anda di EksporYuk telah *DISETUJUI*!\n\n📌 *Kode Affiliate:* ${affiliate.affiliateCode}\n💰 *Komisi:* ${affiliate.commissionRate}%\n⭐ *Tier:* ${affiliate.tier}\n\nSilakan login ke dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/affiliate/dashboard\n\nSelamat bergabung! 🚀`
        })
      }

      // Trigger realtime notification
      await pusherService.notifyUser(affiliate.userId, 'affiliate-approved', {
        affiliateCode: affiliate.affiliateCode,
        message: 'Aplikasi affiliate Anda telah disetujui!'
      })

    } catch (notifError) {
      console.error('Error sending approval notifications:', notifError)
      // Don't fail the request if notification fails
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      message: 'Affiliate approved successfully',
      affiliate: updatedAffiliate,
    })

  } catch (error) {
    console.error('Error approving affiliate:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
