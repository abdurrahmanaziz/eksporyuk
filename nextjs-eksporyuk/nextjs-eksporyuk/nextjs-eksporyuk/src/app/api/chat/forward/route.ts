import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { originalMessageId, targetRoomId, content, attachment } = await req.json()

    if (!originalMessageId || !targetRoomId) {
      return NextResponse.json({ 
        error: 'Missing originalMessageId or targetRoomId' 
      }, { status: 400 })
    }

    // Get original message
    const originalMessage = await prisma.chatMessage.findUnique({
      where: { id: originalMessageId },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      }
    })

    if (!originalMessage) {
      return NextResponse.json({ error: 'Original message not found' }, { status: 404 })
    }

    // Create forwarded message
    const forwardedMessage = await prisma.chatMessage.create({
      data: {
        content: content || originalMessage.content,
        roomId: targetRoomId,
        senderId: session.user.id,
        type: originalMessage.type,
        attachmentUrl: originalMessage.attachmentUrl,
        attachmentType: originalMessage.attachmentType,
        attachmentSize: originalMessage.attachmentSize,
        attachmentName: originalMessage.attachmentName,
        forwardedFromId: originalMessageId,
        forwardedFromUserId: originalMessage.senderId
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        forwardedFrom: {
          include: {
            sender: {
              select: { id: true, name: true, username: true, avatar: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, message: forwardedMessage })

  } catch (error) {
    console.error('Message forward error:', error)
    return NextResponse.json({ error: 'Failed to forward message' }, { status: 500 })
  }
}