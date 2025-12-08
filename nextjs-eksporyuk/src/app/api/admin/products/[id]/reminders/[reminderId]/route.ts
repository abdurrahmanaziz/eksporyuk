import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// PATCH - Update product reminder (partial update)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { reminderId } = await params
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
    
    const reminder = await prisma.productReminder.update({
      where: { id: reminderId },
      data: updateData
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error updating product reminder:', error)
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}

// PUT - Update product reminder (full update)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { reminderId } = await params
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
    
    const reminder = await prisma.productReminder.update({
      where: { id: reminderId },
      data: updateData
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error updating product reminder:', error)
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}

// DELETE - Delete product reminder
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { reminderId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.productReminder.delete({
      where: { id: reminderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product reminder:', error)
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
  }
}
