/**
 * POST /api/admin/reminders/test
 * Send test reminder to admin user
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { reminderService } from '@/lib/services/reminderService'
import { notificationService } from '@/lib/services/notificationService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reminderId, channel, testUserId } = body

    // Get reminder
    const reminder = await prisma.membershipReminder.findUnique({
      where: { id: reminderId },
      include: { membership: true },
    })

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder tidak ditemukan' },
        { status: 404 }
      )
    }

    // Use test user or current admin
    const targetUserId = testUserId || session.user.id

    // Get target user info
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Prepare test variables
    const variables = {
      name: user.name || 'Test User',
      email: user.email,
      phone: user.phone || user.whatsapp,
      plan_name: reminder.membership?.name || 'Test Plan',
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'),
      days_left: 30,
      payment_link: `${process.env.NEXT_PUBLIC_APP_URL}/memberships`,
      group_link: process.env.NEXT_PUBLIC_WHATSAPP_GROUP_LINK || '#',
      course_link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/courses`,
      dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }

    // Substitute variables in content
    const substituteVars = (text: string | null) => {
      if (!text) return text
      return reminderService.substituteVariables(text, variables)
    }

    let result: { success: boolean; error?: string } = { success: false }
    const selectedChannel = channel || 'IN_APP'

    // Send based on channel
    switch (selectedChannel) {
      case 'EMAIL':
        if (!reminder.emailEnabled) {
          return NextResponse.json(
            { error: 'Email tidak diaktifkan untuk reminder ini' },
            { status: 400 }
          )
        }
        result = await reminderService.sendReminder({
          reminderId: reminder.id,
          userId: user.id,
          channel: 'EMAIL',
          content: {
            subject: substituteVars(reminder.emailSubject) || reminder.title,
            body: substituteVars(reminder.emailBody) || reminder.description || '',
            cta: substituteVars(reminder.emailCTA) || undefined,
            ctaLink: substituteVars(reminder.emailCTALink) || undefined,
          },
        })
        break

      case 'WHATSAPP':
        if (!reminder.whatsappEnabled) {
          return NextResponse.json(
            { error: 'WhatsApp tidak diaktifkan untuk reminder ini' },
            { status: 400 }
          )
        }
        result = await reminderService.sendReminder({
          reminderId: reminder.id,
          userId: user.id,
          channel: 'WHATSAPP',
          content: {
            body: substituteVars(reminder.whatsappMessage) || reminder.description || '',
            cta: substituteVars(reminder.whatsappCTA) || undefined,
            ctaLink: substituteVars(reminder.whatsappCTALink) || undefined,
          },
        })
        break

      case 'PUSH':
        if (!reminder.pushEnabled) {
          return NextResponse.json(
            { error: 'Push notification tidak diaktifkan untuk reminder ini' },
            { status: 400 }
          )
        }
        result = await reminderService.sendReminder({
          reminderId: reminder.id,
          userId: user.id,
          channel: 'PUSH',
          content: {
            subject: substituteVars(reminder.pushTitle) || reminder.title,
            body: substituteVars(reminder.pushBody) || reminder.description || '',
            icon: reminder.pushIcon || undefined,
            ctaLink: substituteVars(reminder.pushClickAction) || undefined,
          },
        })
        break

      case 'IN_APP':
      default:
        if (!reminder.inAppEnabled) {
          return NextResponse.json(
            { error: 'In-app notification tidak diaktifkan untuk reminder ini' },
            { status: 400 }
          )
        }
        result = await reminderService.sendReminder({
          reminderId: reminder.id,
          userId: user.id,
          channel: 'IN_APP',
          content: {
            subject: substituteVars(reminder.inAppTitle) || reminder.title,
            body: substituteVars(reminder.inAppBody) || reminder.description || '',
            ctaLink: substituteVars(reminder.inAppLink) || undefined,
          },
        })
        break
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test reminder berhasil dikirim via ${selectedChannel}`,
        channel: selectedChannel,
        targetUser: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Gagal mengirim test reminder',
          channel: selectedChannel,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Admin Test Reminder]', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
