/**
 * CHAT SERVICE (PRD v7.3)
 * Real-time chat system with Pusher integration
 */

import { ChatRoomType } from '@prisma/client'
import { pusherService } from '@/lib/pusher'
import { notificationService } from './notificationService'
import { prisma } from '@/lib/prisma'

export interface CreateChatRoomData {
  type: ChatRoomType
  name?: string
  avatar?: string
  user1Id?: string
  user2Id?: string
  groupId?: string
  participantIds?: string[]
}

export interface SendMessageData {
  roomId: string
  senderId: string
  content: string
  type?: string
  attachmentUrl?: string
  attachmentType?: string
  attachmentSize?: number
  attachmentName?: string
  replyToId?: string
}

class ChatService {
  
  /**
   * Get or create direct chat room between two users
   */
  async getOrCreateDirectRoom(user1Id: string, user2Id: string): Promise<any> {
    try {
      console.log('[ChatService] getOrCreateDirectRoom:', { user1Id, user2Id })
      
      // Check if room already exists (both directions)
      let room = await prisma.chatRoom.findFirst({
        where: {
          type: 'DIRECT',
          OR: [
            { user1Id, user2Id },
            { user1Id: user2Id, user2Id: user1Id }
          ]
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  isOnline: true,
                  lastSeenAt: true
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
      
      console.log('[ChatService] Existing room found:', !!room)
      
      if (!room) {
        console.log('[ChatService] Creating new room...')
        // Create new room
        room = await prisma.chatRoom.create({
          data: {
            type: 'DIRECT',
            user1Id,
            user2Id,
            participants: {
              create: [
                { userId: user1Id },
                { userId: user2Id }
              ]
            }
          },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    isOnline: true,
                    lastSeenAt: true
                  }
                }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        })
        console.log('[ChatService] New room created:', room.id)
      }
      
      // For DIRECT chat, set name from other user's perspective
      // Find the other user (not user1Id who is starting the chat)
      const otherParticipant = room.participants.find(p => p.userId !== user1Id)
      const otherUser = otherParticipant?.user
      
      const result = {
        ...room,
        name: otherUser?.name || 'Chat',
        avatar: otherUser?.avatar || null,
        unreadCount: 0,
        lastMessage: room.messages[0] ? {
          content: room.messages[0].content,
          createdAt: room.messages[0].createdAt
        } : null
      }
      
      console.log('[ChatService] Returning room:', { id: result.id, name: result.name })
      return result
    } catch (error: any) {
      console.error('[ChatService] GetOrCreateDirectRoom error:', error)
      throw error
    }
  }
  
  /**
   * Create group chat room
   */
  async createGroupRoom(data: CreateChatRoomData): Promise<any> {
    try {
      const room = await prisma.chatRoom.create({
        data: {
          type: data.type,
          name: data.name,
          avatar: data.avatar,
          groupId: data.groupId,
          participants: {
            create: data.participantIds?.map(userId => ({ userId })) || []
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  isOnline: true
                }
              }
            }
          }
        }
      })
      
