import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { playerId, tags } = await request.json()

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID required' },
        { status: 400 }
      )
    }

    // Update user with OneSignal player ID and tags
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        oneSignalPlayerId: playerId,
        oneSignalSubscribedAt: new Date(),
        oneSignalTags: tags || {}
      }
    })

    console.log(`[OneSignal] User ${session.user.id} subscribed with player ID: ${playerId}`)
    console.log(`[OneSignal] Tags saved:`, tags ? Object.keys(tags).length : 0, 'tags')

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully'
    })
  } catch (error) {
    console.error('[OneSignal] Subscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Remove OneSignal player ID and tags
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        oneSignalPlayerId: null,
        oneSignalSubscribedAt: null,
        oneSignalTags: null
      }
    })

    console.log(`[OneSignal] User ${session.user.id} unsubscribed`)

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully'
    })
  } catch (error) {
    console.error('[OneSignal] Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
