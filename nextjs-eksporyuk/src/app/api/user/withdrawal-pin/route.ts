import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/user/withdrawal-pin/check
 * Check if user has set withdrawal PIN
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        withdrawalPin: true,
        withdrawalPinSetAt: true,
      },
    })

    const hasPin = !!user?.withdrawalPin

    return NextResponse.json({
      hasPin,
      pinSetAt: user?.withdrawalPinSetAt,
    })
  } catch (error) {
    console.error('[CHECK PIN ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to check PIN status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/withdrawal-pin/set
 * Set or update withdrawal PIN
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { pin, currentPin } = body

    // Get settings for PIN length
    const settings = await prisma.settings.findFirst()
    const pinLength = settings?.withdrawalPinLength || 6

    // Validate PIN format
    if (!pin || pin.length !== pinLength) {
      return NextResponse.json(
        { error: `PIN harus ${pinLength} digit angka` },
        { status: 400 }
      )
    }

    if (!/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN hanya boleh berisi angka' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { withdrawalPin: true },
    })

    // If user already has PIN, verify current PIN
    if (user?.withdrawalPin) {
      if (!currentPin) {
        return NextResponse.json(
          { error: 'PIN lama diperlukan untuk mengubah PIN' },
          { status: 400 }
        )
      }

      const isValidCurrentPin = await bcrypt.compare(currentPin, user.withdrawalPin)
      if (!isValidCurrentPin) {
        return NextResponse.json(
          { error: 'PIN lama tidak sesuai' },
          { status: 400 }
        )
      }
    }

    // Hash new PIN
    const hashedPin = await bcrypt.hash(pin, 10)

    // Update user PIN
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        withdrawalPin: hashedPin,
        withdrawalPinSetAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: user?.withdrawalPin 
        ? 'PIN berhasil diubah' 
        : 'PIN berhasil diatur',
    })
  } catch (error) {
    console.error('[SET PIN ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to set PIN' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/withdrawal-pin/verify
 * Verify withdrawal PIN
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { pin } = body

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN diperlukan' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { withdrawalPin: true },
    })

    if (!user?.withdrawalPin) {
      return NextResponse.json(
        { error: 'PIN belum diatur' },
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

    return NextResponse.json({
      success: true,
      message: 'PIN valid',
    })
  } catch (error) {
    console.error('[VERIFY PIN ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    )
  }
}
