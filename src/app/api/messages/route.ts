import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/messages - Get conversations list
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all' // 'all', 'unread', 'archived'

    console.log('Fetching messages for user:', session.user.id)

    // Get archived conversation IDs for current user
    const archivedConversations = await prisma.archivedConversation.findMany({
      where: { userId: session.user.id },
      select: { partnerId: true }
    })
    const archivedPartnerIds = archivedConversations.map(ac => ac.partnerId)

    // Get all users that have conversations with current user
    // Support both direct messages and room-based chats (including groups)
    const allMessages = await prisma.message.findMany({
      where: {
        OR: [
          // Direct messages without room
          { senderId: session.user.id, receiverId: { not: null } },
          { receiverId: session.user.id, senderId: { not: null } },
          // Room-based messages where user is participant (any type: DIRECT, GROUP, etc)
          {
            roomId: { not: null },
            room: {
              participants: {
                some: {
                  userId: session.user.id
                }
              }
            }
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
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        },
        room: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    role: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Group messages by conversation partner or room
    const conversationMap = new Map()
    
    for (const message of allMessages) {
      let conversationKey: string
      let conversationData: any
      
      // For room-based chats
      if (message.roomId && message.room) {
        // Use roomId as key for group chats
        if (message.room.type === 'GROUP') {
          conversationKey = `room_${message.roomId}`
          
          if (!conversationMap.has(conversationKey)) {
            // Count unread messages in this room
            const unreadCount = allMessages.filter(m => 
              m.roomId === message.roomId &&
              m.senderId !== session.user.id &&
              !m.isRead
            ).length
            
            conversationData = {
              id: message.roomId,
              name: message.room.name || 'Group Chat',
              email: `${message.room.participants.length} members`,
              image: null, // Groups don't have avatar yet
              role: 'GROUP',
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              lastSenderId: message.senderId,
              unreadCount,
              roomId: message.roomId,
              isGroup: true
            }
            conversationMap.set(conversationKey, conversationData)
          }
        } else {
          // DIRECT room - find the other participant
          const otherParticipant = message.room.participants.find(
            p => p.userId !== session.user.id
          )
          if (otherParticipant) {
            conversationKey = otherParticipant.userId
            
            if (!conversationMap.has(conversationKey)) {
              const unreadCount = allMessages.filter(m => {
                if (m.roomId === message.roomId) {
                  return m.senderId === otherParticipant.userId && !m.isRead
                }
                return false
              }).length
              
              conversationData = {
                id: otherParticipant.userId,
                name: otherParticipant.user.name,
                email: otherParticipant.user.email,
                image: otherParticipant.user.avatar,
                role: otherParticipant.user.role,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                lastSenderId: message.senderId,
                unreadCount,
                roomId: message.roomId
              }
              conversationMap.set(conversationKey, conversationData)
            }
          }
        }
      } 
      // For direct messages (old system without room)
      else if (message.receiverId) {
        conversationKey = message.senderId === session.user.id 
          ? message.receiverId 
          : message.senderId
        
        if (!conversationMap.has(conversationKey)) {
          const partner = message.senderId === session.user.id 
            ? message.receiver 
            : message.sender
          
          const unreadCount = allMessages.filter(m => 
            !m.roomId &&
            m.senderId === conversationKey && 
            m.receiverId === session.user.id && 
            !m.isRead
          ).length
          
          conversationData = {
            id: partner.id,
            name: partner.name,
            email: partner.email,
            image: partner.avatar,
            role: partner.role,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            lastSenderId: message.senderId,
            unreadCount
          }
          conversationMap.set(conversationKey, conversationData)
        }
      }
    }
    
    const conversations = Array.from(conversationMap.values())

    console.log('Total messages found:', allMessages.length)
    console.log('Total conversations:', conversations.length)
    console.log('Conversations:', conversations.map(c => ({ name: c.name, isGroup: c.isGroup, roomId: c.roomId })))

    // Filter conversations based on filter type
    let filteredConversations = conversations

    if (filter === 'archived') {
      // Show only archived conversations
      filteredConversations = conversations.filter(conv => 
        archivedPartnerIds.includes(conv.id)
      )
    } else {
      // For 'all' and 'unread', exclude archived conversations
      filteredConversations = conversations.filter(conv => 
        !archivedPartnerIds.includes(conv.id)
      )
      
      // Further filter for unread
      if (filter === 'unread') {
        filteredConversations = filteredConversations.filter(conv => 
          conv.unreadCount > 0
        )
      }
    }

    return NextResponse.json({ conversations: filteredConversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverId, content } = await req.json()

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    // Tidak bisa kirim message ke diri sendiri
    if (session.user.id === receiverId) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      )
    }

    // Cek apakah receiver ada
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Buat message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim()
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
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    // Buat notifikasi untuk receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        title: 'New Message',
        message: `${session.user.name} sent you a message`,
        link: `/messages/${session.user.id}`
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
