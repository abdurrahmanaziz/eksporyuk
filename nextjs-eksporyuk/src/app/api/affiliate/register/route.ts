import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/starsender'
import { pusherService } from '@/lib/pusher'

/**
 * POST /api/affiliate/register
 * Register new user as affiliate (public registration)
 * If affiliateAutoApprove is ON, auto approve immediately
 * If affiliateAutoApprove is OFF, create with PENDING status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      whatsapp,
      bankName,
      bankAccountName,
      bankAccountNumber,
      motivation,
    } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      )
    }

    if (!whatsapp || !bankName || !bankAccountName || !bankAccountNumber) {
      return NextResponse.json(
        { error: 'Data bank dan WhatsApp wajib diisi' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan login atau gunakan email lain.' },
        { status: 400 }
      )
    }

    // Check auto approve setting
    // @ts-ignore - Prisma types cache issue
    const settings = await prisma.settings.findFirst() as any
    const autoApprove = settings?.affiliateAutoApprove ?? false

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12)

    // Generate affiliate code from user name
    const baseCode = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6) || 'AFF'
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const affiliateCode = `${baseCode}${randomSuffix}`

    // Generate short link
    const shortLink = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Create user and affiliate profile in transaction
    // @ts-ignore - Prisma types cache issue
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user - AFFILIATE role if auto approved, else MEMBER_FREE
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: autoApprove ? 'AFFILIATE' : 'MEMBER_FREE',
          whatsapp,
          affiliateMenuEnabled: true, // Enable affiliate menu
          emailVerified: false,
          isActive: true,
        },
      })

      // Create affiliate profile - APPROVED if auto approve, else PENDING
      const affiliateProfile = await tx.affiliateProfile.create({
        data: {
          userId: user.id,
          affiliateCode,
          shortLink,
          whatsapp,
          bankName,
          bankAccountName,
          bankAccountNumber,
          motivation,
          applicationStatus: autoApprove ? 'APPROVED' : 'PENDING',
          isActive: autoApprove, // Active immediately if auto approve
          approvedAt: autoApprove ? new Date() : null,
          tier: 1,
          commissionRate: 10, // Default 10%
          totalClicks: 0,
          totalConversions: 0,
          totalEarnings: 0,
        },
      })

      // Create wallet for user
      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          balancePending: 0,
          totalEarnings: 0,
          totalPayout: 0,
        },
      })

      return { user, affiliateProfile }
    }) as any

    if (autoApprove) {
      // Notify user of auto approval via multi-channel
      await notificationService.send({
        userId: result.user.id,
        type: 'AFFILIATE' as any,
        title: '🎉 Selamat Datang Affiliate Eksporyuk!',
        message: `Akun Anda telah dibuat dan langsung disetujui sebagai affiliate. Kode affiliate: ${affiliateCode}. Silakan login dan mulai promosikan produk!`,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/welcome`,
        channels: ['pusher', 'onesignal', 'email', 'whatsapp'],
        metadata: { affiliateCode, tier: 1, commissionRate: 10, isNewRegistration: true }
      })

      // Additional WhatsApp for auto-approve
      if (whatsapp && starsenderService.isConfigured()) {
        await starsenderService.sendWhatsApp({
          to: whatsapp,
          message: `🎉 *Selamat Datang ${name}!*\n\nAkun affiliate Anda di EksporYuk telah aktif!\n\n📌 *Kode Affiliate:* ${affiliateCode}\n💰 *Komisi:* 10%\n⭐ *Tier:* 1\n\nSilakan login dan mulai promosikan produk! 🚀\n\nLogin: ${process.env.NEXT_PUBLIC_APP_URL}/login`
        })
      }

      // Trigger realtime
      await pusherService.notifyUser(result.user.id, 'affiliate-approved', {
        affiliateCode,
        message: 'Akun affiliate Anda telah aktif!'
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
          title: 'Pendaftaran Affiliate Baru',
          message: `${name} mendaftar sebagai affiliate baru melalui form registrasi`,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/admin/affiliates`,
          channels: ['pusher', 'onesignal', 'email'],
          metadata: {
            affiliateId: result.affiliateProfile.id,
            userId: result.user.id,
            userName: name,
            userEmail: email,
            isNewRegistration: true,
          }
        })
      }

      // Welcome notification to user
      await notificationService.send({
        userId: result.user.id,
        type: 'SYSTEM' as any,
        title: 'Selamat Datang di Eksporyuk!',
        message: 'Akun Anda telah berhasil dibuat. Aplikasi affiliate Anda sedang direview oleh admin.',
        link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        channels: ['pusher', 'email'],
      })

      // WhatsApp confirmation to user
      if (whatsapp && starsenderService.isConfigured()) {
        await starsenderService.sendWhatsApp({
          to: whatsapp,
          message: `Halo ${name}! 👋\n\nAkun Anda berhasil dibuat di EksporYuk.\n\nAplikasi affiliate Anda sedang dalam proses review. Kami akan segera menghubungi Anda!\n\nTerima kasih! 🙏`
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: autoApprove 
        ? 'Pendaftaran berhasil! Anda langsung menjadi affiliate.' 
        : 'Pendaftaran berhasil! Aplikasi affiliate Anda sedang direview.',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      affiliate: {
        id: result.affiliateProfile.id,
        affiliateCode: result.affiliateProfile.affiliateCode,
        applicationStatus: result.affiliateProfile.applicationStatus,
      },
      autoApproved: autoApprove,
    })
  } catch (error) {
    console.error('Error registering affiliate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
