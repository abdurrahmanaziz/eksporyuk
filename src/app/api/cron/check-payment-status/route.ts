/**
 * Cron Job: Check Payment Status
 * 
 * Purpose: Auto-check Xendit API for pending payments that may have completed but webhook failed
 * Schedule: Run every 6 hours (00:00, 06:00, 12:00, 18:00)
 * Security: Requires CRON_SECRET in Authorization header
 * 
 * Workflow:
 * 1. Find PENDING transactions older than 5 minutes (avoid checking too fresh transactions)
 * 2. Query Xendit Invoice API to check real payment status
 * 3. If PAID: Update transaction, activate membership/product, send email
 * 4. If EXPIRED/FAILED: Update transaction status to FAILED
 * 5. Return detailed report
 * 
 * Use Case:
 * - Xendit webhook failed to deliver
 * - Network issue during webhook callback
 * - Customer paid but system didn't receive notification
 * - Manual reconciliation with Xendit dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'
import { mailketing } from '@/lib/integrations/mailketing'
import { emailTemplates } from '@/lib/email-templates'
import { addUserToMailketingList } from '@/lib/integrations/mailketing'

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
      console.error('[CRON] Unauthorized access to check-payment-status')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting check-payment-status job...')

    // 2. Find PENDING transactions older than 5 minutes (avoid checking too fresh)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Don't check older than 7 days

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: sevenDaysAgo,
          lte: fiveMinutesAgo
        },
        externalId: {
          not: null // Only check transactions with Xendit external ID
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            mailketingLists: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Check max 50 transactions per run to avoid timeout
    })

    console.log(`[CRON] Found ${pendingTransactions.length} pending transactions to check`)

    // 3. Check each transaction with Xendit API
    const results = {
      total: pendingTransactions.length,
      updated: 0,
      paid: 0,
      expired: 0,
      failed: 0,
      unchanged: 0,
      errors: [] as string[],
      details: [] as any[]
    }

    for (const transaction of pendingTransactions) {
      try {
        console.log(`[CRON] Checking transaction ${transaction.id} (External: ${transaction.externalId})`)

        // Query Xendit Invoice API
        let xenditStatus: string | null = null
        let xenditInvoice: any = null

        try {
          if (transaction.reference) {
            // If we have invoice ID, use it
            xenditInvoice = await xenditService.getInvoice(transaction.reference)
            xenditStatus = xenditInvoice.status
            console.log(`[CRON] Xendit invoice status: ${xenditStatus}`)
          } else {
            console.log(`[CRON] No reference ID, skipping API check for ${transaction.id}`)
            results.unchanged++
            continue
          }
        } catch (apiError: any) {
          console.error(`[CRON] Xendit API error for ${transaction.id}:`, apiError.message)
          results.errors.push(`${transaction.id}: API error - ${apiError.message}`)
          results.unchanged++
          continue
        }

        // 4. Process based on Xendit status
        if (xenditStatus === 'PAID' || xenditStatus === 'SETTLED') {
          // Payment completed - activate!
          console.log(`[CRON] ✅ Payment confirmed for ${transaction.id}, activating...`)

          // Update transaction to SUCCESS
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'SUCCESS',
              paidAt: new Date(),
              notes: `[AUTO-CHECKED: ${new Date().toISOString()}]\nStatus synced from Xendit API. Original webhook may have failed.`,
              metadata: {
                ...(transaction.metadata as any || {}),
                xenditStatusChecked: true,
                xenditStatusCheckedAt: new Date().toISOString(),
                xenditSyncedStatus: xenditStatus
              }
            }
          })

          // Activate membership/product (reuse webhook logic)
          await activatePurchase(transaction)

          results.updated++
          results.paid++
          results.details.push({
            transactionId: transaction.id,
            email: transaction.customerEmail,
            status: 'PAID',
            action: 'Activated'
          })

        } else if (xenditStatus === 'EXPIRED') {
          // Payment expired
          console.log(`[CRON] ⏰ Payment expired for ${transaction.id}`)

          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              expiredAt: new Date(),
              notes: `[AUTO-CHECKED: ${new Date().toISOString()}]\nPayment expired on Xendit.`,
              metadata: {
                ...(transaction.metadata as any || {}),
                xenditStatusChecked: true,
                xenditStatusCheckedAt: new Date().toISOString(),
                xenditSyncedStatus: xenditStatus
              }
            }
          })

          results.updated++
          results.expired++
          results.details.push({
            transactionId: transaction.id,
            email: transaction.customerEmail,
            status: 'EXPIRED',
            action: 'Marked as failed'
          })

        } else if (xenditStatus === 'FAILED') {
          // Payment failed
          console.log(`[CRON] ❌ Payment failed for ${transaction.id}`)

          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              notes: `[AUTO-CHECKED: ${new Date().toISOString()}]\nPayment failed on Xendit.`,
              metadata: {
                ...(transaction.metadata as any || {}),
                xenditStatusChecked: true,
                xenditStatusCheckedAt: new Date().toISOString(),
                xenditSyncedStatus: xenditStatus
              }
            }
          })

          results.updated++
          results.failed++
          results.details.push({
            transactionId: transaction.id,
            email: transaction.customerEmail,
            status: 'FAILED',
            action: 'Marked as failed'
          })

        } else {
          // Still PENDING on Xendit
          console.log(`[CRON] ⏳ Still pending for ${transaction.id} (Xendit: ${xenditStatus})`)
          results.unchanged++
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[CRON] ❌ Error processing ${transaction.id}:`, errorMsg)
        results.errors.push(`${transaction.id}: ${errorMsg}`)
      }
    }

    // 5. Return detailed report
    const report = {
      success: true,
      timestamp: new Date().toISOString(),
      job: 'check-payment-status',
      results: results,
      message: `Checked ${results.total} transactions: ${results.paid} paid, ${results.expired} expired, ${results.failed} failed, ${results.unchanged} unchanged`
    }

    console.log('[CRON] ✅ Job completed:', report)

    return NextResponse.json(report, { status: 200 })

  } catch (error) {
    console.error('[CRON] ❌ Error in check-payment-status:', error)
    
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

/**
 * Activate membership/product after payment confirmed
 * Reuses logic from xendit webhook
 */
