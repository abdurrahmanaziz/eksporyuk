import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/messages/[userId] - Get messages with specific user
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // First, try to find a chat room between these two users
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          {
            participants: {
              some: {
                userId: session.user.id
              }
            }
          },
          {
            participants: {
              some: {
                userId: params.userId
              }
            }
          }
        ]
      },
      include: {
        participants: true
      }
    })

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          // Room-based messages
          chatRoom ? {
            roomId: chatRoom.id
          } : {},
          // Direct messages (fallback for old system)
          {
            OR: [
              {
                senderId: session.user.id,
                receiverId: params.userId
              },
              {
                senderId: params.userId,
                receiverId: session.user.id
              }
            ]
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Mark received messages as read
    if (chatRoom) {
      await prisma.message.updateMany({
        where: {
          roomId: chatRoom.id,
          senderId: params.userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    } else {
      await prisma.message.updateMany({
        where: {
          senderId: params.userId,
          receiverId: session.user.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    }

    const total = await prisma.message.count({
      where: {
        OR: [
          chatRoom ? { roomId: chatRoom.id } : {},
          {
            OR: [
              {
                senderId: session.user.id,
                receiverId: params.userId
              },
              {
                senderId: params.userId,
                receiverId: session.user.id
              }
            ]
          }
        ]
      }
    })

    return NextResponse.json({
      messages: messages.reverse(), // Reverse untuk tampilkan dari atas ke bawah
      total,
      hasMore: offset + messages.length < total
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// DELETE /api/messages/[userId] - Delete conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.message.deleteMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: params.userId
          },
          {
            senderId: params.userId,
            receiverId: session.user.id
          }
        ]
      }
    })

    return NextResponse.json({ message: 'Conversation deleted' })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
