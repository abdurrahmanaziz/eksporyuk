import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mailketingService } from '@/lib/services/mailketingService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Cron Job API to process scheduled broadcasts
 * Should be called every hour via external cron service (Vercel Cron, cPanel Cron, etc.)
 * 
 * Example cURL:
 * curl -X GET "https://eksporyuk.com/api/cron/scheduled-broadcasts?token=YOUR_SECRET_TOKEN"
 * 
 * Vercel Cron Config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/scheduled-broadcasts?token=YOUR_SECRET_TOKEN",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

export async function GET(request: NextRequest) {
  try {
    // Security: Verify cron token
    const token = request.nextUrl.searchParams.get('token')
    const CRON_SECRET = process.env.CRON_SECRET_TOKEN || 'your-secret-cron-token-here'
    
    if (token !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid cron token' },
        { status: 401 }
      )
    }

    const now = new Date()
    
    // Find all scheduled broadcasts that are ready to send
    const scheduledBroadcasts = await prisma.affiliateBroadcast.findMany({
      where: {
        status: 'SCHEDULED',
        isScheduled: true,
        scheduledAt: {
          lte: now
        }
      },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        template: true
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    if (scheduledBroadcasts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled broadcasts to process',
        processedCount: 0,
        timestamp: now.toISOString()
      })
    }

    const results = []
    
    for (const broadcast of scheduledBroadcasts) {
      try {
        // Check affiliate has enough credits
        const requiredCredits = broadcast.totalRecipients
        
        if (broadcast.affiliate.credits < requiredCredits) {
          // Mark as failed due to insufficient credits
          await prisma.affiliateBroadcast.update({
            where: { id: broadcast.id },
            data: {
              status: 'FAILED',
              failedCount: broadcast.totalRecipients,
              completedAt: new Date()
            }
          })
          
          results.push({
            broadcastId: broadcast.id,
            broadcastName: broadcast.name,
            status: 'failed',
            reason: 'Insufficient credits',
            requiredCredits,
            availableCredits: broadcast.affiliate.credits
          })
          continue
        }

        // Update status to SENDING
        await prisma.affiliateBroadcast.update({
          where: { id: broadcast.id },
          data: {
            status: 'SENDING',
            sentAt: now
          }
        })

        // Deduct credits
        await prisma.affiliateProfile.update({
          where: { id: broadcast.affiliateId },
          data: {
            credits: {
              decrement: requiredCredits
            }
          }
        })

        // Create credit transaction log
        await prisma.pointTransaction.create({
          data: {
            userId: broadcast.affiliate.userId,
            type: 'DEDUCT',
            amount: requiredCredits,
            description: `Broadcast email sent: ${broadcast.name}`,
            reference: `BROADCAST-${broadcast.id}`,
            status: 'COMPLETED'
          }
        })

        // Update broadcast credit used
        await prisma.affiliateBroadcast.update({
          where: { id: broadcast.id },
          data: {
            creditUsed: requiredCredits
          }
        })

        // Get target leads based on segment
        const targetSegment = broadcast.targetSegment as any
        const leads = await prisma.affiliateLead.findMany({
          where: {
            affiliateId: broadcast.affiliateId,
            email: { not: null },
            ...(targetSegment?.status && { status: { in: targetSegment.status } }),
            ...(targetSegment?.source && { source: { in: targetSegment.source } }),
            ...(targetSegment?.tags && { tags: { hasSome: targetSegment.tags } })
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true
          }
        })

        // Create logs for all recipients
        const logPromises = leads.map(lead =>
          prisma.affiliateBroadcastLog.create({
            data: {
              broadcastId: broadcast.id,
              leadId: lead.id,
              status: 'PENDING'
            }
          })
        )
        await Promise.all(logPromises)

        // Send emails in background using setImmediate
        setImmediate(async () => {
          try {
            await mailketingService.sendBroadcast(
              broadcast.id,
              broadcast.subject,
              broadcast.body,
              leads
            )
            
            // Check if this is a recurring broadcast
            if (broadcast.recurringConfig) {
              const recurringConfig = broadcast.recurringConfig as any
              
              if (recurringConfig.enabled && recurringConfig.frequency) {
                // Calculate next scheduled time
                const nextScheduledAt = calculateNextScheduledTime(now, recurringConfig)
                
                // Create a new scheduled broadcast for next occurrence
                await prisma.affiliateBroadcast.create({
                  data: {
                    affiliateId: broadcast.affiliateId,
                    name: broadcast.name,
                    subject: broadcast.subject,
                    body: broadcast.body,
                    templateId: broadcast.templateId,
                    status: 'SCHEDULED',
                    targetSegment: broadcast.targetSegment,
                    totalRecipients: broadcast.totalRecipients,
                    isScheduled: true,
                    scheduledAt: nextScheduledAt,
                    recurringConfig: broadcast.recurringConfig
                  }
                })
              }
            }
          } catch (error) {
            console.error(`Error sending broadcast ${broadcast.id}:`, error)
          }
        })

        results.push({
          broadcastId: broadcast.id,
          broadcastName: broadcast.name,
          status: 'processing',
          recipientCount: leads.length,
          creditsDeducted: requiredCredits
        })

      } catch (error) {
        console.error(`Error processing broadcast ${broadcast.id}:`, error)
        
        results.push({
          broadcastId: broadcast.id,
          broadcastName: broadcast.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledBroadcasts.length} scheduled broadcasts`,
      processedCount: scheduledBroadcasts.length,
      results,
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('Cron job error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled broadcasts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate next scheduled time based on recurring configuration
 */
function calculateNextScheduledTime(currentTime: Date, recurringConfig: any): Date {
  const nextTime = new Date(currentTime)
  
  switch (recurringConfig.frequency) {
    case 'DAILY':
      nextTime.setDate(nextTime.getDate() + (recurringConfig.interval || 1))
      break
      
    case 'WEEKLY':
      nextTime.setDate(nextTime.getDate() + (7 * (recurringConfig.interval || 1)))
      break
      
    case 'MONTHLY':
      nextTime.setMonth(nextTime.getMonth() + (recurringConfig.interval || 1))
      break
      
    default:
      // Default to 1 day
      nextTime.setDate(nextTime.getDate() + 1)
  }
  
  // Apply specific time if configured
  if (recurringConfig.timeOfDay) {
    const [hours, minutes] = recurringConfig.timeOfDay.split(':')
    nextTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  }
  
  // Check end date
  if (recurringConfig.endDate) {
    const endDate = new Date(recurringConfig.endDate)
    if (nextTime > endDate) {
      return endDate // Return end date to stop recurring
    }
  }
  
  return nextTime
}

// Allow OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
