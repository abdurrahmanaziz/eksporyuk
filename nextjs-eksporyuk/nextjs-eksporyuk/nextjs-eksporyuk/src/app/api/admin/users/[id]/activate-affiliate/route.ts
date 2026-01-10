import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/users/[id]/activate-affiliate
 * Admin activates a user as affiliate (creates profile + enables menu)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { id: userId } = await params

    // Get user data (manual lookup for production)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Manual lookup for affiliate profile
    const existingAffiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: userId }
    })

    // Check if already has affiliate profile
    if (existingAffiliateProfile) {
      // Just activate the existing profile
      await prisma.affiliateProfile.update({
        where: { id: existingAffiliateProfile.id },
        data: {
          isActive: true,
          applicationStatus: 'APPROVED',
          approvedAt: new Date(),
        },
      })

      // Enable affiliate menu
      await prisma.user.update({
        where: { id: userId },
        data: { affiliateMenuEnabled: true },
      })

      return NextResponse.json({
        success: true,
        message: 'Profil affiliate sudah ada dan diaktifkan',
        affiliateProfile: existingAffiliateProfile,
      })
    }

    // Generate affiliate code from user name
    const baseCode = user.name
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6) || 'AFF'
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const affiliateCode = `${baseCode}${randomSuffix}`

    // Generate short link
    const shortLink = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Create affiliate profile with APPROVED status
    const affiliateProfile = await prisma.affiliateProfile.create({
      data: {
        id: createId(),
        userId: userId,
        affiliateCode,
        shortLink,
        whatsapp: user.whatsapp || '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
        motivation: 'Diaktifkan oleh Admin',
        applicationStatus: 'APPROVED',
        isActive: true,
        approvedAt: new Date(),
        tier: 1,
        commissionRate: 10, // Default 10%
        totalClicks: 0,
        totalConversions: 0,
        totalEarnings: 0,
        updatedAt: new Date()
      },
    })

    // Update user - enable affiliate menu
    await prisma.user.update({
      where: { id: userId },
      data: { 
        affiliateMenuEnabled: true,
      },
    })

    // Create wallet if not exists
    await prisma.wallet.upsert({
      where: { userId: userId },
      update: {},
      create: {
        id: createId(),
        userId: userId,
        balance: 0,
        balancePending: 0,
        totalEarnings: 0,
        totalPayout: 0,
        updatedAt: new Date()
      },
    })

    // Add AFFILIATE role to userRoles if not already present
    const existingRole = await prisma.userRole.findFirst({
      where: { userId, role: 'AFFILIATE' },
    })

    if (!existingRole) {
      await prisma.userRole.create({
        data: {
          id: createId(),
          userId,
          role: 'AFFILIATE',
        },
      })
    }

    // Send notification to user
    try {
      await notificationService.send({
        userId: userId,
        type: 'AFFILIATE' as any,
        title: '🎉 Selamat! Anda Sudah Menjadi Affiliate',
        message: `Admin telah mengaktifkan akun affiliate Anda. Kode referral: ${affiliateCode}`,
      })
    } catch (notifError) {
      console.error('Failed to send notification:', notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil diaktifkan sebagai affiliate',
      affiliateProfile: {
        id: affiliateProfile.id,
        affiliateCode,
        shortLink,
        isActive: true,
        applicationStatus: 'APPROVED',
      },
    })

  } catch (error) {
    console.error('Error activating affiliate:', error)
    return NextResponse.json(
      { error: 'Gagal mengaktifkan affiliate' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]/activate-affiliate
 * Admin deactivates user as affiliate
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { id: userId } = await params

    // Get user (manual lookup for production)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Manual lookup for affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: userId }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'User tidak memiliki profil affiliate' }, { status: 400 })
    }

    // Deactivate affiliate profile
    await prisma.affiliateProfile.update({
      where: { id: affiliateProfile.id },
      data: {
        isActive: false,
      },
    })

    // Disable affiliate menu
    await prisma.user.update({
      where: { id: userId },
      data: { affiliateMenuEnabled: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Affiliate berhasil dinonaktifkan',
    })

  } catch (error) {
    console.error('Error deactivating affiliate:', error)
    return NextResponse.json(
      { error: 'Gagal menonaktifkan affiliate' },
      { status: 500 }
    )
  }
}
