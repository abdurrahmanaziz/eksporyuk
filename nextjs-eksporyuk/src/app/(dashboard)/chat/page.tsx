'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Send, Search, Paperclip, Smile, X, MessageCircle, 
  Image as ImageIcon, Mic, ArrowLeft, Phone, Video, MoreVertical
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import PusherClient from 'pusher-js'

// ============= INTERFACES =============
interface Mentor {
  id: string
  name: string
  username?: string
  avatar?: string
  isOnline: boolean
  role?: string
}

interface ChatRoom {
  id: string
  name: string
  type: 'DIRECT' | 'GROUP' | 'MENTOR' | 'SUPPORT'
  avatar?: string
  lastMessage?: {
    content: string
    createdAt: string
  }
  unreadCount: number
  participants: Array<{
    user: {
      id: string
      name: string
      username?: string
      avatar?: string
      isOnline: boolean
    }
  }>
}

interface Message {
  id: string
  content: string
  senderId: string
  roomId: string
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO'
  createdAt: string
  isRead: boolean
  attachment?: {
    url: string
    type: 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO'
    name: string
    size: number
  }
  replyTo?: {
    id: string
    content: string
    sender: { id: string; name: string }
  }
  sender: {
    id: string
    name: string
    username?: string
    avatar?: string
    isOnline: boolean
  }
}

