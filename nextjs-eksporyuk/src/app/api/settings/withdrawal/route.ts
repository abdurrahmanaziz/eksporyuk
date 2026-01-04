import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/settings/withdrawal
 * Get public withdrawal settings (for any authenticated user)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.settings.findFirst({
      select: {
        withdrawalMinAmount: true,
        withdrawalAdminFee: true,
        withdrawalPinRequired: true,
        withdrawalPinLength: true,
        xenditEnabled: true,
      },
    })

    // Check if Xendit is properly configured
    const xenditEnabled = !!(
      process.env.XENDIT_SECRET_KEY && 
      process.env.XENDIT_WEBHOOK_TOKEN &&
      settings?.xenditEnabled !== false
    )

    return NextResponse.json({
      settings: {
        withdrawalMinAmount: settings?.withdrawalMinAmount || 50000,
        withdrawalAdminFee: settings?.withdrawalAdminFee || 5000,
        withdrawalPinRequired: settings?.withdrawalPinRequired ?? true,
        withdrawalPinLength: settings?.withdrawalPinLength || 6,
        xenditEnabled,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('[GET PUBLIC WITHDRAWAL SETTINGS ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
