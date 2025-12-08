import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Fetch follow-up settings and templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get settings from Settings table
    const settingsRecord = await prisma.settings.findFirst()

    const settings = {
      globalEnabled: settingsRecord?.followUpEnabled ?? true,
      defaultDelay: 1,
      defaultDelayUnit: 'DAYS',
      emailProvider: 'mailketing',
      whatsappProvider: 'starsender',
      pushProvider: 'onesignal',
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
      avoidWeekends: true,
      followUp1HourEnabled: settingsRecord?.followUp1HourEnabled ?? true,
      followUp24HourEnabled: settingsRecord?.followUp24HourEnabled ?? true,
      followUp48HourEnabled: settingsRecord?.followUp48HourEnabled ?? true,
      followUpMessage1Hour: settingsRecord?.followUpMessage1Hour || 'Halo {name}, pembayaran Anda sebesar Rp {amount} masih menunggu.',
      followUpMessage24Hour: settingsRecord?.followUpMessage24Hour || 'Reminder: Pembayaran Anda akan kadaluarsa dalam {timeLeft}.',
      followUpMessage48Hour: settingsRecord?.followUpMessage48Hour || 'Last chance! Pembayaran Anda akan dibatalkan otomatis.',
      mailkitingEnabled: settingsRecord?.mailkitingEnabled ?? false,
      mailkitingApiKey: settingsRecord?.mailkitingApiKey || '',
      starsenderEnabled: settingsRecord?.starsenderEnabled ?? false,
      starsenderApiKey: settingsRecord?.starsenderApiKey || '',
      onesignalEnabled: settingsRecord?.onesignalEnabled ?? false,
      onesignalAppId: settingsRecord?.onesignalAppId || '',
      onesignalApiKey: settingsRecord?.onesignalApiKey || '',
      pusherEnabled: settingsRecord?.pusherEnabled ?? false,
      pusherAppId: settingsRecord?.pusherAppId || '',
      pusherKey: settingsRecord?.pusherKey || '',
      pusherSecret: settingsRecord?.pusherSecret || '',
      pusherCluster: settingsRecord?.pusherCluster || 'ap1',
    }

    // Get templates from FollowUpTemplate model
    const templates = await prisma.followUpTemplate.findMany({
      where: { ownerType: 'admin' },
      orderBy: { triggerHours: 'asc' },
    })

    return NextResponse.json({ settings, templates })
  } catch (error) {
    console.error('Follow-up settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT - Update follow-up settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { settings } = await request.json()

    // Get or create settings record
    let settingsRecord = await prisma.settings.findFirst()
    
    if (!settingsRecord) {
      // Create new settings record if doesn't exist
      settingsRecord = await prisma.settings.create({
        data: {
          followUpEnabled: settings.globalEnabled ?? true,
          followUp1HourEnabled: settings.followUp1HourEnabled ?? true,
          followUp24HourEnabled: settings.followUp24HourEnabled ?? true,
          followUp48HourEnabled: settings.followUp48HourEnabled ?? true,
          followUpMessage1Hour: settings.followUpMessage1Hour,
          followUpMessage24Hour: settings.followUpMessage24Hour,
          followUpMessage48Hour: settings.followUpMessage48Hour,
          mailkitingEnabled: settings.mailkitingEnabled ?? false,
          mailkitingApiKey: settings.mailkitingApiKey,
          starsenderEnabled: settings.starsenderEnabled ?? false,
          starsenderApiKey: settings.starsenderApiKey,
          onesignalEnabled: settings.onesignalEnabled ?? false,
          onesignalAppId: settings.onesignalAppId,
          onesignalApiKey: settings.onesignalApiKey,
          pusherEnabled: settings.pusherEnabled ?? false,
          pusherAppId: settings.pusherAppId,
          pusherKey: settings.pusherKey,
          pusherSecret: settings.pusherSecret,
          pusherCluster: settings.pusherCluster || 'ap1',
        }
      })
    } else {
      // Update existing settings
      settingsRecord = await prisma.settings.update({
        where: { id: settingsRecord.id },
        data: {
          followUpEnabled: settings.globalEnabled ?? true,
          followUp1HourEnabled: settings.followUp1HourEnabled ?? true,
          followUp24HourEnabled: settings.followUp24HourEnabled ?? true,
          followUp48HourEnabled: settings.followUp48HourEnabled ?? true,
          followUpMessage1Hour: settings.followUpMessage1Hour,
          followUpMessage24Hour: settings.followUpMessage24Hour,
          followUpMessage48Hour: settings.followUpMessage48Hour,
          mailkitingEnabled: settings.mailkitingEnabled ?? false,
          mailkitingApiKey: settings.mailkitingApiKey,
          starsenderEnabled: settings.starsenderEnabled ?? false,
          starsenderApiKey: settings.starsenderApiKey,
          onesignalEnabled: settings.onesignalEnabled ?? false,
          onesignalAppId: settings.onesignalAppId,
          onesignalApiKey: settings.onesignalApiKey,
          pusherEnabled: settings.pusherEnabled ?? false,
          pusherAppId: settings.pusherAppId,
          pusherKey: settings.pusherKey,
          pusherSecret: settings.pusherSecret,
          pusherCluster: settings.pusherCluster || 'ap1',
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Follow-up settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