async function activatePurchase(transaction: any) {
  try {
    const now = new Date()

    // MEMBERSHIP activation
    if (transaction.type === 'MEMBERSHIP' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const membershipId = transaction.membershipId || metadata.membershipId

      if (!membershipId) {
        console.log('[CRON] No membershipId in transaction or metadata, skipping activation')
        return
      }

      // FIX: Update transaction.membershipId if it was null
      if (!transaction.membershipId && membershipId) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { membershipId }
        })
        console.log(`[CRON] Updated transaction.membershipId from metadata: ${membershipId}`)
      }

      // Check if already activated
      const existingUserMembership = await prisma.userMembership.findFirst({
        where: {
          userId: transaction.userId,
          transactionId: transaction.id,
        },
      })

      if (existingUserMembership) {
        console.log('[CRON] UserMembership already exists, updating to active')
        await prisma.userMembership.update({
          where: { id: existingUserMembership.id },
          data: {
            status: 'ACTIVE',
            isActive: true,
            activatedAt: now,
          },
        })
        return
      }

      // Get membership details (only basic info and duration)
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId },
        select: {
          id: true,
          duration: true,
          name: true
        }
      })

      if (!membership) {
        console.error('[CRON] Membership not found:', membershipId)
        return
      }

      // Calculate end date
      let endDate = new Date(now)
      switch (membership.duration) {
        case 'ONE_MONTH':
          endDate.setMonth(endDate.getMonth() + 1)
          break
        case 'THREE_MONTHS':
          endDate.setMonth(endDate.getMonth() + 3)
          break
        case 'SIX_MONTHS':
          endDate.setMonth(endDate.getMonth() + 6)
          break
        case 'TWELVE_MONTHS':
          endDate.setFullYear(endDate.getFullYear() + 1)
          break
        case 'LIFETIME':
          endDate.setFullYear(endDate.getFullYear() + 100)
          break
      }

      // Create UserMembership
      await prisma.userMembership.create({
        data: {
          userId: transaction.userId,
          membershipId: membershipId,
          status: 'ACTIVE',
          isActive: true,
          activatedAt: now,
          startDate: now,
          endDate,
          price: transaction.amount,
          transactionId: transaction.id,
        },
      })

      console.log(`[CRON] ✅ UserMembership created for ${transaction.userId}`)

      // Add to Mailketing list
      if (membership.mailketingListId && membership.autoAddToList) {
        try {
          const listResult = await addUserToMailketingList(
            transaction.user.email,
            membership.mailketingListId,
            {
              name: transaction.user.name,
              phone: transaction.user.phone || transaction.customerPhone || undefined,
              purchaseType: 'membership',
              purchaseItem: membership.name,
              purchaseDate: now,
              purchaseAmount: Number(transaction.amount)
            }
          )

          if (listResult.success) {
            const currentLists = (transaction.user.mailketingLists as string[]) || []
            if (!currentLists.includes(membership.mailketingListId)) {
              await prisma.user.update({
                where: { id: transaction.userId },
                data: {
                  mailketingLists: [...currentLists, membership.mailketingListId]
                }
              })
            }
            console.log('[CRON] ✅ User added to Mailketing list')
          }
        } catch (error) {
          console.error('[CRON] ❌ Mailketing error:', error)
        }
      }

      // Auto-join groups (fetch from junction table)
      const membershipGroups = await prisma.membershipGroup.findMany({
        where: { membershipId },
        select: { groupId: true }
      })
      
      for (const mg of membershipGroups) {
        await prisma.groupMember.upsert({
          where: {
            groupId_userId: {
              groupId: mg.groupId,
              userId: transaction.userId
            }
          },
          update: {},
          create: {
            groupId: mg.groupId,
            userId: transaction.userId,
            role: 'MEMBER'
          }
        }).catch((err) => console.log('[CRON] Group member already exists or error:', err.message))
      }

      // Auto-enroll courses (fetch from junction table)
      const membershipCourses = await prisma.membershipCourse.findMany({
        where: { membershipId },
        select: { courseId: true }
      })
      
      for (const mc of membershipCourses) {
        await prisma.courseEnrollment.upsert({
          where: {
            courseId_userId: {
              courseId: mc.courseId,
              userId: transaction.userId
            }
          },
          update: {},
          create: {
            userId: transaction.userId,
            courseId: mc.courseId
          }
        }).catch((err) => console.log('[CRON] Course enrollment already exists or error:', err.message))
      }

      // Auto-grant products (fetch from junction table)
      const membershipProducts = await prisma.membershipProduct.findMany({
        where: { membershipId },
        select: { productId: true }
      })
      
      for (const mp of membershipProducts) {
        await prisma.userProduct.upsert({
          where: {
            userId_productId: {
              userId: transaction.userId,
              productId: mp.productId
            }
          },
          update: {},
          create: {
            userId: transaction.userId,
            productId: mp.productId,
            transactionId: transaction.id,
            purchaseDate: now,
            price: 0 // Free as part of membership
          }
        }).catch((err) => console.log('[CRON] User product already exists or error:', err.message))
      }

      console.log(`[CRON] ✅ Auto-joined ${membershipGroups.length} groups, ${membershipCourses.length} courses, ${membershipProducts.length} products`)

      // Process revenue distribution
      try {
        const { processRevenueDistribution } = await import('@/lib/revenue-split')
        await processRevenueDistribution({
          amount: Number(transaction.amount),
          type: 'MEMBERSHIP',
          affiliateId: metadata.affiliateId,
          membershipId,
          transactionId: transaction.id
        })
        console.log('[CRON] ✅ Revenue distribution processed')
      } catch (error) {
        console.error('[CRON] ❌ Revenue distribution error:', error)
      }

      // Send success email
      await sendSuccessEmail(transaction, membership.name)
    }

    // COURSE activation
    if (transaction.type === 'COURSE' && transaction.courseId) {
      const existingEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_userId: {
            courseId: transaction.courseId,
            userId: transaction.userId,
          },
        },
      })

      if (!existingEnrollment) {
        await prisma.courseEnrollment.create({
          data: {
            id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId: transaction.userId,
            courseId: transaction.courseId,
            progress: 0,
            transactionId: transaction.id,
            updatedAt: new Date(),
          },
        })
        console.log('[CRON] ✅ Course enrollment created')

        // Add to Mailketing list if configured
        const course = await prisma.course.findUnique({
          where: { id: transaction.courseId }
        })

        if (course && course.mailketingListId && course.autoAddToList) {
          try {
            const listResult = await addUserToMailketingList(
              transaction.user.email,
              course.mailketingListId,
              {
                name: transaction.user.name,
                phone: transaction.user.phone || transaction.customerPhone || undefined,
                purchaseType: 'course',
                purchaseItem: course.title,
                purchaseDate: now,
                purchaseAmount: Number(transaction.amount)
              }
            )

            if (listResult.success) {
              const currentLists = (transaction.user.mailketingLists as string[]) || []
              if (!currentLists.includes(course.mailketingListId)) {
                await prisma.user.update({
                  where: { id: transaction.userId },
                  data: {
                    mailketingLists: [...currentLists, course.mailketingListId]
                  }
                })
              }
            }
          } catch (error) {
            console.error('[CRON] ❌ Mailketing error:', error)
          }
        }

        await sendSuccessEmail(transaction, course?.title || 'Course')
      }
    }

    // PRODUCT activation
    if (transaction.type === 'PRODUCT' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const productId = metadata.productId

      if (productId) {
        const existingPurchase = await prisma.userProduct.findFirst({
          where: {
            userId: transaction.userId,
            productId: productId,
          },
        })

        if (!existingPurchase) {
          await prisma.userProduct.create({
            data: {
              userId: transaction.userId,
              productId: productId,
              transactionId: transaction.id,
              purchaseDate: now,
              price: transaction.amount,
              isActive: true,
            },
          })
          console.log('[CRON] ✅ User product created')

          // Add to Mailketing list if configured
          const product = await prisma.product.findUnique({
            where: { id: productId }
          })

          if (product && product.mailketingListId && product.autoAddToList) {
            try {
              const listResult = await addUserToMailketingList(
                transaction.user.email,
                product.mailketingListId,
                {
                  name: transaction.user.name,
                  phone: transaction.user.phone || transaction.customerPhone || undefined,
                  purchaseType: 'product',
                  purchaseItem: product.name,
                  purchaseDate: now,
                  purchaseAmount: Number(transaction.amount)
                }
              )

              if (listResult.success) {
                const currentLists = (transaction.user.mailketingLists as string[]) || []
                if (!currentLists.includes(product.mailketingListId)) {
                  await prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                      mailketingLists: [...currentLists, product.mailketingListId]
                    }
                  })
                }
              }
            } catch (error) {
              console.error('[CRON] ❌ Mailketing error:', error)
            }
          }

          await sendSuccessEmail(transaction, product?.name || 'Product')
        }
      }
    }

  } catch (error) {
    console.error('[CRON] ❌ Error activating purchase:', error)
    throw error
  }
}

