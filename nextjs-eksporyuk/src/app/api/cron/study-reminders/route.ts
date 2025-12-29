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

    // Find progress records with no activity in X days (UserCourseProgress has no relations)
    const inactiveProgress = await prisma.userCourseProgress.findMany({
      where: {
        OR: [
          { lastAccessedAt: { lt: thresholdDate } },
          { lastAccessedAt: null },
        ],
      }
    })

    // Get unique user and course IDs
    const userIds = [...new Set(inactiveProgress.map(p => p.userId))]
    const courseIds = [...new Set(inactiveProgress.map(p => p.courseId))]

    // Fetch users and courses separately
    const [users, courses, enrollments] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          emailNotifications: true,
          whatsappNotifications: true,
        }
      }),
      prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          title: true,
          isPublished: true,
        }
      }),
      prisma.courseEnrollment.findMany({
        where: {
          userId: { in: userIds },
          courseId: { in: courseIds }
        },
        select: {
          userId: true,
          courseId: true
        }
      })
    ])

    const userMap = new Map(users.map(u => [u.id, u]))
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const enrollmentSet = new Set(enrollments.map(e => `${e.userId}_${e.courseId}`))

    // Build inactive enrollments list
    const inactiveEnrollments = inactiveProgress
      .filter(p => {
        const course = courseMap.get(p.courseId)
        // Only include if user is enrolled and course is published
        return course?.isPublished && enrollmentSet.has(`${p.userId}_${p.courseId}`)
      })
      .map(p => ({
        userId: p.userId,
        courseId: p.courseId,
        user: userMap.get(p.userId)!,
        course: courseMap.get(p.courseId)!,
        progress: {
          lastAccessedAt: p.lastAccessedAt,
          progress: p.progress
        }
      }))

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
