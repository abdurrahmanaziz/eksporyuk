import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { notificationService } from '@/lib/services/notificationService'
import { NotificationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Fetch user notifications with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') as NotificationType | null
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const notifications = await notificationService.getUserNotifications(
      session.user.id,
      {
        limit,
        offset,
        type: type || undefined,
        unreadOnly
      }
    )
    
    const unreadCount = await notificationService.getUnreadCount(session.user.id)

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit
      }
    })
  } catch (error: any) {
    console.error('[API] Fetch notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', message: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Mark notifications as read (use notificationService)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      // Mark all notifications as read
      const result = await notificationService.markAllAsRead(session.user.id)

      return NextResponse.json({ 
        success: result.success, 
        count: result.count,
        message: `${result.count} notifications marked as read` 
      })
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds array required' },
        { status: 400 }
      )
    }

    // Mark specific notifications as read
    let successCount = 0
    for (const id of notificationIds) {
      const result = await notificationService.markAsRead(id)
      if (result.success) successCount++
    }

    return NextResponse.json({ 
      success: true,
      count: successCount,
      message: `${successCount} notifications marked as read` 
    })
  } catch (error: any) {
    console.error('[API] Mark notifications read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read', message: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID required' },
        { status: 400 }
      )
    }

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Notification deleted' 
    })
  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
