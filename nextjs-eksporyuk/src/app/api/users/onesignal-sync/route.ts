import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/users/onesignal-sync
 * 
 * Sync OneSignal Player ID dari browser ke database
 * Dipanggil ketika user subscribe web push notification
 * 
 * Request body:
 * {
 *   playerId: string - OneSignal Player ID
 *   tags?: object - Additional tags untuk OneSignal
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   user: {
 *     id: string
 *     oneSignalPlayerId: string
 *     oneSignalSubscribedAt: DateTime
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Verifikasi user sudah login
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { playerId, tags } = body

    // Validasi playerId
    if (!playerId || typeof playerId !== 'string' || playerId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid or missing playerId' },
        { status: 400 }
      )
    }

    // Cek apakah playerId sudah terpakai user lain
    const existingPlayer = await prisma.user.findFirst({
      where: {
        oneSignalPlayerId: playerId,
        id: { not: session.user.id }
      },
      select: { id: true }
    })

    // Jika player ID sudah terpakai, unlink dari user lama terlebih dahulu
    if (existingPlayer) {
      await prisma.user.update({
        where: { id: existingPlayer.id },
        data: {
          oneSignalPlayerId: null,
          oneSignalSubscribedAt: null
        }
      })
    }

    // Update atau create user dengan Player ID
    const now = new Date()
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        oneSignalPlayerId: playerId.trim(),
        oneSignalSubscribedAt: now,
        oneSignalTags: tags || {}
      },
      select: {
        id: true,
        email: true,
        name: true,
        oneSignalPlayerId: true,
        oneSignalSubscribedAt: true,
        role: true,
        province: true,
        city: true
      }
    })

    // Log activity untuk audit trail
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'ONESIGNAL_SUBSCRIPTION_SYNCED',
          entity: 'OneSignal',
          entityId: playerId.substring(0, 20),
          metadata: {
            playerId: playerId.substring(0, 20) + '...',
            tagsCount: tags ? Object.keys(tags).length : 0
          }
        }
      })
    } catch (logError) {
      // Jika activity log gagal, jangan berhenti proses utama
      console.warn('[OneSignal] Activity log failed:', logError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        oneSignalPlayerId: updatedUser.oneSignalPlayerId,
        oneSignalSubscribedAt: updatedUser.oneSignalSubscribedAt,
        role: updatedUser.role,
        province: updatedUser.province,
        city: updatedUser.city
      }
    })
  } catch (error) {
    console.error('[OneSignal Sync] Error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to sync OneSignal Player ID' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/users/onesignal-sync
 * 
 * Verify status OneSignal subscription untuk user saat ini
 * 
 * Response:
 * {
 *   subscribed: boolean
 *   playerId: string | null
 *   subscribedAt: DateTime | null
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        oneSignalPlayerId: true,
        oneSignalSubscribedAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      subscribed: !!user.oneSignalPlayerId,
      playerId: user.oneSignalPlayerId,
      subscribedAt: user.oneSignalSubscribedAt
    })
  } catch (error) {
    console.error('[OneSignal Sync GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
