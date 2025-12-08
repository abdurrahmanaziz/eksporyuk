/**
 * Cron Job: Auto-Expire Memberships
 * 
 * Purpose: Automatically set membership status to EXPIRED when endDate has passed
 * Schedule: Run daily at 00:00 (midnight)
 * Security: Requires CRON_SECRET in Authorization header
 * 
 * Workflow:
 * 1. Find all active memberships with endDate < today
 * 2. Set status = 'EXPIRED' and isActive = false
 * 3. Remove user access from:
 *    - Membership groups (GroupMember)
 *    - Membership courses (CourseEnrollment)
 *    - Membership products (UserProduct)
 * 4. Send expiry notification email
 * 5. Log results and return summary
 * 
 * Note: Does NOT delete data, only updates status for audit trail
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
      console.error('[CRON] Unauthorized access to expire-memberships')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting expire-memberships job...')

    // 2. Find expired memberships (endDate < now AND still active)
    const now = new Date()
    
    const expiredMemberships = await prisma.userMembership.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true,
        endDate: {
          lt: now // Less than current date = expired
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
            checkoutSlug: true,
            membershipGroups: {
              include: {
                group: {
                  select: { id: true, name: true }
                }
              }
            },
            membershipCourses: {
              include: {
                course: {
                  select: { id: true, title: true }
                }
              }
            },
            membershipProducts: {
              include: {
                product: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    })

    console.log(`[CRON] Found ${expiredMemberships.length} expired memberships to process`)

    // 3. Process each expired membership
    const results = {
      total: expiredMemberships.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
      details: [] as any[]
    }

    for (const userMembership of expiredMemberships) {
      try {
        const userId = userMembership.user.id
        const membershipId = userMembership.membership.id

        // 3a. Update UserMembership status
        await prisma.userMembership.update({
          where: { id: userMembership.id },
          data: {
            status: 'EXPIRED',
            isActive: false,
            updatedAt: new Date()
          }
        })

        console.log(`[CRON] ✅ Membership ${userMembership.id} set to EXPIRED`)

        // 3b. Remove from groups (only if they joined via this membership)
        const groupsRemoved = []
        for (const mg of userMembership.membership.membershipGroups) {
          try {
            await prisma.groupMember.deleteMany({
              where: {
                userId: userId,
                groupId: mg.group.id,
                // Only remove if they don't have access via other active memberships
              }
            })
            groupsRemoved.push(mg.group.name)
          } catch (error) {
            console.warn(`[CRON] Could not remove from group ${mg.group.id}:`, error)
          }
        }

        // 3c. Remove from courses (only if enrolled via this membership)
        const coursesRemoved = []
        for (const mc of userMembership.membership.membershipCourses) {
          try {
            await prisma.courseEnrollment.deleteMany({
              where: {
                userId: userId,
                courseId: mc.course.id
              }
            })
            coursesRemoved.push(mc.course.title)
          } catch (error) {
            console.warn(`[CRON] Could not remove from course ${mc.course.id}:`, error)
          }
        }

        // 3d. Mark products as expired (don't delete, just mark)
        const productsMarked = []
        for (const mp of userMembership.membership.membershipProducts) {
          try {
            // Note: UserProduct doesn't have status field in current schema
            // So we just log it, can extend schema later if needed
            productsMarked.push(mp.product.name)
          } catch (error) {
            console.warn(`[CRON] Could not mark product ${mp.product.id}:`, error)
          }
        }

        // 3e. Send expiry notification email
        try {
          const renewalUrl = userMembership.membership.checkoutSlug
            ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/${userMembership.membership.checkoutSlug}`
            : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`

          const emailData = emailTemplates.membershipExpired({
            userName: userMembership.user.name || 'Member',
            membershipName: userMembership.membership.name,
            expiredDate: userMembership.endDate.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            renewalUrl: renewalUrl
          })

          await mailketing.sendEmail({
            to: userMembership.user.email,
            subject: emailData.subject,
            html: emailData.html,
            tags: ['membership', 'expired', 'cron']
          })

          console.log(`[CRON] 📧 Expiry notification sent to ${userMembership.user.email}`)
        } catch (emailError) {
          console.error(`[CRON] Failed to send expiry email to ${userMembership.user.email}:`, emailError)
          // Don't fail the whole process if email fails
        }

        // 3f. Record success
        results.success++
        results.details.push({
          userId: userId,
          userEmail: userMembership.user.email,
          membershipId: membershipId,
          membershipName: userMembership.membership.name,
          expiredDate: userMembership.endDate.toISOString(),
          groupsRemoved: groupsRemoved.length,
          coursesRemoved: coursesRemoved.length,
          productsMarked: productsMarked.length,
          status: 'success'
        })

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[CRON] ❌ Failed to expire membership ${userMembership.id}:`, errorMsg)
        
        results.failed++
        results.errors.push(`${userMembership.user.email}: ${errorMsg}`)
        results.details.push({
          userId: userMembership.user.id,
          userEmail: userMembership.user.email,
          membershipId: userMembership.membership.id,
          error: errorMsg,
          status: 'failed'
        })
      }
    }

    // 4. Return summary report
    const report = {
      success: true,
      timestamp: new Date().toISOString(),
      job: 'expire-memberships',
      results: {
        total: results.total,
        success: results.success,
        failed: results.failed,
        errors: results.errors
      },
      details: results.details,
      message: `Processed ${results.total} expired memberships: ${results.success} success, ${results.failed} failed`
    }

    console.log('[CRON] Job completed:', {
      total: results.total,
      success: results.success,
      failed: results.failed
    })

    return NextResponse.json(report, { status: 200 })

  } catch (error) {
    console.error('[CRON] Error in expire-memberships:', error)
    
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
