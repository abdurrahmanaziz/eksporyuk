import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/affiliate/broadcast/[id]/schedule
 * Schedule a broadcast for future sending
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, credits: true }
    })

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      )
    }

    const broadcastId = params.id
    const body = await request.json()
    
    const { scheduledAt, recurring } = body

    // Validate scheduledAt is in the future
    const scheduledDate = new Date(scheduledAt)
    const now = new Date()
    
    if (scheduledDate <= now) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Get the broadcast
    const broadcast = await prisma.affiliateBroadcast.findUnique({
      where: { id: broadcastId }
    })

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (broadcast.affiliateId !== affiliate.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Only DRAFT broadcasts can be scheduled
    if (broadcast.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft broadcasts can be scheduled' },
        { status: 400 }
      )
    }

    // Check if affiliate has enough credits
    if (affiliate.credits < broadcast.totalRecipients) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: broadcast.totalRecipients,
          available: affiliate.credits
        },
        { status: 400 }
      )
    }

    // Prepare recurring config if provided
    let recurringConfig = null
    if (recurring?.enabled) {
      recurringConfig = {
        enabled: true,
        frequency: recurring.frequency || 'DAILY', // DAILY, WEEKLY, MONTHLY
        interval: recurring.interval || 1, // Every N days/weeks/months
        timeOfDay: recurring.timeOfDay || '09:00', // HH:mm format
        endDate: recurring.endDate || null, // Optional end date
        daysOfWeek: recurring.daysOfWeek || null // For weekly: [0,1,2,3,4,5,6]
      }
    }

    // Update broadcast
    const updatedBroadcast = await prisma.affiliateBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'SCHEDULED',
        isScheduled: true,
        scheduledAt: scheduledDate,
        recurringConfig: recurringConfig
      },
      include: {
        template: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Broadcast scheduled successfully',
      broadcast: {
        id: updatedBroadcast.id,
        name: updatedBroadcast.name,
        status: updatedBroadcast.status,
        scheduledAt: updatedBroadcast.scheduledAt,
        recurringConfig: updatedBroadcast.recurringConfig,
        totalRecipients: updatedBroadcast.totalRecipients
      }
    })

  } catch (error) {
    console.error('Schedule broadcast error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to schedule broadcast',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/affiliate/broadcast/[id]/schedule
 * Cancel a scheduled broadcast
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      )
    }

    const broadcastId = params.id

    // Get the broadcast
    const broadcast = await prisma.affiliateBroadcast.findUnique({
      where: { id: broadcastId }
    })

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (broadcast.affiliateId !== affiliate.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Only SCHEDULED broadcasts can be cancelled
    if (broadcast.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Only scheduled broadcasts can be cancelled' },
        { status: 400 }
      )
    }

    // Cancel schedule by reverting to DRAFT
    const updatedBroadcast = await prisma.affiliateBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'DRAFT',
        isScheduled: false,
        scheduledAt: null,
        recurringConfig: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Schedule cancelled successfully',
      broadcast: {
        id: updatedBroadcast.id,
        name: updatedBroadcast.name,
        status: updatedBroadcast.status
      }
    })

  } catch (error) {
    console.error('Cancel schedule error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to cancel schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
