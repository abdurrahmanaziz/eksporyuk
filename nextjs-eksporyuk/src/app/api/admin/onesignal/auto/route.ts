import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Get all auto notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[Auto GET] Session user:', session?.user?.email, 'Role:', session?.user?.role)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const autoNotifications = await prisma.oneSignalAutoNotification.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      autoNotifications
    })
  } catch (error) {
    console.error('[OneSignal Auto] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new auto notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, trigger, title, message, url, enabled, delayMinutes, targetType } = body

    if (!name || !trigger || !title || !message) {
      return NextResponse.json({ error: 'Name, trigger, title, and message are required' }, { status: 400 })
    }

    const autoNotification = await prisma.oneSignalAutoNotification.create({
      data: {
        name,
        trigger,
        title,
        message,
        url: url || null,
        enabled: enabled !== false,
        delayMinutes: delayMinutes || 0,
        targetType: targetType || 'user'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Auto notification created successfully',
      autoNotification
    })
  } catch (error) {
    console.error('[OneSignal Auto] Create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update auto notification
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, trigger, title, message, url, enabled, delayMinutes, targetType } = body

    if (!id || !name || !trigger || !title || !message) {
      return NextResponse.json({ error: 'ID, name, trigger, title, and message are required' }, { status: 400 })
    }

    const autoNotification = await prisma.oneSignalAutoNotification.update({
      where: { id },
      data: {
        name,
        trigger,
        title,
        message,
        url: url || null,
        enabled: enabled !== false,
        delayMinutes: delayMinutes || 0,
        targetType: targetType || 'user'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Auto notification updated successfully',
      autoNotification
    })
  } catch (error) {
    console.error('[OneSignal Auto] Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Toggle auto notification enabled/disabled
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, enabled } = body

    if (!id || enabled === undefined) {
      return NextResponse.json({ error: 'ID and enabled status are required' }, { status: 400 })
    }

    await prisma.oneSignalAutoNotification.update({
      where: { id },
      data: { enabled }
    })

    return NextResponse.json({
      success: true,
      message: `Auto notification ${enabled ? 'enabled' : 'disabled'}`
    })
  } catch (error) {
    console.error('[OneSignal Auto] Toggle error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete auto notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Auto notification ID is required' }, { status: 400 })
    }

    await prisma.oneSignalAutoNotification.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Auto notification deleted successfully'
    })
  } catch (error) {
    console.error('[OneSignal Auto] Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
