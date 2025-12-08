/**
 * Cron Job: Check Expiring Memberships
 * 
 * Purpose: Send email warnings to users whose membership will expire in 7 days
 * Schedule: Run daily at 09:00 AM
 * Security: Requires CRON_SECRET in Authorization header
 * 
 * Workflow:
 * 1. Find active memberships expiring in exactly 7 days
 * 2. Send expiry warning email to each user
 * 3. Log results (success/failure)
 * 4. Return summary report
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mailketing } from '@/lib/integrations/mailketing'
import { emailTemplates } from '@/lib/email-templates'

// Security: Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'your-secret-key-change-in-production'
  
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  return token === cronSecret
}

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authorization
    if (!verifyCronSecret(request)) {
      console.error('[CRON] Unauthorized access to check-expiring-memberships')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting check-expiring-memberships job...')

    // 2. Calculate date range (exactly 7 days from now)
    const now = new Date()
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    // Set time to start and end of day for exact 7-day match
    const startOfDay = new Date(sevenDaysFromNow)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(sevenDaysFromNow)
    endOfDay.setHours(23, 59, 59, 999)

    console.log('[CRON] Checking memberships expiring between:', {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString()
    })

    // 3. Find memberships expiring in 7 days
    const expiringMemberships = await prisma.userMembership.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true,
        endDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        membership: {
          select: {
            id: true,
            name: true,
            slug: true,
            checkoutSlug: true
          }
        }
      }
    })

    console.log(`[CRON] Found ${expiringMemberships.length} memberships expiring in 7 days`)

    // 4. Send email warnings
    const results = {
      total: expiringMemberships.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const userMembership of expiringMemberships) {
      try {
        // Calculate days remaining (should be 7)
        const daysRemaining = Math.ceil(
          (userMembership.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Generate renewal URL
        const renewalUrl = userMembership.membership.checkoutSlug
          ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/${userMembership.membership.checkoutSlug}`
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`

        // Prepare email data
        const emailData = emailTemplates.membershipExpiryWarning({
          userName: userMembership.user.name || 'Member',
          membershipName: userMembership.membership.name,
          expiryDate: userMembership.endDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          daysRemaining: daysRemaining,
          renewalUrl: renewalUrl
        })

        // Send email via Mailketing
        await mailketing.sendEmail({
          to: userMembership.user.email,
          subject: emailData.subject,
          html: emailData.html,
          tags: ['membership', 'expiry-warning', 'cron']
        })

        console.log(`[CRON] ✅ Expiry warning sent to ${userMembership.user.email}`)
        results.success++

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[CRON] ❌ Failed to send email to ${userMembership.user.email}:`, errorMsg)
        results.failed++
        results.errors.push(`${userMembership.user.email}: ${errorMsg}`)
      }
    }

    // 5. Return summary report
    const report = {
      success: true,
      timestamp: new Date().toISOString(),
      job: 'check-expiring-memberships',
      results: results,
      message: `Processed ${results.total} memberships: ${results.success} success, ${results.failed} failed`
    }

    console.log('[CRON] Job completed:', report)

    return NextResponse.json(report, { status: 200 })

  } catch (error) {
    console.error('[CRON] Error in check-expiring-memberships:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Prevent browser caching
export const dynamic = 'force-dynamic'
export const revalidate = 0
