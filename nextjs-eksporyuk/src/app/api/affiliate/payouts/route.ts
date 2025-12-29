import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { starsenderService } from '@/lib/starsender'
import bcrypt from 'bcryptjs'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// Minimum payout amount (will be overridden by settings)
const MIN_PAYOUT = 50000

/**
 * GET /api/affiliate/payouts
 * Get affiliate's payout history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({
        balance: {
          available: 0,
          pending: 0,
          totalEarnings: 0,
          minPayout: MIN_PAYOUT,
        },
        payouts: [],
        bankAccount: null,
      })
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    // Get all conversions for balance calculation
    const allConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliateProfile.id,
      },
      select: {
        commissionAmount: true,
        paidOut: true,
      },
    })

    const totalEarnings = allConversions.reduce(
      (sum, c) => sum + Number(c.commissionAmount),
      0
    )

    const paidOutTotal = allConversions
      .filter(c => c.paidOut)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    const available = totalEarnings - paidOutTotal

    // Get pending payouts
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        walletId: wallet?.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: {
        amount: true,
      },
    })

    const pending = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'

    // Build where clause for payouts
    const whereClause: any = {
      walletId: wallet?.id,
    }

    if (status !== 'all') {
      whereClause.status = status.toUpperCase()
    }

    // Get payouts history
    const payouts = await prisma.payout.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    // Get bank account info from latest payout
    const latestPayout = await prisma.payout.findFirst({
      where: {
        walletId: wallet?.id,
        bankName: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const bankAccount = latestPayout ? {
      bankName: latestPayout.bankName || '',
      accountName: latestPayout.accountName || '',
      accountNumber: latestPayout.accountNumber || '',
    } : null

    return NextResponse.json({
      balance: {
        available: available - pending,
        pending,
        totalEarnings,
        minPayout: MIN_PAYOUT,
      },
      payouts,
      bankAccount,
    })
  } catch (error) {
    console.error('[GET PAYOUTS ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}


/**
 * POST /api/affiliate/payouts
 * Request a payout
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, notes, pin } = body

    // Get withdrawal settings
    const settings = await prisma.settings.findFirst()
    const minPayout = Number(settings?.withdrawalMinAmount || MIN_PAYOUT)
    const adminFee = Number(settings?.withdrawalAdminFee || 5000)
    const pinRequired = settings?.withdrawalPinRequired ?? true

    // Validate amount
    if (!amount || amount < minPayout) {
      return NextResponse.json(
        { error: `Minimal penarikan adalah Rp ${minPayout.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Validate PIN if required
    if (pinRequired) {
      if (!pin) {
        return NextResponse.json(
          { error: 'PIN penarikan diperlukan' },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { withdrawalPin: true },
      })

      if (!user?.withdrawalPin) {
        return NextResponse.json(
          { error: 'PIN belum diatur. Silakan atur PIN di halaman profil.' },
          { status: 400 }
        )
      }

      const isValidPin = await bcrypt.compare(pin, user.withdrawalPin)
      if (!isValidPin) {
        return NextResponse.json(
          { error: 'PIN tidak sesuai' },
          { status: 400 }
        )
      }
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          balance: 0,
        },
      })
    }

    // Calculate available balance
    const allConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateProfileId: affiliateProfile.id,
      },
      select: {
        commissionAmount: true,
        paidOut: true,
      },
    })

    const totalEarnings = allConversions.reduce(
      (sum, c) => sum + Number(c.commissionAmount),
      0
    )

    const paidOutTotal = allConversions
      .filter(c => c.paidOut)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    // Get pending payouts
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        walletId: wallet.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: {
        amount: true,
      },
    })

    const pending = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0)
    const available = totalEarnings - paidOutTotal - pending

    if (amount > available) {
      return NextResponse.json(
        { error: 'Saldo tidak mencukupi' },
        { status: 400 }
      )
    }

    // Calculate net amount after admin fee
    const netAmount = amount - adminFee

    if (netAmount <= 0) {
      return NextResponse.json(
        { error: `Jumlah penarikan harus lebih dari biaya admin (Rp ${adminFee.toLocaleString()})` },
        { status: 400 }
      )
    }

    // Get bank account from latest payout or use default
    const latestPayout = await prisma.payout.findFirst({
      where: {
        walletId: wallet.id,
        bankName: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        walletId: wallet.id,
        amount,
        status: 'PENDING',
        bankName: latestPayout?.bankName || null,
        accountName: latestPayout?.accountName || null,
        accountNumber: latestPayout?.accountNumber || null,
        notes,
        metadata: {
          adminFee,
          netAmount,
          requestedAmount: amount,
        },
      },
    })

    // Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type: 'PAYOUT_REQUEST',
        description: `Request penarikan dana sebesar Rp ${amount.toLocaleString()} (Biaya admin: Rp ${adminFee.toLocaleString()}, Nett: Rp ${netAmount.toLocaleString()})`,
        reference: payout.id,
        metadata: {
          adminFee,
          netAmount,
        },
      },
    })

    // Send notification to user
    await notificationService.send({
      userId: session.user.id,
      type: 'AFFILIATE' as any,
      title: 'Permintaan Penarikan Dikirim',
      message: `Permintaan penarikan sebesar Rp ${amount.toLocaleString()} sedang diproses. Mohon tunggu konfirmasi dari admin.`,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/payouts`,
      channels: ['pusher', 'email'],
    })

    // Notify admins about new payout request
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, whatsapp: true },
    })

    for (const admin of admins) {
      await notificationService.send({
        userId: admin.id,
        type: 'AFFILIATE' as any,
        title: 'Permintaan Penarikan Baru',
        message: `${user?.name} mengajukan penarikan sebesar Rp ${amount.toLocaleString()}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/admin/payouts`,
        channels: ['pusher', 'onesignal', 'email'],
        metadata: {
          payoutId: payout.id,
          amount,
          userName: user?.name,
          userEmail: user?.email,
        }
      })
    }

    // Send WhatsApp confirmation to user
    if (user?.whatsapp && starsenderService.isConfigured()) {
      await starsenderService.sendWhatsApp({
        to: user.whatsapp,
        message: `Halo ${user.name}! 📱\n\nPermintaan penarikan sebesar *Rp ${amount.toLocaleString()}* telah kami terima.\n\nStatus: ⏳ Menunggu Review\n\nKami akan segera memproses permintaan Anda.\n\nTerima kasih! 🙏`
      })
    }

    return NextResponse.json({
      success: true,
      payout,
    })
  } catch (error) {
    console.error('[CREATE PAYOUT ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to create payout request' },
      { status: 500 }
    )
  }
}

