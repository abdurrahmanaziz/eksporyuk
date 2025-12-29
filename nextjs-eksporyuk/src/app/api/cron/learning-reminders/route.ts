import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/cron/learning-reminders
 * Cron job to send learning reminders to inactive students
 * Setup in Vercel/cron: Run daily at 09:00 AM
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/learning-reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Find users with inactive courses (not accessed in 3+ days) - UserCourseProgress has no relations
    const inactiveProgressData = await prisma.userCourseProgress.findMany({
      where: {
        hasAccess: true,
        isCompleted: false,
        lastAccessedAt: {
          lt: threeDaysAgo
        }
      }
    })

    // Get unique user and course IDs
    const userIds = [...new Set(inactiveProgressData.map(p => p.userId))]
    const courseIds = [...new Set(inactiveProgressData.map(p => p.courseId))]

    // Fetch users and courses separately
    const [users, courses] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }),
      prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          title: true,
          slug: true
        }
      })
    ])

    const userMap = new Map(users.map(u => [u.id, u]))
    const courseMap = new Map(courses.map(c => [c.id, c]))

    // Build enriched progress data
    const inactiveProgress = inactiveProgressData
      .filter(p => userMap.has(p.userId) && courseMap.has(p.courseId))
      .map(p => ({
        ...p,
        user: userMap.get(p.userId)!,
        course: courseMap.get(p.courseId)!
      }))

    let remindersSent = 0
    let emailsSent = 0
    let whatsappSent = 0

    for (const progress of inactiveProgress) {
      const daysSinceAccess = Math.floor(
        (now.getTime() - new Date(progress.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Skip if already sent reminder recently
      const recentNotif = await prisma.notification.findFirst({
        where: {
          userId: progress.userId,
          type: 'SYSTEM',
          createdAt: {
            gte: threeDaysAgo
          },
          link: `/learn/${progress.course.slug}`
        }
      })

      if (recentNotif) {
        continue // Skip, already sent reminder
      }

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: progress.userId,
          type: 'SYSTEM',
          title: `Lanjutkan belajar di ${progress.course.title}`,
          message: `Sudah ${daysSinceAccess} hari tidak belajar. Yuk lanjutkan!`,
          link: `/learn/${progress.course.slug}`,
          metadata: {
            courseId: progress.courseId,
            daysSinceAccess,
            progress: progress.progress
          }
        }
      })

      remindersSent++

      // Send email reminder via Mailketing
      if (progress.user.email) {
        try {
          await sendEmailReminder(progress.user, progress.course, daysSinceAccess, progress.progress)
          emailsSent++
        } catch (error) {
          console.error('Email send error:', error)
        }
      }

      // Send WhatsApp reminder via Starsender (if phone exists)
      if (progress.user.phone) {
        try {
          await sendWhatsAppReminder(progress.user, progress.course, daysSinceAccess)
          whatsappSent++
        } catch (error) {
          console.error('WhatsApp send error:', error)
        }
      }
    }

    // Also send weekly digest for courses not completed in 7+ days
    const weeklyReminders = inactiveProgress.filter(p => {
      const daysSince = Math.floor(
        (now.getTime() - new Date(p.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSince >= 7 && daysSince % 7 === 0 // Every 7 days
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalInactive: inactiveProgress.length,
        remindersSent,
        emailsSent,
        whatsappSent,
        weeklyDigests: weeklyReminders.length
      },
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Learning reminders cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Send email reminder via Mailketing
 */
async function sendEmailReminder(
  user: { id: string; name: string | null; email: string },
  course: { title: string; slug: string },
  daysSinceAccess: number,
  progress: number
) {
  const mailketingApiKey = process.env.MAILKETING_API_KEY
  const mailketingUrl = process.env.MAILKETING_API_URL || 'https://api.mailketing.co.id'

  if (!mailketingApiKey) {
    console.warn('Mailketing API key not configured')
    return
  }

  const emailData = {
    to: user.email,
    subject: `Lanjutkan belajar di ${course.title}`,
    html: `
      <h2>Hai ${user.name || 'Student'}! 👋</h2>
      <p>Sudah ${daysSinceAccess} hari kamu tidak belajar di <strong>${course.title}</strong>.</p>
      <p>Progress kamu saat ini: <strong>${progress}%</strong></p>
      <p>Yuk lanjutkan belajar sekarang!</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/learn/${course.slug}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        Lanjutkan Belajar
      </a>
      <p style="margin-top: 24px; color: #666; font-size: 14px;">
        Tetap semangat! Setiap langkah kecil membawa kamu lebih dekat ke tujuan.
      </p>
    `
  }

  const response = await fetch(`${mailketingUrl}/v1/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mailketingApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  })

  if (!response.ok) {
    throw new Error('Mailketing API error')
  }
}

/**
 * Send WhatsApp reminder via Starsender
 */
async function sendWhatsAppReminder(
  user: { name: string | null; phone: string | null },
  course: { title: string; slug: string },
  daysSinceAccess: number
) {
  const starsenderApiKey = process.env.STARSENDER_API_KEY
  const starsenderUrl = process.env.STARSENDER_API_URL || 'https://api.starsender.online'

  if (!starsenderApiKey || !user.phone) {
    return
  }

  // Format phone number (remove leading 0, add 62)
  let phone = user.phone.replace(/^0/, '62')
  if (!phone.startsWith('62')) {
    phone = '62' + phone
  }

  const message = `Hai ${user.name || 'Student'}! 👋\n\nSudah ${daysSinceAccess} hari kamu tidak belajar di *${course.title}*.\n\nYuk lanjutkan belajar sekarang: ${process.env.NEXT_PUBLIC_APP_URL}/learn/${course.slug}\n\nTetap semangat! 🚀`

  const whatsappData = {
    phone,
    message
  }

  const response = await fetch(`${starsenderUrl}/api/send-message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${starsenderApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(whatsappData)
  })

  if (!response.ok) {
    throw new Error('Starsender API error')
  }
}
