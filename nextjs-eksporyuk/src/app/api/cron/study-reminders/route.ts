import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyStudyReminder } from '@/lib/notifications'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Study Reminder Cron Job
 * Check for inactive students and send reminders
 * 
 * Call this API via cron job (e.g., daily at 10:00 AM)
 * Example: cPanel Cron Job or external service like cron-job.org
 * 
 * Authorization: Use CRON_SECRET env variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const reminderThresholdDays = parseInt(
      process.env.STUDY_REMINDER_DAYS || '7'
    ) // Default: 7 days

    const thresholdDate = new Date(
      now.getTime() - reminderThresholdDays * 24 * 60 * 60 * 1000
    )

    console.log(
      `🔍 Checking for inactive students (last activity > ${reminderThresholdDays} days)`
    )

    // Find enrollments with no progress update in X days
    const inactiveEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        status: 'ACTIVE',
        progress: {
          OR: [
            { lastAccessedAt: { lt: thresholdDate } },
            { lastAccessedAt: null },
          ],
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            isPublished: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            emailNotifications: true,
            whatsappNotifications: true,
          },
        },
        progress: {
          select: {
            lastAccessedAt: true,
            progress: true,
          },
        },
      },
    })

    console.log(`📚 Found ${inactiveEnrollments.length} inactive enrollments`)

    let remindersSent = 0
    let errors = 0

    for (const enrollment of inactiveEnrollments) {
      // Skip if course is not published
      if (!enrollment.course.isPublished) continue

      // Skip if user has notifications disabled
      if (
        !enrollment.user.emailNotifications &&
        !enrollment.user.whatsappNotifications
      ) {
        continue
      }

      try {
        await notifyStudyReminder(
          enrollment.userId,
          enrollment.course.title,
          enrollment.courseId
        )

        remindersSent++

        console.log(
          `✅ Reminder sent to ${enrollment.user.name} for "${enrollment.course.title}"`
        )
      } catch (error) {
        errors++
        console.error(
          `❌ Failed to send reminder to ${enrollment.user.name}:`,
          error
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Study reminders processed',
      stats: {
        totalInactive: inactiveEnrollments.length,
        remindersSent,
        errors,
        thresholdDays: reminderThresholdDays,
        processedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Study reminder cron error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process study reminders',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