// ============= MESSAGE BUBBLE =============
function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex mb-3", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
          <AvatarImage src={message.sender?.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-xs font-semibold">
            {message.sender?.name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2.5",
        isOwn 
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md" 
          : "bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 rounded-bl-md"
      )}>
        {!isOwn && (
          <p className="text-xs font-semibold mb-1 text-emerald-600 dark:text-emerald-400">
            {message.sender?.name}
          </p>
        )}
        
        {message.replyTo && (
          <div className={cn(
            "mb-2 p-2 rounded-lg border-l-2 text-sm",
            isOwn ? "bg-blue-400/30 border-blue-300" : "bg-gray-100 dark:bg-gray-600 border-gray-400"
          )}>
            <p className="text-xs opacity-75">{message.replyTo.sender.name}</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}

        {message.type === 'IMAGE' && message.attachment && (
          <img 
            src={message.attachment.url} 
            alt="attachment"
            className="max-w-full rounded-lg mb-2 cursor-pointer"
            onClick={() => window.open(message.attachment!.url, '_blank')}
          />
        )}

        <p className={cn(
          "break-words whitespace-pre-wrap text-sm",
          !isOwn && "text-gray-800 dark:text-gray-100"
        )}>{message.content}</p>

        <p className={cn(
          "text-[10px] mt-1 text-right",
          isOwn ? "text-blue-100" : "text-gray-400"
        )}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ============= MAIN COMPONENT =============
export default function ChatPage() {
  const { data: session } = useSession()
  
  // State
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(true)
  const [mentorFilter, setMentorFilter] = useState<'all' | 'online' | 'unread'>('all')
  const [pusherClient, setPusherClient] = useState<PusherClient | null>(null)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // ============= FETCH DATA =============
  useEffect(() => {
    if (!session?.user?.id) return
    
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const [roomsRes, mentorsRes] = await Promise.all([
          fetch('/api/chat/rooms'),
          fetch('/api/chat/mentors')
        ])
        
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json()
          setRooms(roomsData.rooms || [])
        }
        
        if (mentorsRes.ok) {
          const mentorsData = await mentorsRes.json()
          setMentors(mentorsData || [])
        }
      } catch (error) {
        console.error('Failed to fetch chat data:', error)
        toast.error('Gagal memuat data chat')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [session?.user?.id])

  // ============= FETCH MESSAGES =============
  useEffect(() => {
    if (!activeRoom?.id) return
    
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?roomId=${activeRoom.id}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }
    
    fetchMessages()
  }, [activeRoom?.id])

  // ============= PUSHER SETUP =============
  useEffect(() => {
    if (!session?.user?.id) return

    const setupPusher = async () => {
      try {
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

        if (!pusherKey || !pusherCluster) {
          console.warn('[Chat] Pusher not configured')
          return
        }

        const client = new PusherClient(pusherKey, {
          cluster: pusherCluster,
          forceTLS: true,
          authEndpoint: '/api/pusher/auth'
        })

        setPusherClient(client)

        // Subscribe to user channel for notifications
        const userChannel = client.subscribe(`user-${session.user.id}`)
        
        userChannel.bind('new-message', (data: any) => {
          console.log('[Pusher] New message notification:', data)
          
          // Update room list with new message
          setRooms(prev => prev.map(room => 
            room.id === data.roomId 
              ? { 
                  ...room, 
                  lastMessage: {
                    content: data.content || 'Pesan baru',
                    createdAt: new Date().toISOString()
                  },
                  unreadCount: room.unreadCount + 1
                }
              : room
          ))
        })

      } catch (error) {
        console.error('[Pusher] Setup failed:', error)
      }
    }

    setupPusher()

    return () => {
      if (pusherClient) {
        pusherClient.disconnect()
      }
    }
  }, [session?.user?.id])

  // Subscribe to active room
  useEffect(() => {
    if (!pusherClient || !activeRoom?.id) return

    const channelName = `private-room-${activeRoom.id}`
    const roomChannel = pusherClient.subscribe(channelName)
    
    roomChannel.bind('new-message', (data: any) => {
      console.log('[Pusher] Room message:', data)
      if (data.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev
          return [...prev, data]
        })
      }
    })

    return () => {
      pusherClient.unsubscribe(channelName)
    }
  }, [pusherClient, activeRoom?.id])

  // ============= SELECT ROOM =============
  const selectRoom = async (room: ChatRoom) => {
    setActiveRoom(room)
    setShowMobileSidebar(false)
    
    // Mark as read
    try {
      await fetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id })
      })
      
      setRooms(prev => prev.map(r => 
        r.id === room.id ? { ...r, unreadCount: 0 } : r
      ))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // ============= START CHAT WITH MENTOR =============
  const startChatWithMentor = async (mentorId: string) => {
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: mentorId })
      })
      
      if (res.ok) {
        const data = await res.json()
        const room = data.room
        
        // Add to rooms if not exists
        setRooms(prev => {
          const exists = prev.find(r => r.id === room.id)
          if (exists) return prev
          return [room, ...prev]
        })
        
        selectRoom(room)
      } else {
        toast.error('Gagal memulai chat')
      }
    } catch (error) {
      toast.error('Gagal memulai chat')
    }
  }

  // ============= SEND MESSAGE =============
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || sendingMessage) return
    
    const messageContent = newMessage.trim()
    setNewMessage('')
    setSendingMessage(true)
    
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          content: messageContent,
          type: 'TEXT',
          replyToId: replyingTo?.id
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        setReplyingTo(null)
        scrollToBottom()
        
        // Update room's last message
        setRooms(prev => prev.map(r => 
          r.id === activeRoom.id 
            ? { ...r, lastMessage: { content: messageContent, createdAt: new Date().toISOString() } }
            : r
        ))
      } else {
        toast.error('Gagal mengirim pesan')
        setNewMessage(messageContent)
      }
    } catch (error) {
      toast.error('Gagal mengirim pesan')
      setNewMessage(messageContent)
    } finally {
      setSendingMessage(false)
    }
  }

  // ============= FILE UPLOAD =============
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length || !activeRoom) return
    
    const file = files[0]
    const formData = new FormData()
    formData.append('file', file)
    formData.append('roomId', activeRoom.id)
    
    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      })
      
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        scrollToBottom()
      } else {
        toast.error('Gagal upload file')
      }
    } catch (error) {
      toast.error('Gagal upload file')
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ============= FILTER DATA =============
  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name?.toLowerCase().includes(searchQuery.toLowerCase())
    if (mentorFilter === 'online') return matchesSearch && mentor.isOnline
    return matchesSearch
  })

  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getOtherUser = () => {
    if (!activeRoom || !session?.user?.id) return null
    return activeRoom.participants.find(p => p.user.id !== session.user.id)?.user
  }

  const otherUser = getOtherUser()

  // ============= RENDER =============
  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="h-full flex relative">
        
        {/* ===== LEFT - Chat List (30%) ===== */}
        <aside className={cn(
          "h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0",
          // Mobile: absolute within container, not fixed to viewport
          "absolute inset-y-0 left-0 z-20 transition-transform duration-300",
          showMobileSidebar ? "translate-x-0" : "-translate-x-full",
          // Desktop: static position
          "lg:static lg:translate-x-0",
          // Width
          "w-[85%] sm:w-80 lg:w-[30%] lg:min-w-[280px] lg:max-w-[360px]"
        )}>
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Messages</h1>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari mentor atau pesan..."
                className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 rounded-lg h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Mentor Section */}
          <div className="border-b border-gray-100 dark:border-gray-700">
            <div className="px-4 pt-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Chat Dengan Mentor</h2>
              <span className="text-blue-600 text-xs">Lihat Semua</span>
            </div>
            
            {/* Filter */}
            <div className="px-4 pt-2 flex gap-1.5">
              {(['all', 'online'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setMentorFilter(filter)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    mentorFilter === filter
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {filter === 'all' ? 'Semua' : 'Online'}
                </button>
              ))}
            </div>
            
            {/* Mentor Avatars */}
            <div className="flex gap-3 overflow-x-auto px-4 py-3">
              {loading ? (
                <div className="flex gap-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                  ))}
                </div>
              ) : filteredMentors.length === 0 ? (
                <p className="text-xs text-gray-400">Tidak ada mentor</p>
              ) : (
                filteredMentors.slice(0, 8).map((mentor) => (
                  <button
                    key={mentor.id}
                    onClick={() => startChatWithMentor(mentor.id)}
                    className="flex flex-col items-center gap-1 min-w-[56px] group"
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-white shadow group-hover:scale-105 transition">
                        <AvatarImage src={mentor.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                          {mentor.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full",
                        mentor.isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                    </div>
                    <span className="text-[10px] text-gray-600 truncate w-12 text-center">
                      {mentor.name?.split(' ')[0]}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">Belum ada percakapan</p>
                <p className="text-xs text-gray-400 mt-1">Mulai chat dengan mentor di atas</p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left border-b border-gray-50",
                    activeRoom?.id === room.id && "bg-blue-50"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={room.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-semibold">
                        {room.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {room.participants?.some(p => p.user.isOnline) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{room.name}</h3>
                      {room.lastMessage && (
                        <span className="text-[10px] text-gray-400 ml-2">
                          {formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: false, locale: idLocale })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate pr-2">
                        {room.lastMessage?.content || 'Belum ada pesan'}
                      </p>
                      {room.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ===== RIGHT SIDE - Chat Area (70%) ===== */}
        <main className="flex-1 h-full flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0">
          
          {!activeRoom ? (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-[24px] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Hello, {session?.user?.name?.split(' ')[0] || 'there'}! 👋
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Selamat datang di chat mentor. Tanyakan apapun tentang ekspor, logistik, atau regulasi. Kami siap membantu!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 px-4 py-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileSidebar(true)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg -ml-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={activeRoom.avatar || otherUser?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-semibold">
                        {activeRoom.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">{activeRoom.name}</h2>
                      <p className={cn(
                        "text-xs flex items-center gap-1",
                        otherUser?.isOnline ? "text-green-500" : "text-gray-400"
                      )}>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          otherUser?.isOnline ? "bg-green-500" : "bg-gray-400"
                        )} />
                        {otherUser?.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Video className="w-5 h-5 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow">
                      <MessageCircle className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-gray-500 text-sm">Mulai percakapan dengan {activeRoom.name}</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.senderId === session?.user?.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 p-3 flex-shrink-0">
                {replyingTo && (
                  <div className="mb-2 p-2 bg-blue-50 rounded-lg flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-600">
                        Membalas {replyingTo.sender.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{replyingTo.content}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-blue-100 rounded">
                      <X className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                    <Textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Ketik pesan..."
                      className="resize-none border-0 bg-transparent focus:ring-0 p-0 min-h-[24px] max-h-24 text-sm"
                      rows={1}
                    />
                    
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 hover:bg-gray-200 rounded-lg"
                      >
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 hover:bg-gray-200 rounded-lg"
                      >
                        <Paperclip className="w-5 h-5 text-gray-500" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-200 rounded-lg">
                        <Mic className="w-5 h-5 text-gray-500" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-200 rounded-lg">
                        <Smile className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition shadow-lg flex-shrink-0"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
