'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Send, Search, Paperclip, Smile, X, MessageCircle, 
  Image as ImageIcon, Mic, Download, MoreHorizontal, 
  Upload, ArrowLeft, Menu, Users, ChevronLeft, ArrowRight,
  Phone, Video, MoreVertical, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import PusherClient from 'pusher-js'

// Interfaces
interface Mentor {
  id: string
  name: string
  username?: string
  avatar?: string
  isOnline: boolean
  unreadCount: number
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
  isEdited?: boolean
  editedAt?: Date
  attachment?: {
    url: string
    type: 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO'
    name: string
    size: number
    mimeType: string
    thumbnailUrl?: string
  }
  reactions?: {
    [emoji: string]: {
      count: number
      users: string[]
    }
  }
  replyTo?: {
    id: string
    content: string
    sender: {
      id: string
      name: string
      avatar?: string
    }
  }
  sender: {
    id: string
    name: string
    username?: string
    avatar?: string
    isOnline: boolean
  }
}

// Message Bubble Component
const MessageBubble = ({ message, isOwn, handleReply, handleAddReaction, setShowEmojiPicker, showEmojiPicker }: { 
  message: Message; 
  isOwn: boolean;
  handleReply: (message: Message) => void;
  handleAddReaction: (messageId: string, emoji: string) => void;
  setShowEmojiPicker: (messageId: string | null) => void;
  showEmojiPicker: string | null;
}) => (
  <div className={cn("flex mb-4", isOwn ? "justify-end" : "justify-start")}>
    {!isOwn && (
      <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
        <AvatarImage src={message.sender?.avatar} />
        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-xs font-semibold">
          {message.sender?.name?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
    )}
    
    <div className={cn(
      "max-w-[70%] rounded-2xl px-4 py-2.5 relative group",
      isOwn 
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm" 
        : "bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 rounded-bl-sm"
    )}>
      {!isOwn && (
        <p className="text-xs font-semibold mb-1 text-emerald-600 dark:text-emerald-400">
          {message.sender?.name}
        </p>
      )}
      
      {message.replyTo && (
        <div className={cn(
          "mb-2 p-2 rounded-lg border-l-3",
          isOwn 
            ? "bg-blue-400/30 border-blue-300" 
            : "bg-gray-100 dark:bg-gray-600 border-gray-400"
        )}>
          <p className="text-xs opacity-75">{message.replyTo.sender.name}</p>
          <p className="text-sm truncate">{message.replyTo.content}</p>
        </div>
      )}

      {message.type === 'TEXT' && (
        <p className={cn(
          "break-words whitespace-pre-wrap text-sm leading-relaxed",
          !isOwn && "text-gray-800 dark:text-gray-100"
        )}>{message.content}</p>
      )}

      {message.type === 'IMAGE' && message.attachment && (
        <div className="mb-2">
          <img 
            src={message.attachment.url} 
            alt={message.attachment.name}
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.attachment!.url, '_blank')}
          />
          {message.content && <p className="mt-2 text-sm">{message.content}</p>}
        </div>
      )}

      {message.type === 'VIDEO' && message.attachment && (
        <div className="mb-2">
          <video src={message.attachment.url} controls className="max-w-full rounded-lg" />
          {message.content && <p className="mt-2 text-sm">{message.content}</p>}
        </div>
      )}

      {message.type === 'FILE' && message.attachment && (
        <div className="flex items-center gap-2 mb-2">
          <Download className="h-4 w-4 flex-shrink-0" />
          <a href={message.attachment.url} download={message.attachment.name} className="underline truncate text-sm">
            {message.attachment.name}
          </a>
          <span className="text-xs opacity-75 whitespace-nowrap">
            ({Math.round(message.attachment.size / 1024)} KB)
          </span>
        </div>
      )}

      {message.type === 'AUDIO' && message.attachment && (
        <div className="mb-2">
          <audio src={message.attachment.url} controls className="max-w-full" />
          {message.content && <p className="mt-2 text-sm">{message.content}</p>}
        </div>
      )}

      <div className={cn(
        "flex items-center justify-end mt-1 text-[10px]",
        isOwn ? "text-blue-100" : "text-gray-400"
      )}>
        <span>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.isEdited && <span className="ml-1">(edited)</span>}
        </span>
      </div>

      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(message.reactions).map(([emoji, reaction]) => (
            <button
              key={emoji}
              onClick={() => handleAddReaction(message.id, emoji)}
              className="px-2 py-0.5 rounded-full text-xs bg-white/20 hover:bg-white/30"
            >
              {emoji} {reaction.count}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
)

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
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [showSidebar, setShowSidebar] = useState(true)
  const [mentorFilter, setMentorFilter] = useState<'all' | 'online' | 'unread'>('all')
  const [pusherClient, setPusherClient] = useState<PusherClient | null>(null)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Fetch rooms and mentors
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
          setMentors(mentorsData.mentors || [])
        }
      } catch (error) {
        console.error('Failed to fetch chat data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [session?.user?.id])

  // Fetch messages when room changes
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

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      // On tablet and desktop (>= 640px), always show sidebar
      if (window.innerWidth >= 640) {
        setShowSidebar(true)
      } else {
        // On mobile, show sidebar when no active room
        setShowSidebar(!activeRoom)
      }
    }
    
    // Set initial state
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeRoom])

  // Setup Pusher
  useEffect(() => {
    if (!session?.user?.id) return

    const setupPusher = async () => {
      try {
        const client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          forceTLS: true,
          authEndpoint: '/api/pusher/auth'
        })

        setPusherClient(client)

        const userChannel = client.subscribe(`user-${session.user.id}`)
        
        userChannel.bind('new-message', (data: any) => {
          console.log('[Pusher] User channel - new message notification:', data)
          
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

        userChannel.bind('message-reaction', (data: any) => {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
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

  // Subscribe to active room channel
  useEffect(() => {
    if (!pusherClient || !activeRoom?.id) return

    const channelName = `private-room-${activeRoom.id}`
    const roomChannel = pusherClient.subscribe(channelName)
    
    roomChannel.bind('new-message', (data: any) => {
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

  // Select room
  const selectRoom = async (room: ChatRoom) => {
    setActiveRoom(room)
    // On mobile (< 640px), hide sidebar when selecting room
    if (window.innerWidth < 640) {
      setShowSidebar(false)
    }
    
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

  // Create or get room with mentor
  const createOrGetRoom = async (mentorId: string, mentorName: string) => {
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
      }
    } catch (error) {
      toast.error('Gagal memulai chat')
    }
  }

  // Send message
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

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0 || !activeRoom) return
    
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('roomId', activeRoom.id)
        
        const res = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData
        })
        
        if (res.ok) {
          const data = await res.json()
          setMessages(prev => [...prev, data.message])
        }
      } catch (error) {
        toast.error('Gagal upload file')
      }
    }
  }

  // Handle reply
  const handleReply = (message: Message) => {
    setReplyingTo(message)
    textareaRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  // Handle reaction
  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      })
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  // Filter mentors
  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name?.toLowerCase().includes(searchQuery.toLowerCase())
    if (mentorFilter === 'online') return matchesSearch && mentor.isOnline
    if (mentorFilter === 'unread') return matchesSearch && mentor.unreadCount > 0
    return matchesSearch
  })

  // Filter rooms
  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get other participant info for active room
  const getOtherParticipant = () => {
    if (!activeRoom || !session?.user?.id) return null
    return activeRoom.participants.find(p => p.user.id !== session.user.id)?.user
  }

  const otherUser = getOtherParticipant()

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - 30% on desktop, full on mobile when active */}
      <div className={cn(
        "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 flex-shrink-0",
        // Mobile: full width or hidden
        showSidebar ? "w-full" : "w-0 overflow-hidden",
        // Tablet: 320px fixed
        "sm:w-[320px]",
        // Desktop: 30% width with min/max constraints
        "lg:w-[30%] lg:min-w-[300px] lg:max-w-[400px]"
      )}>
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search mentors or messages..."
              className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 rounded-xl h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Mentor Section */}
        <div className="border-b border-gray-100 dark:border-gray-700">
          <div className="px-5 pt-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chat Dengan Mentor</h2>
            <button className="text-blue-600 text-xs font-medium hover:underline">
              Lihat Semua
            </button>
          </div>
          
          {/* Filter Tabs */}
          <div className="px-5 pt-3 flex gap-2">
            {(['all', 'online', 'unread'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setMentorFilter(filter)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
                  mentorFilter === filter
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                {filter === 'all' ? 'All' : filter === 'online' ? 'Online' : 'Unread'}
              </button>
            ))}
          </div>
          
          {/* Mentor Avatars */}
          <div className="flex gap-4 overflow-x-auto px-5 py-4 scrollbar-hide">
            {filteredMentors.map((mentor) => (
              <button
                key={mentor.id}
                onClick={() => createOrGetRoom(mentor.id, mentor.name)}
                className="flex flex-col items-center gap-2 min-w-[60px] group"
              >
                <div className="relative">
                  <Avatar className="w-14 h-14 border-2 border-white dark:border-gray-700 shadow-md group-hover:scale-105 transition-transform">
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {mentor.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-gray-700 rounded-full",
                    mentor.isOnline ? "bg-green-500" : "bg-gray-400"
                  )} />
                  {mentor.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {mentor.unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-14 text-center">
                  {mentor.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada percakapan</p>
            </div>
          ) : (
            <div>
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className={cn(
                    "w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left",
                    activeRoom?.id === room.id && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={room.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-semibold">
                        {room.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {room.participants.some(p => p.user.isOnline) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {room.name}
                      </h3>
                      {room.lastMessage && (
                        <span className="text-[11px] text-gray-400 flex-shrink-0">
                          {formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: false, locale: idLocale })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate pr-2">
                        {room.lastMessage?.content || 'No messages yet'}
                      </p>
                      {room.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area - 70% on desktop */}
      <div className={cn(
        "flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0",
        // On mobile, show full width when sidebar is hidden
        !showSidebar ? "w-full" : "hidden sm:flex",
        // Desktop: takes remaining 70%
        "lg:flex lg:w-[70%]"
      )}>
        {!activeRoom ? (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Hello, {session?.user?.name?.split(' ')[0] || 'there'}! 👋
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Welcome to the mentor chat. Ask any questions about exports, logistics, or regulations. We're here to help!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
                  <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </button>
                  <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Video className="w-5 h-5 text-gray-500" />
                  </button>
                  <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Hello, {session?.user?.name?.split(' ')[0]}! 👋
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
                    Welcome to the mentor chat. Ask any questions about exports, logistics, or regulations. We're here to help!
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.senderId === session?.user?.id}
                      handleReply={handleReply}
                      handleAddReaction={handleAddReaction}
                      setShowEmojiPicker={setShowEmojiPicker}
                      showEmojiPicker={showEmojiPicker}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              {replyingTo && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Replying to {replyingTo.sender.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {replyingTo.content}
                    </p>
                  </div>
                  <button onClick={cancelReply} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded">
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
                    placeholder="Type your message here..."
                    className="resize-none border-0 bg-transparent focus:ring-0 p-0 min-h-[24px] max-h-32 text-sm"
                    rows={1}
                  />
                  
                  {/* Action Icons */}
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files) handleFileUpload(Array.from(e.target.files))
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Image"
                    >
                      <ImageIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Video"
                    >
                      <Video className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Attachment"
                    >
                      <Paperclip className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Voice"
                    >
                      <Mic className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Emoji"
                    >
                      <Smile className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors shadow-lg"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
