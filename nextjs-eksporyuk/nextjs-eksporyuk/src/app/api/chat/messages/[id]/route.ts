/**
 * DELETE /api/chat/messages/[id]
 * Delete a message
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { pusherService } from '@/lib/pusher'
import fs from 'fs'
import path from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: messageId } = await params

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        room: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if user is the sender
    if (message.senderId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 })
    }

    // Delete attachment file if exists
    if (message.attachmentUrl) {
      try {
        const filePath = path.join(process.cwd(), 'public', message.attachmentUrl)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (e) {
        console.error('Error deleting file:', e)
        // Continue even if file deletion fails
      }
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId }
    })

    // Notify room participants via Pusher
    try {
      if (message.roomId) {
        await pusherService.trigger(`private-room-${message.roomId}`, 'message-deleted', {
          messageId
        })
      }
    } catch (e) {
      console.error('Pusher error:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted'
    })
  } catch (error: any) {
    console.error('[API] Delete message error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
