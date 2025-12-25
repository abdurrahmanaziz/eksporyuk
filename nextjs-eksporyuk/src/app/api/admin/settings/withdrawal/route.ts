import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/settings/withdrawal
 * Get withdrawal settings (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.settings.findFirst({
      select: {
        withdrawalMinAmount: true,
        withdrawalAdminFee: true,
        withdrawalPinRequired: true,
        withdrawalPinLength: true,
      },
    })

    return NextResponse.json({
      settings: settings || {
        withdrawalMinAmount: 50000,
        withdrawalAdminFee: 5000,
        withdrawalPinRequired: true,
        withdrawalPinLength: 6,
      },
    })
  } catch (error) {
    console.error('[GET WITHDRAWAL SETTINGS ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/settings/withdrawal
 * Update withdrawal settings (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      withdrawalMinAmount,
      withdrawalAdminFee,
      withdrawalPinRequired,
      withdrawalPinLength,
    } = body

    // Validation
    if (withdrawalMinAmount < 0) {
      return NextResponse.json(
        { error: 'Minimal penarikan tidak boleh negatif' },
        { status: 400 }
      )
    }

    if (withdrawalAdminFee < 0) {
      return NextResponse.json(
        { error: 'Biaya admin tidak boleh negatif' },
        { status: 400 }
      )
    }

    if (![4, 6, 8].includes(withdrawalPinLength)) {
      return NextResponse.json(
        { error: 'Panjang PIN harus 4, 6, atau 8 digit' },
        { status: 400 }
      )
    }

    // Get or create settings
    const existingSettings = await prisma.settings.findFirst()

    if (existingSettings) {
      await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          withdrawalMinAmount,
          withdrawalAdminFee,
          withdrawalPinRequired,
          withdrawalPinLength,
        },
      })
    } else {
      await prisma.settings.create({
        data: {
          withdrawalMinAmount,
          withdrawalAdminFee,
          withdrawalPinRequired,
          withdrawalPinLength,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan penarikan berhasil disimpan',
    })
  } catch (error) {
    console.error('[UPDATE WITHDRAWAL SETTINGS ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
