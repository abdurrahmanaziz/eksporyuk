import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mailketing } from '@/lib/integrations/mailketing'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Cron Job: Send upgrade reminder emails to users without membership
 * 
 * Schedule: Run daily at 9:00 AM
 * 
 * Logic:
 * - Day 1: Welcome + first upgrade reminder (after profile complete)
 * - Day 2: Second reminder with benefits highlight
 * - Day 3: Final reminder with urgency
 * 
 * After 3 days, stop sending reminders until user takes action
 */

interface UserToRemind {
  id: string
  email: string
  name: string
  profileCompletedAt: Date | null
  createdAt: Date
  lastUpgradeReminderAt: Date | null
  upgradeReminderCount: number
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    // Find users to send reminders to:
    // 1. Profile is completed (profileCompletedAt is set)
    // 2. No active membership
    // 3. Has received less than 3 reminders
    // 4. Last reminder was sent more than 24 hours ago (or never)
    
    const usersToRemind = await prisma.user.findMany({
      where: {
        profileCompletedAt: { not: null }, // Profile completed
        role: 'MEMBER_FREE', // Only free members
        upgradeReminderCount: { lt: 3 }, // Less than 3 reminders sent
        OR: [
          { lastUpgradeReminderAt: null }, // Never sent
          { lastUpgradeReminderAt: { lt: oneDayAgo } }, // Last sent > 24 hours ago
        ],
        // No active membership
        memberships: {
          none: {
            isActive: true,
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileCompletedAt: true,
        createdAt: true,
        lastUpgradeReminderAt: true,
        upgradeReminderCount: true,
      },
      take: 100, // Process max 100 users per run
    })

    console.log(`[Upgrade Reminder] Found ${usersToRemind.length} users to send reminders`)

    const results = {
      total: usersToRemind.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{ email: string; status: string; day: number }>
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'

    for (const user of usersToRemind) {
      try {
        const reminderDay = user.upgradeReminderCount + 1 // 1, 2, or 3
        
        // Get email content based on day
        const emailContent = getReminderEmailContent(user.name, reminderDay, appUrl)
        
        // Send email
        const emailResult = await mailketing.sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          tags: ['upgrade-reminder', `day-${reminderDay}`]
        })

        if (emailResult.success) {
          // Update user record
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastUpgradeReminderAt: now,
              upgradeReminderCount: reminderDay,
            }
          })

          results.sent++
          results.details.push({ email: user.email, status: 'sent', day: reminderDay })
          console.log(`[Upgrade Reminder] Sent day ${reminderDay} reminder to ${user.email}`)
        } else {
          results.failed++
          results.details.push({ email: user.email, status: 'failed', day: reminderDay })
          console.error(`[Upgrade Reminder] Failed to send to ${user.email}:`, emailResult.error)
        }
      } catch (error) {
        results.failed++
        results.details.push({ email: user.email, status: 'error', day: user.upgradeReminderCount + 1 })
        console.error(`[Upgrade Reminder] Error processing ${user.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Upgrade reminders processed`,
      results
    })

  } catch (error) {
    console.error('[Upgrade Reminder] Cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getReminderEmailContent(name: string, day: number, appUrl: string) {
  const membershipUrl = `${appUrl}/membership`
  
  if (day === 1) {
    return {
      subject: 'Langkah Selanjutnya: Pilih Paket Membership Anda',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Halo ${name}!</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Profil Anda sudah lengkap! Sekarang saatnya memilih paket membership untuk memulai perjalanan ekspor Anda.</p>
            
            <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #ea580c;">Dengan Membership Anda Mendapat:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">Akses ke semua kursus premium</li>
                <li style="margin-bottom: 8px;">Bergabung dengan komunitas eksklusif</li>
                <li style="margin-bottom: 8px;">Database buyer & supplier</li>
                <li style="margin-bottom: 8px;">Template dokumen ekspor</li>
                <li>Dan masih banyak lagi!</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${membershipUrl}" 
                 style="display: inline-block; background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Lihat Paket Membership
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">Salam sukses,<br><strong>Tim EksporYuk</strong></p>
          </div>
        </div>
      `
    }
  } else if (day === 2) {
    return {
      subject: 'Jangan Lewatkan! Fitur Premium Menanti Anda',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Hai ${name}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Kami perhatikan Anda belum memilih paket membership</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Banyak member kami yang sudah merasakan manfaat luar biasa dari membership EksporYuk:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 10px;">📚</span>
                <div>
                  <strong>Kursus Premium</strong>
                  <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Belajar ekspor dari ahlinya dengan video berkualitas</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 10px;">👥</span>
                <div>
                  <strong>Komunitas Eksklusif</strong>
                  <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Networking dengan eksportir sukses</p>
                </div>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">🎁</span>
                <div>
                  <strong>Bonus Produk</strong>
                  <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Tools & template untuk bisnis ekspor Anda</p>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${membershipUrl}" 
                 style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Pilih Paket Sekarang
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">Ada pertanyaan? Balas email ini atau hubungi kami via WhatsApp.</p>
            <p style="font-size: 14px; color: #6b7280;">Salam sukses,<br><strong>Tim EksporYuk</strong></p>
          </div>
        </div>
      `
    }
  } else {
    // Day 3 - Final reminder with urgency
    return {
      subject: 'Terakhir Hari Ini: Mulai Perjalanan Ekspor Anda!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Halo ${name}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Ini adalah reminder terakhir dari kami</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Kami tidak akan mengganggu Anda lagi dengan email ini, tapi sebelum itu kami ingin memastikan Anda tidak melewatkan kesempatan ini.</p>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
              <strong style="color: #dc2626;">Tanpa Membership, Anda akan:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">Tidak bisa mengakses kursus premium</li>
                <li style="margin-bottom: 8px;">Tidak bisa bergabung dengan grup komunitas</li>
                <li style="margin-bottom: 8px;">Tidak mendapat akses ke database buyer</li>
                <li>Melewatkan kesempatan networking</li>
              </ul>
            </div>

            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
              <strong style="color: #10b981;">Dengan Membership, Anda bisa:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">Mulai belajar ekspor hari ini juga</li>
                <li style="margin-bottom: 8px;">Connect dengan eksportir berpengalaman</li>
                <li style="margin-bottom: 8px;">Akses tools & template siap pakai</li>
                <li>Mulai bisnis ekspor pertama Anda!</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${membershipUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px;">
                Mulai Sekarang
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center;">Ini adalah email terakhir reminder dari kami.<br>Kami berharap bisa membantu perjalanan ekspor Anda.</p>
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">Salam sukses,<br><strong>Tim EksporYuk</strong></p>
          </div>
        </div>
      `
    }
  }
}

// Also support POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request)
}