      return room
    } catch (error: any) {
      console.error('[ChatService] CreateGroupRoom error:', error)
      throw error
    }
  }
  
  /**
   * Send message to chat room
   */
  async sendMessage(data: SendMessageData): Promise<any> {
    try {
      // Create message
      const message = await prisma.message.create({
        data: {
          roomId: data.roomId,
          senderId: data.senderId,
          content: data.content,
          type: data.type || 'text',
          attachmentUrl: data.attachmentUrl,
          attachmentType: data.attachmentType,
          attachmentSize: data.attachmentSize,
          attachmentName: data.attachmentName,
          replyToId: data.replyToId,
          isDelivered: true,
          deliveredAt: new Date()
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
      
      // Update room's last message
      await prisma.chatRoom.update({
        where: { id: data.roomId },
        data: {
          lastMessage: data.content.substring(0, 100),
          lastMessageAt: new Date()
        }
      })
      
      // Update unread count for other participants
      await prisma.chatParticipant.updateMany({
        where: {
          roomId: data.roomId,
          userId: { not: data.senderId }
        },
        data: {
          unreadCount: { increment: 1 }
        }
      })
      
      // Get room to broadcast
      const room = await prisma.chatRoom.findUnique({
        where: { id: data.roomId },
        include: {
          participants: true
        }
      })
      
      // Broadcast via Pusher to all participants
      if (room) {
        // Trigger to room channel for real-time chat update
        await pusherService.trigger(`private-room-${data.roomId}`, 'new-message', message)
        
        for (const participant of room.participants) {
          if (participant.userId !== data.senderId) {
            // Send real-time message to user channel for ChatBell icon update
            await pusherService.notifyUser(participant.userId, 'new-message', {
              roomId: data.roomId,
              senderName: message.sender.name,
              content: data.content.substring(0, 50)
            })
            
            // Only send push notification (OneSignal) for mobile/browser
            // Don't save to notification table to avoid cluttering NotificationBell
            try {
              await notificationService.sendPushOnly({
                userId: participant.userId,
                title: `Pesan dari ${message.sender.name}`,
                message: data.content.substring(0, 100),
                link: `/chat?room=${data.roomId}`,
              })
            } catch (e) {
              // Push notification is optional, don't fail if it errors
              console.log('[ChatService] Push notification skipped:', e)
            }
          }
        }
      }
      
      return message
    } catch (error: any) {
      console.error('[ChatService] SendMessage error:', error)
      throw error
    }
  }
  
  /**
   * Get chat room messages with pagination
   */
  async getMessages(roomId: string, limit: number = 50, beforeId?: string): Promise<any[]> {
    try {
      const messages = await prisma.message.findMany({
        where: {
          roomId,
          isDeleted: false,
          ...(beforeId && {
            id: { lt: beforeId }
          })
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
      
      return messages.reverse()
    } catch (error: any) {
      console.error('[ChatService] GetMessages error:', error)
      return []
    }
  }
  
  /**
   * Get user's chat rooms
   */
  async getUserRooms(userId: string): Promise<any[]> {
    try {
      const participants = await prisma.chatParticipant.findMany({
        where: { userId },
        include: {
          room: {
            include: {
              participants: {
                where: {
                  userId: { not: userId }
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      avatar: true,
                      isOnline: true,
                      lastSeenAt: true
                    }
                  }
                }
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  sender: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          room: {
            lastMessageAt: 'desc'
          }
        }
      })
      
      return participants.map(p => {
        // For DIRECT chat, use other user's name as room name
        let roomName = p.room.name
        let roomAvatar = p.room.avatar
        
        if (p.room.type === 'DIRECT' && p.room.participants.length > 0) {
          const otherUser = p.room.participants[0]?.user
          if (otherUser) {
            roomName = otherUser.name
            roomAvatar = otherUser.avatar
          }
        }
        
        // Format lastMessage from messages array
        const lastMsg = p.room.messages[0]
        const lastMessage = lastMsg ? {
          content: lastMsg.content,
          createdAt: lastMsg.createdAt.toISOString()
        } : null
        
        return {
          ...p.room,
          name: roomName,
          avatar: roomAvatar,
          lastMessage,
          unreadCount: p.unreadCount,
          isPinned: p.isPinned,
          isMuted: p.isMuted
        }
      })
    } catch (error: any) {
      console.error('[ChatService] GetUserRooms error:', error)
      return []
    }
  }
  
  /**
   * Mark messages as read
   */
  async markAsRead(roomId: string, userId: string): Promise<{ success: boolean }> {
    try {
      // Mark all messages in room as read for this user
      await prisma.message.updateMany({
        where: {
          roomId,
          senderId: { not: userId },
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
      
      // Reset unread count
      await prisma.chatParticipant.updateMany({
        where: {
          roomId,
          userId
        },
        data: {
          unreadCount: 0,
          lastReadAt: new Date()
        }
      })
      
      // Broadcast read receipt via Pusher
      await pusherService.trigger(`private-room-${roomId}`, 'messages-read', {
        userId,
        readAt: new Date()
      })
      
      return { success: true }
    } catch (error: any) {
      console.error('[ChatService] MarkAsRead error:', error)
      return { success: false }
    }
  }
  
  /**
   * Send typing indicator
   */
  async sendTyping(roomId: string, userId: string, isTyping: boolean): Promise<{ success: boolean }> {
    try {
      // Get user info for userName
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      })
      
      if (!user) {
        return { success: false }
      }
      
      if (isTyping) {
        // Create or update typing indicator
        const expiresAt = new Date(Date.now() + 5000) // 5 seconds
        
        await prisma.typingIndicator.upsert({
          where: {
            roomId_userId: {
              roomId,
              userId
            }
          },
          create: {
            roomId,
            userId,
            isTyping: true,
            expiresAt
          },
          update: {
            isTyping: true,
            expiresAt,
            createdAt: new Date()
          }
        })
      } else {
        // Remove typing indicator
        await prisma.typingIndicator.deleteMany({
          where: {
            roomId,
            userId
          }
        })
      }
      
      // Broadcast typing status via Pusher with userName
      await pusherService.trigger(`private-room-${roomId}`, 'user-typing', {
        userId,
        userName: user.name || 'User',
        isTyping
      })
      
      return { success: true }
    } catch (error: any) {
      console.error('[ChatService] SendTyping error:', error)
      return { success: false }
    }
  }
  
  /**
   * Get typing users in room
   */
  async getTypingUsers(roomId: string): Promise<string[]> {
    try {
      const now = new Date()
      
      // Get active typing indicators
      const indicators = await prisma.typingIndicator.findMany({
        where: {
          roomId,
          isTyping: true,
          expiresAt: { gt: now }
        },
        select: { userId: true }
      })
      
      return indicators.map(i => i.userId)
    } catch (error: any) {
      console.error('[ChatService] GetTypingUsers error:', error)
      return []
    }
  }
  
  /**
   * Delete/Edit message
   */
  async deleteMessage(messageId: string, userId: string): Promise<{ success: boolean }> {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId }
      })
      
      if (!message || message.senderId !== userId) {
        return { success: false }
      }
      
      await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: 'Pesan telah dihapus'
        }
      })
      
      // Broadcast deletion via Pusher
      if (message.roomId) {
        await pusherService.trigger(`private-room-${message.roomId}`, 'message-deleted', {
          messageId
        })
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('[ChatService] DeleteMessage error:', error)
      return { success: false }
    }
  }
  
  /**
   * Update online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<{ success: boolean }> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline,
          lastSeenAt: new Date()
        }
      })
      
      // Broadcast status to all user's rooms
      const rooms = await this.getUserRooms(userId)
      
      for (const room of rooms) {
        await pusherService.trigger(`private-room-${room.id}`, 'user-status', {
          userId,
          isOnline,
          lastSeenAt: new Date()
        })
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('[ChatService] UpdateOnlineStatus error:', error)
      return { success: false }
    }
  }
  
  /**
   * Get total unread count for user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const result = await prisma.chatParticipant.aggregate({
        where: { userId },
        _sum: {
          unreadCount: true
        }
      })
      
      return result._sum.unreadCount || 0
    } catch (error: any) {
      console.error('[ChatService] GetTotalUnreadCount error:', error)
      return 0
    }
  }
}

export const chatService = new ChatService()
export default chatService
