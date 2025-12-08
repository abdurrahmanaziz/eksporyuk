'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageSquare, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import Pusher from 'pusher-js'

interface ChatRoom {
  id: string
  name: string
  type: string
  avatar?: string
  lastMessage?: string | { content: string; createdAt: string } | null
  lastMessageAt?: string
  unreadCount: number
  participants: Array<{
    user: {
      id: string
      name: string
      avatar?: string
    }
  }>
}

export default function ChatBell() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  const router = useRouter()
  const { data: session } = useSession()

  // Load sound preference from localStorage
  useEffect(() => {
    const savedSoundPref = localStorage.getItem('chatSoundEnabled')
    if (savedSoundPref !== null) {
      setSoundEnabled(savedSoundPref === 'true')
    }
  }, [])

  // Play chat notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      
      // Reuse or create audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      }
      
      const audioCtx = audioContextRef.current
      if (audioCtx.state === 'suspended') {
        audioCtx.resume()
      }
      
      const now = audioCtx.currentTime
      
      // Chat message sound - different from notification bell
      // Two quick ascending tones
      const osc1 = audioCtx.createOscillator()
      const gain1 = audioCtx.createGain()
      osc1.connect(gain1)
      gain1.connect(audioCtx.destination)
      osc1.frequency.setValueAtTime(600, now)
      osc1.type = 'sine'
      gain1.gain.setValueAtTime(0, now)
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.02)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc1.start(now)
      osc1.stop(now + 0.15)
      
      // Second tone - higher pitch
      const osc2 = audioCtx.createOscillator()
      const gain2 = audioCtx.createGain()
      osc2.connect(gain2)
      gain2.connect(audioCtx.destination)
      osc2.frequency.setValueAtTime(900, now + 0.08)
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0, now + 0.08)
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
      osc2.start(now + 0.08)
      osc2.stop(now + 0.25)
      
    } catch (error) {
      console.log('Chat sound error:', error)
    }
  }, [soundEnabled])

  // Toggle sound and save preference
  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('chatSoundEnabled', String(newValue))
    
    // Play test sound when enabling
    if (newValue) {
      playNotificationSound()
    }
  }

  // Fetch chat rooms with unread counts
  const fetchChatRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      if (res.ok) {
        const data = await res.json()
        setChatRooms(data.rooms || [])
        setTotalUnread(data.totalUnread || 0)
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error)
    }
  }, [])

  useEffect(() => {
    fetchChatRooms()

    // Setup Pusher real-time updates
    if (session?.user?.id && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PUSHER_KEY) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      })

      const channel = pusher.subscribe(`user-${session.user.id}`)
      
      // Listen for new messages
      channel.bind('new-message', (data: { roomId: string; senderName: string; content: string }) => {
        // Play notification sound
        playNotificationSound()
        
        // Increment unread count
        setTotalUnread(prev => prev + 1)
        
        // Update room's last message
        setChatRooms(prev => {
          const updated = prev.map(room => {
            if (room.id === data.roomId) {
              return {
                ...room,
                lastMessage: data.content,
                lastMessageAt: new Date().toISOString(),
                unreadCount: room.unreadCount + 1
              }
            }
            return room
          })
          // Sort by lastMessageAt
          return updated.sort((a, b) => {
            if (!a.lastMessageAt) return 1
            if (!b.lastMessageAt) return -1
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          })
        })
      })

      // Listen for message read
      channel.bind('message-read', (data: { roomId: string; count: number }) => {
        setTotalUnread(prev => Math.max(0, prev - data.count))
        setChatRooms(prev => prev.map(room => {
          if (room.id === data.roomId) {
            return { ...room, unreadCount: 0 }
          }
          return room
        }))
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
      }
    }
  }, [session?.user?.id, fetchChatRooms, playNotificationSound])

  // Handle chat room click
  const handleChatClick = (roomId: string) => {
    setIsOpen(false)
    router.push(`/chat?room=${roomId}`)
  }

  // Get other user in direct chat
  const getOtherUser = (room: ChatRoom) => {
    if (room.type !== 'DIRECT') return null
    return room.participants.find(p => p.user.id !== session?.user?.id)?.user
  }

  // Get display name for room
  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.type === 'DIRECT') {
      const otherUser = getOtherUser(room)
      return otherUser?.name || room.name || 'Chat'
    }
    return room.name || 'Group Chat'
  }

  // Get avatar for room
  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'DIRECT') {
      const otherUser = getOtherUser(room)
      return otherUser?.avatar
    }
    return room.avatar
  }

  // Get last message text
  const getLastMessageText = (room: ChatRoom): string => {
    if (!room.lastMessage) return 'Mulai percakapan...'
    if (typeof room.lastMessage === 'string') return room.lastMessage
    if (typeof room.lastMessage === 'object' && room.lastMessage.content) {
      return room.lastMessage.content
    }
    return 'Mulai percakapan...'
  }

  // Rooms with unread messages first
  const sortedRooms = [...chatRooms].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1
    if (!a.lastMessageAt) return 1
    if (!b.lastMessageAt) return -1
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  }).slice(0, 5)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Messages"
        >
          <MessageSquare className="w-5 h-5 text-blue-600" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Pesan</h3>
            <button
              onClick={toggleSound}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          {totalUnread > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalUnread} belum dibaca
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          {sortedRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Tidak ada pesan</p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedRooms.map((room) => {
                const displayName = getRoomDisplayName(room)
                const avatar = getRoomAvatar(room)
                
                return (
                  <div
                    key={room.id}
                    onClick={() => handleChatClick(room.id)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      room.unreadCount > 0 ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {displayName[0]?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-medium truncate ${
                            room.unreadCount > 0 ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {displayName}
                          </h4>
                          {room.lastMessageAt && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatDistanceToNow(new Date(room.lastMessageAt), {
                                addSuffix: false,
                                locale: idLocale,
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={`text-sm truncate ${
                            room.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                          }`}>
                            {getLastMessageText(room)}
                          </p>
                          {room.unreadCount > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="h-5 min-w-5 flex items-center justify-center p-0 text-xs flex-shrink-0"
                            >
                              {room.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              router.push('/chat')
              setIsOpen(false)
            }}
            className="w-full text-sm"
          >
            Lihat Semua Pesan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
