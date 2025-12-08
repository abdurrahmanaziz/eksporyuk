import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Fetch all broadcasts for affiliate
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const broadcasts = await prisma.affiliateBroadcast.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        template: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ broadcasts })
  } catch (error) {
    console.error('Error fetching broadcasts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new broadcast (draft or schedule)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const { name, subject, body, templateId, targetSegment, scheduledAt, recurring } = await request.json()

    if (!name || !subject || !body) {
      return NextResponse.json({ error: 'Name, subject, and body are required' }, { status: 400 })
    }

    // Validate scheduledAt if provided
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt)
      const now = new Date()
      
      if (scheduledDate <= now) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }
    }

    // Calculate recipients based on segment
    let recipientCount = 0
    const whereClause: any = { affiliateId: affiliate.id, email: { not: null } }

    if (targetSegment) {
      if (targetSegment.status && targetSegment.status.length > 0) {
        whereClause.status = { in: targetSegment.status }
      }
      if (targetSegment.source && targetSegment.source.length > 0) {
        whereClause.source = { in: targetSegment.source }
      }
      if (targetSegment.tags && targetSegment.tags.length > 0) {
        whereClause.tags = { hasSome: targetSegment.tags }
      }
    }

    recipientCount = await prisma.affiliateLead.count({ where: whereClause })

    // Prepare recurring config if scheduling is enabled
    let recurringConfig = null
    if (scheduledAt && recurring?.enabled) {
      recurringConfig = {
        enabled: true,
        frequency: recurring.frequency || 'DAILY', // DAILY, WEEKLY, MONTHLY
        interval: recurring.interval || 1, // Every N days/weeks/months
        timeOfDay: recurring.timeOfDay || '09:00', // HH:mm format
        endDate: recurring.endDate || null, // Optional end date
        daysOfWeek: recurring.daysOfWeek || null // For weekly: [0,1,2,3,4,5,6]
      }
    }

    const broadcast = await prisma.affiliateBroadcast.create({
      data: {
        affiliateId: affiliate.id,
        name,
        subject,
        body,
        templateId: templateId || null,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        targetSegment: targetSegment || null,
        totalRecipients: recipientCount,
        isScheduled: !!scheduledAt,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        recurringConfig: recurringConfig
      },
      include: {
        template: true,
      },
    })

    return NextResponse.json({ broadcast })
  } catch (error) {
    console.error('Error creating broadcast:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
