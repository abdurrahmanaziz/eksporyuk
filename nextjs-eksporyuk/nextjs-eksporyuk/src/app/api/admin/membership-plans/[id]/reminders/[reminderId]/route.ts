import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PATCH - Update reminder (partial update)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id, reminderId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Build channels array if channel flags are provided
    let updateData: any = { ...body }
    
    if ('emailEnabled' in body || 'whatsappEnabled' in body || 'pushEnabled' in body || 'inAppEnabled' in body) {
      const channels: string[] = []
      if (body.emailEnabled) channels.push('EMAIL')
      if (body.whatsappEnabled) channels.push('WHATSAPP')
      if (body.pushEnabled) channels.push('PUSH')
      if (body.inAppEnabled) channels.push('IN_APP')
      updateData.channels = channels
    }
    
    const reminder = await prisma.membershipReminder.update({
      where: { id: reminderId },
      data: updateData
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}

// PUT - Update reminder (full update)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id, reminderId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const reminder = await prisma.membershipReminder.update({
      where: { id: reminderId },
      data: body
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}

// DELETE - Delete reminder
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id, reminderId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.membershipReminder.delete({
      where: { id: reminderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
  }
}
