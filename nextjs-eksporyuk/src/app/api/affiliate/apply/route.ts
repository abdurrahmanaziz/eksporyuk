import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/starsender'
import { pusherService } from '@/lib/pusher'

/**
 * POST /api/affiliate/apply
 * Submit application to become an affiliate
 * If affiliateAutoApprove is ON, auto approve immediately
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has an affiliate profile
    const existingProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Anda sudah memiliki profil affiliate' },
        { status: 400 }
      )
    }

    // Check if user has affiliate menu enabled
    // @ts-ignore - Prisma types cache issue
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        // @ts-ignore
        affiliateMenuEnabled: true,
        role: true,
      },
    }) as any

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { whatsapp, bankName, bankAccountName, bankAccountNumber, motivation, fromPublic } = body

    // Only check affiliateMenuEnabled if not from public registration
    // Kondisi 3: User yang sudah ada bisa daftar via link publik
    if (!fromPublic && !user.affiliateMenuEnabled && user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { error: 'Fitur affiliate belum diaktifkan untuk akun Anda' },
        { status: 403 }
      )
    }

    // Validation
    if (!whatsapp || !bankName || !bankAccountName || !bankAccountNumber) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    // Check auto approve setting
    // @ts-ignore - Prisma types cache issue
    const settings = await prisma.settings.findFirst() as any
    const autoApprove = settings?.affiliateAutoApprove ?? false

    // Generate affiliate code from user name
    const baseCode = user.name
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6) || 'AFF'
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const affiliateCode = `${baseCode}${randomSuffix}`

    // Generate short link
    const shortLink = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Create affiliate profile - APPROVED if autoApprove is ON, else PENDING
    // @ts-ignore - Prisma types cache issue
    const affiliateProfile = await prisma.affiliateProfile.create({
      data: {
        userId: session.user.id,
        affiliateCode,
        shortLink,
        // @ts-ignore
        whatsapp,
        // @ts-ignore
        bankName,
        // @ts-ignore
        bankAccountName,
        // @ts-ignore
        bankAccountNumber,
        // @ts-ignore
        motivation,
        // @ts-ignore
        applicationStatus: autoApprove ? 'APPROVED' : 'PENDING',
        isActive: autoApprove, // Active immediately if auto approve
        approvedAt: autoApprove ? new Date() : null,
        tier: 1,
        commissionRate: 10, // Default 10%
        totalClicks: 0,
        totalConversions: 0,
        totalEarnings: 0,
      },
    }) as any

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        // @ts-ignore
        whatsapp,
        // Upgrade role to AFFILIATE if auto approved
        ...(autoApprove && user.role !== 'ADMIN' && { role: 'AFFILIATE' }),
      },
    })

    // Create wallet if auto approved
    if (autoApprove) {
      await prisma.wallet.upsert({
        where: { userId: session.user.id },
        update: {},
        create: {
          userId: session.user.id,
          balance: 0,
          balancePending: 0,
          totalEarnings: 0,
          totalPayout: 0,
        },
      })
    }

    if (autoApprove) {
      // Notify user of auto approval via multi-channel
      await notificationService.send({
        userId: session.user.id,
        type: 'AFFILIATE' as any,
        title: '🎉 Selamat! Anda Sudah Menjadi Affiliate',
        message: `Aplikasi Anda langsung disetujui. Kode affiliate: ${affiliateCode}. Silakan mulai promosikan produk!`,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/welcome`,
        channels: ['pusher', 'onesignal', 'email', 'whatsapp'],
        metadata: { affiliateCode, tier: 1, commissionRate: 10 }
      })

      // Additional WhatsApp for auto-approve
      if (whatsapp && starsenderService.isConfigured()) {
        await starsenderService.sendWhatsApp({
          to: whatsapp,
          message: `🎉 *Selamat ${user.name}!*\n\nAnda sekarang resmi menjadi Affiliate EksporYuk!\n\n📌 *Kode Affiliate:* ${affiliateCode}\n💰 *Komisi:* 10%\n⭐ *Tier:* 1\n\nMulai promosikan produk dan dapatkan komisi! 🚀\n\nLogin: ${process.env.NEXT_PUBLIC_APP_URL}/affiliate/dashboard`
        })
      }

      // Trigger realtime
      await pusherService.notifyUser(session.user.id, 'affiliate-approved', {
        affiliateCode,
        message: 'Aplikasi affiliate Anda telah disetujui!'
      })
    } else {
      // Notify admins via multi-channel
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true },
      })

      for (const admin of admins) {
        await notificationService.send({
          userId: admin.id,
          type: 'AFFILIATE' as any,
          title: 'Aplikasi Affiliate Baru',
          message: `${user.name} mengajukan aplikasi untuk menjadi affiliate`,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/admin/affiliates`,
          channels: ['pusher', 'onesignal', 'email'],
          metadata: {
            affiliateId: affiliateProfile.id,
            userName: user.name,
            userEmail: user.email,
          }
        })
      }

      // Notify user of pending status
      await notificationService.send({
        userId: session.user.id,
        type: 'AFFILIATE' as any,
        title: 'Aplikasi Affiliate Terkirim',
        message: 'Aplikasi Anda sedang direview oleh admin. Anda akan menerima notifikasi setelah diproses.',
        link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/affiliate-status`,
        channels: ['pusher', 'email'],
      })

      // WhatsApp confirmation to user
      if (whatsapp && starsenderService.isConfigured()) {
        await starsenderService.sendWhatsApp({
          to: whatsapp,
          message: `Halo ${user.name}! 👋\n\nAplikasi affiliate Anda telah kami terima dan sedang dalam proses review.\n\nKami akan segera menghubungi Anda setelah review selesai.\n\nTerima kasih! 🙏`
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: autoApprove 
        ? 'Selamat! Anda sudah menjadi affiliate' 
        : 'Aplikasi affiliate berhasil diajukan',
      affiliate: {
        id: affiliateProfile.id,
        affiliateCode: affiliateProfile.affiliateCode,
        applicationStatus: affiliateProfile.applicationStatus,
      },
      autoApproved: autoApprove,
    })
  } catch (error) {
    console.error('Error applying for affiliate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
