import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Fetch single broadcast with logs
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const broadcast = await prisma.affiliateBroadcast.findUnique({
      where: {
        id: params.id,
        affiliateId: affiliate.id,
      },
      include: {
        template: true,
        logs: {
          include: {
            lead: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    })

    if (!broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    return NextResponse.json({ broadcast })
  } catch (error) {
    console.error('Error fetching broadcast:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update broadcast
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if broadcast exists and belongs to affiliate
    const existingBroadcast = await prisma.affiliateBroadcast.findUnique({
      where: {
        id: params.id,
        affiliateId: affiliate.id,
      },
    })

    if (!existingBroadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    // Can't edit sent broadcasts
    if (existingBroadcast.status === 'SENT' || existingBroadcast.status === 'SENDING') {
      return NextResponse.json({ error: 'Cannot edit broadcast that is already sent or sending' }, { status: 400 })
    }

    const { name, subject, body, templateId, targetSegment, scheduledAt } = await request.json()

    // Recalculate recipients if segment changed
    let recipientCount = existingBroadcast.totalRecipients
    if (targetSegment) {
      const whereClause: any = { affiliateId: affiliate.id }
      
      if (targetSegment.status) whereClause.status = targetSegment.status
      if (targetSegment.source) whereClause.source = targetSegment.source
      if (targetSegment.tags && targetSegment.tags.length > 0) {
        whereClause.tags = {
          some: {
            tag: { in: targetSegment.tags }
          }
        }
      }

      recipientCount = await prisma.affiliateLead.count({ where: whereClause })
    }

    const broadcast = await prisma.affiliateBroadcast.update({
      where: { id: params.id },
      data: {
        name: name || existingBroadcast.name,
        subject: subject || existingBroadcast.subject,
        body: body || existingBroadcast.body,
        templateId: templateId !== undefined ? templateId : existingBroadcast.templateId,
        targetSegment: targetSegment !== undefined ? targetSegment : existingBroadcast.targetSegment,
        totalRecipients: recipientCount,
        isScheduled: scheduledAt ? true : existingBroadcast.isScheduled,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : existingBroadcast.scheduledAt,
      },
      include: {
        template: true,
      },
    })

    return NextResponse.json({ broadcast })
  } catch (error) {
    console.error('Error updating broadcast:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete broadcast
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if broadcast exists and belongs to affiliate
    const existingBroadcast = await prisma.affiliateBroadcast.findUnique({
      where: {
        id: params.id,
        affiliateId: affiliate.id,
      },
    })

    if (!existingBroadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    // Can't delete sent broadcasts
    if (existingBroadcast.status === 'SENT' || existingBroadcast.status === 'SENDING') {
      return NextResponse.json({ error: 'Cannot delete broadcast that is already sent or sending' }, { status: 400 })
    }

    await prisma.affiliateBroadcast.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting broadcast:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
