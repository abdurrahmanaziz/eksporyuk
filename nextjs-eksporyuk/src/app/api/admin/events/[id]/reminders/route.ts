import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch reminders for event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reminders = await prisma.eventReminder.findMany({
      where: { eventId: id },
      orderBy: { sequenceOrder: 'asc' }
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Error fetching event reminders:', error)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

// POST - Create new event reminder
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Build channels array from enabled flags
    const channels: string[] = []
    if (body.emailEnabled) channels.push('EMAIL')
    if (body.whatsappEnabled) channels.push('WHATSAPP')
    if (body.pushEnabled) channels.push('PUSH')
    if (body.inAppEnabled) channels.push('IN_APP')
    
    const reminder = await prisma.eventReminder.create({
      data: {
        eventId: id,
        title: body.title,
        description: body.description || null,
        triggerType: body.triggerType || 'BEFORE_EXPIRY',
        delayAmount: body.delayAmount || 1,
        delayUnit: body.delayUnit || 'days',
        
        // Channels
        channels: channels,
        emailEnabled: body.emailEnabled || false,
        whatsappEnabled: body.whatsappEnabled || false,
        pushEnabled: body.pushEnabled || false,
        inAppEnabled: body.inAppEnabled || false,
        
        // Email content
        emailSubject: body.emailSubject || null,
        emailBody: body.emailBody || null,
        emailCTA: body.emailCTA || null,
        emailCTALink: body.emailCTALink || null,
        
        // WhatsApp content
        whatsappMessage: body.whatsappMessage || null,
        whatsappCTA: body.whatsappCTA || null,
        whatsappCTALink: body.whatsappCTALink || null,
        
        // Push content
        pushTitle: body.pushTitle || null,
        pushBody: body.pushBody || null,
        pushIcon: body.pushIcon || null,
        pushClickAction: body.pushClickAction || null,
        
        // In-App content
        inAppTitle: body.inAppTitle || null,
        inAppBody: body.inAppBody || null,
        inAppLink: body.inAppLink || null,
        
        // Advanced settings
        preferredTime: body.preferredTime || '09:00',
        timezone: body.timezone || 'Asia/Jakarta',
        daysOfWeek: body.daysOfWeek || [1, 2, 3, 4, 5],
        avoidWeekends: body.avoidWeekends || false,
        conditions: body.conditions || {},
        stopIfCondition: body.stopIfCondition || {},
        stopOnAction: body.stopOnAction || false,
        sequenceOrder: body.sequenceOrder || 0,
        
        isActive: body.isActive ?? true,
      }
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error('Error creating event reminder:', error)
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
  }
}
