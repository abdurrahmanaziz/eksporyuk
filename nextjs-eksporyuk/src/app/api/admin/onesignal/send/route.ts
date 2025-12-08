import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendOneSignalNotification } from '@/lib/onesignal'

// POST - Send notification via OneSignal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only admin can send
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      title, 
      message, 
      url, 
      targetType, 
      targetValue, 
      imageUrl,
      actionButtons,
      scheduleAt
    } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Build notification payload
    const notificationPayload: any = {
      headings: { en: title },
      contents: { en: message }
    }

    if (url) {
      notificationPayload.url = url
    }

    if (imageUrl) {
      notificationPayload.big_picture = imageUrl
      notificationPayload.chrome_web_image = imageUrl
    }

    if (actionButtons && actionButtons.length > 0) {
      notificationPayload.buttons = actionButtons.map((btn: any) => ({
        id: btn.id,
        text: btn.text,
        url: btn.url
      }))
    }

    if (scheduleAt) {
      notificationPayload.send_after = new Date(scheduleAt).toISOString()
    }

    // Determine targeting
    let targetDescription = 'All subscribers'
    let recipientCount = 0

    switch (targetType) {
      case 'all':
        // Send to all subscribed users
        notificationPayload.included_segments = ['Subscribed Users']
        const allUsers = await prisma.$queryRaw<Array<{count: bigint}>>`
          SELECT COUNT(*) as count FROM User WHERE oneSignalPlayerId IS NOT NULL
        `
        recipientCount = Number(allUsers[0]?.count || 0)
        targetDescription = 'Semua subscriber'
        break

      case 'membership':
        // Send to specific membership tier
        if (!targetValue) {
          return NextResponse.json({ error: 'Membership tier is required' }, { status: 400 })
        }
        notificationPayload.included_segments = ['Subscribed Users']
        notificationPayload.filters = [
          { field: 'tag', key: 'membershipTier', relation: '=', value: targetValue }
        ]
        // Count with raw query since role is enum
        const tierUsers = await prisma.$queryRaw<Array<{count: bigint}>>`
          SELECT COUNT(*) as count FROM User 
          WHERE oneSignalPlayerId IS NOT NULL 
          AND role LIKE ${'%' + targetValue + '%'}
        `
        recipientCount = Number(tierUsers[0]?.count || 0)
        targetDescription = `Member ${targetValue}`
        break

      case 'province':
        // Send to specific province
        if (!targetValue) {
          return NextResponse.json({ error: 'Province is required' }, { status: 400 })
        }
        notificationPayload.included_segments = ['Subscribed Users']
        notificationPayload.filters = [
          { field: 'tag', key: 'province', relation: '=', value: targetValue }
        ]
        const provinceUsers = await prisma.$queryRaw<Array<{count: bigint}>>`
          SELECT COUNT(*) as count FROM User 
          WHERE oneSignalPlayerId IS NOT NULL 
          AND province = ${targetValue}
        `
        recipientCount = Number(provinceUsers[0]?.count || 0)
        targetDescription = `Wilayah ${targetValue}`
        break

      case 'affiliate':
        // Send to affiliates only
        notificationPayload.included_segments = ['Subscribed Users']
        notificationPayload.filters = [
          { field: 'tag', key: 'isAffiliate', relation: '=', value: 'true' }
        ]
        const affiliateUsers = await prisma.$queryRaw<Array<{count: bigint}>>`
          SELECT COUNT(*) as count FROM User 
          WHERE oneSignalPlayerId IS NOT NULL 
          AND affiliateMenuEnabled = 1
        `
        recipientCount = Number(affiliateUsers[0]?.count || 0)
        targetDescription = 'Affiliate'
        break

      case 'user':
        // Send to specific user(s)
        if (!targetValue) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        const userIds = Array.isArray(targetValue) ? targetValue : [targetValue]
        const usersResult = await prisma.$queryRaw<Array<{oneSignalPlayerId: string}>>`
          SELECT oneSignalPlayerId FROM User 
          WHERE id IN (${userIds.join(',')}) 
          AND oneSignalPlayerId IS NOT NULL
        `
        if (usersResult.length === 0) {
          return NextResponse.json({ error: 'No subscribed users found' }, { status: 400 })
        }
        notificationPayload.include_player_ids = usersResult.map(u => u.oneSignalPlayerId)
        recipientCount = usersResult.length
        targetDescription = `${usersResult.length} user spesifik`
        break

      case 'segment':
        // Send to OneSignal segment
        if (!targetValue) {
          return NextResponse.json({ error: 'Segment name is required' }, { status: 400 })
        }
        notificationPayload.included_segments = [targetValue]
        targetDescription = `Segment: ${targetValue}`
        break

      default:
        return NextResponse.json({ error: 'Invalid target type' }, { status: 400 })
    }

    // Send via OneSignal
    const result = await sendOneSignalNotification(notificationPayload)

    // Log to notification history
    await prisma.notification.create({
      data: {
        userId: session.user.id, // Sender
        title: `[OneSignal] ${title}`,
        message: `Target: ${targetDescription}. ${message}`,
        type: 'SYSTEM',
        link: url || undefined,
        metadata: {
          onesignal: true,
          targetType,
          targetValue,
          recipientCount,
          onesignalResponse: result
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        targetType,
        targetDescription,
        recipientCount,
        onesignalResponse: result
      }
    })
  } catch (error: any) {
    console.error('[Admin OneSignal] Send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    )
  }
}
