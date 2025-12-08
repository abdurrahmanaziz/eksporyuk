import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Helper function to check course ownership for mentor
async function checkCourseAccess(userId: string, userRole: string, courseId: string) {
  if (userRole === 'ADMIN') return { allowed: true }
  
  const mentorProfile = await prisma.mentor.findUnique({
    where: { userId }
  })
  
  if (!mentorProfile) return { allowed: false }
  
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { mentorId: true }
  })
  
  if (!course) return { allowed: false }
  
  return { allowed: course.mentorId === mentorProfile.id }
}

// PATCH - Update course reminder (partial update)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id: courseId, reminderId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only edit your own course reminders' }, { status: 403 })
      }
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
    
    const reminder = await prisma.courseReminder.update({
      where: { id: reminderId },
      data: updateData
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error updating course reminder:', error)
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}

// PUT - Update course reminder (full update)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id: courseId, reminderId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only edit your own course reminders' }, { status: 403 })
      }
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
    
    const reminder = await prisma.courseReminder.update({
      where: { id: reminderId },
      data: updateData
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error updating course reminder:', error)
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}

// DELETE - Delete course reminder
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id: courseId, reminderId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only delete your own course reminders' }, { status: 403 })
      }
    }

    await prisma.courseReminder.delete({
      where: { id: reminderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course reminder:', error)
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
  }
}
