import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Get user's OneSignal tags from database
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
        oneSignalSubscribedAt: true,
        oneSignalTags: true
      }
    })

    return NextResponse.json({
      success: true,
      playerId: user?.oneSignalPlayerId,
      subscribedAt: user?.oneSignalSubscribedAt,
      tags: user?.oneSignalTags || {}
    })
  } catch (error) {
    console.error('[OneSignal] Get tags error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user's OneSignal tags (sync from client or admin update)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { tags, userId } = await request.json()

    // Admin can update other user's tags
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const targetUserId = isAdmin && userId ? userId : session.user.id

    if (!tags || typeof tags !== 'object') {
      return NextResponse.json(
        { error: 'Invalid tags format' },
        { status: 400 }
      )
    }

    // Get current tags
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { oneSignalTags: true }
    })

    // Merge with existing tags
    const existingTags = (user?.oneSignalTags as Record<string, any>) || {}
    const updatedTags = { ...existingTags, ...tags, lastTagUpdate: new Date().toISOString() }

    // Update user tags in database
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        oneSignalTags: updatedTags
      }
    })

    console.log(`[OneSignal] Tags updated for user ${targetUserId}:`, Object.keys(tags).length, 'tags')

    return NextResponse.json({
      success: true,
      message: 'Tags updated successfully',
      tags: updatedTags
    })
  } catch (error) {
    console.error('[OneSignal] Update tags error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove specific tags
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { tagKeys, userId } = await request.json()

    // Admin can remove other user's tags
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const targetUserId = isAdmin && userId ? userId : session.user.id

    if (!tagKeys || !Array.isArray(tagKeys)) {
      return NextResponse.json(
        { error: 'Invalid tagKeys format, expected array' },
        { status: 400 }
      )
    }

    // Get current tags
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { oneSignalTags: true }
    })

    const existingTags = (user?.oneSignalTags as Record<string, any>) || {}
    
    // Remove specified tags
    tagKeys.forEach((key: string) => {
      delete existingTags[key]
    })

    existingTags.lastTagUpdate = new Date().toISOString()

    // Update user tags in database
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        oneSignalTags: existingTags
      }
    })

    console.log(`[OneSignal] Tags removed for user ${targetUserId}:`, tagKeys)

    return NextResponse.json({
      success: true,
      message: 'Tags removed successfully',
      remainingTags: existingTags
    })
  } catch (error) {
    console.error('[OneSignal] Remove tags error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
