import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's notification preferences
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id }
    })

    // If no preferences exist, create default
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          enableAllEmail: true,
          enableAllPush: true,
          enableAllWhatsApp: false,
          enableAllInApp: true,
          chatNotifications: true,
          transactionNotifications: true,
          courseNotifications: true,
          postNotifications: true,
          commentNotifications: true,
          followerNotifications: true,
          affiliateNotifications: true,
          achievementNotifications: true,
          eventNotifications: true,
          systemNotifications: true,
          enableQuietHours: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00'
        }
      })
    }

    // Transform to frontend format
    const preferences = {
      emailEnabled: prefs.enableAllEmail,
      pushEnabled: prefs.enableAllPush,
      whatsappEnabled: prefs.enableAllWhatsApp,
      inAppEnabled: prefs.enableAllInApp,
      chatMessages: prefs.chatNotifications,
      transactionUpdates: prefs.transactionNotifications,
      courseUpdates: prefs.courseNotifications,
      communityActivity: prefs.postNotifications && prefs.commentNotifications,
      affiliateUpdates: prefs.affiliateNotifications,
      promotions: prefs.eventNotifications,
      systemAnnouncements: prefs.systemNotifications,
      quietHoursEnabled: prefs.enableQuietHours,
      quietHoursStart: prefs.quietHoursStart || '22:00',
      quietHoursEnd: prefs.quietHoursEnd || '07:00'
    }

    return NextResponse.json({
      success: true,
      preferences
    })
  } catch (error) {
    console.error('[NotificationPreferences] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { preferences } = await request.json()

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences required' },
        { status: 400 }
      )
    }

    // Transform from frontend format to database format
    const dbPrefs: any = {}
    
    if (preferences.emailEnabled !== undefined) {
      dbPrefs.enableAllEmail = preferences.emailEnabled
    }
    if (preferences.pushEnabled !== undefined) {
      dbPrefs.enableAllPush = preferences.pushEnabled
    }
    if (preferences.whatsappEnabled !== undefined) {
      dbPrefs.enableAllWhatsApp = preferences.whatsappEnabled
    }
    if (preferences.inAppEnabled !== undefined) {
      dbPrefs.enableAllInApp = preferences.inAppEnabled
    }
    if (preferences.chatMessages !== undefined) {
      dbPrefs.chatNotifications = preferences.chatMessages
    }
    if (preferences.transactionUpdates !== undefined) {
      dbPrefs.transactionNotifications = preferences.transactionUpdates
    }
    if (preferences.courseUpdates !== undefined) {
      dbPrefs.courseNotifications = preferences.courseUpdates
    }
    if (preferences.communityActivity !== undefined) {
      dbPrefs.postNotifications = preferences.communityActivity
      dbPrefs.commentNotifications = preferences.communityActivity
      dbPrefs.followerNotifications = preferences.communityActivity
    }
    if (preferences.affiliateUpdates !== undefined) {
      dbPrefs.affiliateNotifications = preferences.affiliateUpdates
    }
    if (preferences.promotions !== undefined) {
      dbPrefs.eventNotifications = preferences.promotions
      dbPrefs.achievementNotifications = preferences.promotions
    }
    if (preferences.systemAnnouncements !== undefined) {
      dbPrefs.systemNotifications = preferences.systemAnnouncements
    }
    if (preferences.quietHoursEnabled !== undefined) {
      dbPrefs.enableQuietHours = preferences.quietHoursEnabled
    }
    if (preferences.quietHoursStart !== undefined) {
      dbPrefs.quietHoursStart = preferences.quietHoursStart
    }
    if (preferences.quietHoursEnd !== undefined) {
      dbPrefs.quietHoursEnd = preferences.quietHoursEnd
    }

    // Upsert preferences
    const updatedPrefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: dbPrefs,
      create: {
        userId: session.user.id,
        ...dbPrefs
      }
    })

    // Also update user's email/whatsapp notification flags for compatibility
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailNotifications: preferences.emailEnabled ?? true,
        whatsappNotifications: preferences.whatsappEnabled ?? false
      }
    })

    console.log(`[NotificationPreferences] Updated for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    })
  } catch (error) {
    console.error('[NotificationPreferences] PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
