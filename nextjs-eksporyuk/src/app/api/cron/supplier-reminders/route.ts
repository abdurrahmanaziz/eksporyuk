import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Cron Job: Supplier Renewal Reminders
 * Sends email reminders for expiring memberships
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      renewalReminders: 0,
      errors: [] as string[]
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Renewal reminders (7 days before)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    sevenDaysFromNow.setHours(23, 59, 59, 999)

    const sevenDaysStart = new Date(sevenDaysFromNow)
    sevenDaysStart.setHours(0, 0, 0, 0)

    const expiringIn7Days = await prisma.supplierMembership.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: sevenDaysStart,
          lte: sevenDaysFromNow
        }
      },
      include: {
        user: true,
        package: true
      }
    })

    for (const membership of expiringIn7Days) {
      const profile = await prisma.supplierProfile.findUnique({
        where: { userId: membership.userId }
      })

      if (!profile) continue

      try {
        await sendRenewalReminder({
          email: membership.user.email,
          name: membership.user.name,
          companyName: profile.companyName,
          packageName: membership.package.name,
          expiryDate: membership.endDate!,
          daysRemaining: 7,
          renewUrl: `${appUrl}/checkout/supplier/${membership.package.slug}`
        })

        results.renewalReminders++
      } catch (error) {
        results.errors.push(`Failed for ${membership.user.email}`)
      }
    }

    // Renewal reminders (1 day before)
    const oneDayFromNow = new Date()
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)
    oneDayFromNow.setHours(23, 59, 59, 999)

    const oneDayStart = new Date(oneDayFromNow)
    oneDayStart.setHours(0, 0, 0, 0)

    const expiringIn1Day = await prisma.supplierMembership.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: oneDayStart,
          lte: oneDayFromNow
        }
      },
      include: {
        user: true,
        package: true
      }
    })

    for (const membership of expiringIn1Day) {
      const profile = await prisma.supplierProfile.findUnique({
        where: { userId: membership.userId }
      })

      if (!profile) continue

      try {
        await sendRenewalReminder({
          email: membership.user.email,
          name: membership.user.name,
          companyName: profile.companyName,
          packageName: membership.package.name,
          expiryDate: membership.endDate!,
          daysRemaining: 1,
          renewUrl: `${appUrl}/checkout/supplier/${membership.package.slug}`
        })

        results.renewalReminders++
      } catch (error) {
        results.errors.push(`Failed for ${membership.user.email}`)
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Supplier reminders error:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

async function sendRenewalReminder(data: any) {
  const apiKey = process.env.MAILKETING_API_KEY
  const apiUrl = process.env.MAILKETING_API_URL || 'https://api.mailketing.co.id'

  if (!apiKey) return false

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(data.expiryDate)

  await fetch(`${apiUrl}/v1/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: data.email,
      subject: `⏰ Membership ${data.companyName} Akan Berakhir ${data.daysRemaining === 1 ? 'Besok' : `dalam ${data.daysRemaining} Hari`}`,
      html: `
        <h2>Halo ${data.name},</h2>
        <p>Membership <strong>${data.packageName}</strong> untuk <strong>${data.companyName}</strong> akan berakhir pada <strong>${formattedDate}</strong>.</p>
        <p>Perpanjang sekarang agar tidak kehilangan akses fitur premium.</p>
        <a href="${data.renewUrl}" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0;">Perpanjang Membership</a>
      `
    })
  })
}