/**
 * Send payment success email
 */
async function sendSuccessEmail(transaction: any, itemName: string) {
  try {
    const emailData = emailTemplates.paymentSuccess({
      userName: transaction.customerName || transaction.user.name || 'Member',
      amount: Number(transaction.amount),
      invoiceNumber: transaction.id,
      paymentMethod: transaction.paymentMethod || 'Online Payment',
      transactionDate: new Date(transaction.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      itemName: itemName
    })

    await mailketing.sendEmail({
      to: transaction.customerEmail || transaction.user.email,
      subject: emailData.subject,
      html: emailData.html,
      tags: ['payment', 'success', 'auto-checked', transaction.type.toLowerCase()]
    })

    console.log('[CRON] ✅ Success email sent to', transaction.customerEmail || transaction.user.email)

    // Send membership activation email if applicable
    if (transaction.type === 'MEMBERSHIP' && transaction.metadata) {
      const metadata = transaction.metadata as any
      const membership = await prisma.membership.findUnique({
        where: { id: metadata.membershipId }
      })

      if (membership) {
        const userMembership = await prisma.userMembership.findFirst({
          where: {
            userId: transaction.userId,
            membershipId: membership.id,
            transactionId: transaction.id
          }
        })

        if (userMembership) {
          const membershipEmailData = emailTemplates.membershipActivation({
            userName: transaction.customerName || transaction.user.name || 'Member',
            membershipName: membership.name,
            membershipDuration: membership.duration || 'Lifetime',
            startDate: new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            endDate: userMembership.endDate 
              ? new Date(userMembership.endDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : null,
            price: Number(transaction.amount),
            invoiceNumber: transaction.id,
            benefitsList: [
              '🎓 Akses ke semua kursus premium',
              '👥 Bergabung dengan komunitas eksklusif',
              '📊 Database buyer & supplier internasional',
              '📄 Template dokumen ekspor lengkap',
              '💬 Konsultasi gratis dengan mentor ahli'
            ]
          })

          await mailketing.sendEmail({
            to: transaction.customerEmail || transaction.user.email,
            subject: membershipEmailData.subject,
            html: membershipEmailData.html,
            tags: ['membership', 'activation', 'auto-checked']
          })

          console.log('[CRON] ✅ Membership activation email sent')
        }
      }
    }

  } catch (error) {
    console.error('[CRON] ❌ Error sending email:', error)
  }
}

// Prevent browser caching
export const dynamic = 'force-dynamic'
export const revalidate = 0
