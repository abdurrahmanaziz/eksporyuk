'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, Search, Phone, Video, Paperclip, Smile, Image as ImageIcon, X, Reply, ArrowLeft, Plus, Users, MessageCircle, Mic, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow, format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Pusher from 'pusher-js'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

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
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'GIF'
  attachmentUrl?: string
  attachmentType?: string
  attachmentSize?: number
  attachmentName?: string
  senderId: string
  sender: {
    name: string
    avatar?: string
  }
  createdAt: string
  isRead: boolean
  replyTo?: {
    id: string
    content: string
    sender: {
      name: string
    }
  }
}

const EMOJI_CATEGORIES = {
  'Sering Dipakai': ['😀', '😂', '🥰', '😍', '🤔', '😊', '👍', '❤️', '🔥', '✨', '🎉', '💪'],
  'Wajah': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍'],
  'Gesture': ['👋', '🤚', '✋', '👌', '✌️', '🤞', '🤘', '👍', '👎', '👏', '🙌'],
  'Hati': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍'],
}

export default function ChatPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [messageFilter, setMessageFilter] = useState<'all' | 'online' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [startingChat, setStartingChat] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch mentors
  const fetchMentors = async () => {
    try {
      const res = await fetch('/api/mentors')
      if (res.ok) {
        const data = await res.json()
        setMentors(data.mentors || [])
      }
    } catch (error) {
      console.error('Failed to fetch mentors:', error)
    }
  }

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms || [])
        return data.rooms
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
    return []
  }

  // Start chat with mentor
  const startChatWithMentor = async (mentorId: string) => {
    try {
      setStartingChat(mentorId)
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: mentorId })
      })
      
      if (res.ok) {
        const data = await res.json()
        const fetchedRooms = await fetchRooms()
        const newRoom = fetchedRooms.find((r: ChatRoom) => r.id === data.roomId)
        if (newRoom) {
          setActiveRoom(newRoom)
        }
      }
    } catch (error) {
      console.error('Failed to start chat:', error)
    } finally {
      setStartingChat(null)
    }
  }

  // Fetch messages
  const fetchMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?roomId=${roomId}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        scrollToBottom()
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          content: newMessage,
          type: 'TEXT',
          replyToId: replyingTo?.id || null,
        }),
      })

      if (res.ok) {
        setNewMessage('')
        setReplyingTo(null)
        inputRef.current?.focus()
      }
    } catch (error) {
      toast.error('Gagal mengirim pesan')
    }
  }

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeRoom) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      return
    }

    setPendingFile(file)
    uploadFile(file)
  }

  // Upload file
  const uploadFile = async (file: File) => {
    if (!activeRoom) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomId', activeRoom.id)
      if (replyingTo?.id) {
        formData.append('replyToId', replyingTo.id)
      }

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        setReplyingTo(null)
        toast.success('File berhasil dikirim')
      } else {
        const error = await res.json()
        toast.error(error.message || 'Gagal mengirim file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Gagal mengirim file')
    } finally {
      setUploading(false)
      setPendingFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle reply
  const handleReply = (message: Message) => {
    setReplyingTo(message)
    inputRef.current?.focus()
  }

  // Handle typing
  const handleTyping = async (value: string) => {
    setNewMessage(value)
    
    if (!activeRoom || !session?.user?.id) return
    
    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          isTyping: value.length > 0
        })
      })
    } catch (error) {
      console.error('Typing error:', error)
    }
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Get other user in room
  const getOtherUser = (room: ChatRoom) => {
    if (room.type === 'DIRECT' || room.type === 'MENTOR') {
      return room.participants.find(p => p.user.id !== session?.user?.id)?.user
    }
    return null
  }

  // Format message time
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return format(date, 'HH:mm')
    } else if (diffDays === 1) {
      return 'Kemarin'
    } else {
      return format(date, 'dd/MM/yy')
    }
  }

  // Render message content based on type
  const renderMessageContent = (message: Message, isOwn: boolean) => {
    const messageType = message.type?.toUpperCase() || 'TEXT'
    
    switch (messageType) {
      case 'IMAGE':
        return (
          <div className="space-y-2">
            <img
              src={message.attachmentUrl || '#'}
              alt="Image"
              className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer"
              onClick={() => window.open(message.attachmentUrl, '_blank')}
            />
            {message.content && message.content !== 'Image' && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        )
      case 'VIDEO':
        return (
          <div className="space-y-2">
            <video
              src={message.attachmentUrl || '#'}
              controls
              className="max-w-xs max-h-64 rounded-lg"
              preload="metadata"
            />
            {message.content && message.content !== 'Video' && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        )
      case 'FILE':
        const fileName = message.attachmentName || message.content || 'File'
        return (
          <a
            href={message.attachmentUrl || '#'}
            download={fileName}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-colors min-w-[200px]",
              isOwn ? "bg-blue-500 hover:bg-blue-400" : "bg-gray-200 hover:bg-gray-300"
            )}
          >
            <FileText className="w-8 h-8" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{fileName}</p>
              <p className="text-xs opacity-75">Klik untuk download</p>
            </div>
          </a>
        )
      default:
        // Check if text contains URLs for link preview
        const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g
        const hasUrls = urlRegex.test(message.content)
        
        if (hasUrls) {
          return (
            <div className="space-y-2">
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content.split(urlRegex).map((part, index) => {
                  if (part.match(urlRegex)) {
                    return (
                      <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "underline hover:no-underline",
                          isOwn ? "text-blue-200" : "text-blue-600"
                        )}
                      >
                        {part}
                      </a>
                    )
                  }
                  return part
                })}
              </p>
            </div>
          )
        }
        
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
    }
  }

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = (room.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    
    const otherUser = getOtherUser(room)
    if (messageFilter === 'online') return otherUser?.isOnline === true
    if (messageFilter === 'unread') return room.unreadCount > 0
    return true
  })

  const totalUnread = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
  const onlineMentorsCount = mentors.filter(m => m.isOnline).length

  useEffect(() => {
    if (session?.user?.id) {
      fetchMentors()
      fetchRooms()
    }
  }, [session])

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id)
    }
  }, [activeRoom])

  // Setup Pusher for realtime
  useEffect(() => {
    if (!session?.user?.id || !activeRoom) return

    const pusherKey = '1927d0c82c61c5022f22' // NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = 'ap1' // NEXT_PUBLIC_PUSHER_CLUSTER
    
    if (!pusherKey) {
      console.error('Pusher key not found')
      return
    }

    console.log('Initializing Pusher with key:', pusherKey)

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
      forceTLS: true
    })

    const channelName = `private-room-${activeRoom.id}`
    console.log('Subscribing to channel:', channelName)
    
    const channel = pusher.subscribe(channelName)

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to channel:', channelName)
    })

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Subscription error:', error)
    })

    channel.bind('new-message', (message: Message) => {
      console.log('New message received:', message)
      setMessages(prev => [...prev, message])
      scrollToBottom()
    })

    channel.bind('user-typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      console.log('Typing event:', data)
      if (data.userId === session.user.id) return
      
      if (data.isTyping) {
        setTypingUsers(prev => prev.includes(data.userName) ? prev : [...prev, data.userName])
      } else {
        setTypingUsers(prev => prev.filter(name => name !== data.userName))
      }
    })

    pusher.connection.bind('connected', () => {
      console.log('Pusher connected successfully')
    })

    pusher.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error)
    })

    return () => {
      console.log('Cleaning up Pusher connection')
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
    }
  }, [session?.user?.id, activeRoom?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat pesan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Message List */}
      <div className={cn(
        "w-full md:w-80 xl:w-96 border-r border-gray-200 flex flex-col bg-white",
        activeRoom ? 'hidden md:flex' : 'flex'
      )}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Pesan</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-gray-50 border border-gray-200 rounded-xl"
            />
          </div>
        </div>

        {/* Mentor Section */}
        {mentors.length > 0 && (
          <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50" data-mentor-section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Chat Dengan Mentor
              </h2>
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                {onlineMentorsCount} Online
              </Badge>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {mentors.slice(0, 8).map((mentor) => (
                <button
                  key={mentor.id}
                  onClick={() => startChatWithMentor(mentor.id)}
                  disabled={startingChat === mentor.id}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                >
                  <div className="relative">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={mentor.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                        {mentor.name?.charAt(0)?.toUpperCase() || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    {mentor.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                    {mentor.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {mentor.unreadCount > 9 ? '9+' : mentor.unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-medium truncate max-w-[60px]">
                    {mentor.name?.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex gap-2">
            <Button
              variant={messageFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMessageFilter('all')}
              className="rounded-full text-xs h-8 px-4"
            >
              Semua
            </Button>
            <Button
              variant={messageFilter === 'online' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMessageFilter('online')}
              className="rounded-full text-xs h-8 px-4"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
              Online
            </Button>
            <Button
              variant={messageFilter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMessageFilter('unread')}
              className="rounded-full text-xs h-8 px-4"
            >
              Belum Dibaca {totalUnread > 0 && <Badge className="ml-1.5 h-5 px-1.5">{totalUnread}</Badge>}
            </Button>
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-gray-400">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-sm font-medium text-gray-600">Belum ada percakapan</p>
              <p className="text-xs mt-1 text-gray-400 text-center">
                {messageFilter !== 'all' 
                  ? 'Tidak ada pesan yang cocok dengan filter' 
                  : 'Mulai chat dengan mentor di atas'}
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const otherUser = getOtherUser(room)
              const isActive = activeRoom?.id === room.id

              return (
                <div
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={cn(
                    "mx-2 mb-1 px-3 py-3 rounded-xl cursor-pointer transition-all border border-transparent",
                    isActive ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={otherUser?.avatar || room.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {(room.name || 'U')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {otherUser?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-medium text-sm truncate text-gray-700">
                          {room.name || 'Chat'}
                        </h3>
                        {room.lastMessage && (
                          <span className="text-[11px] text-gray-400">
                            {formatMessageTime(room.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-500 truncate">
                          {room.lastMessage?.content || 'Belum ada pesan'}
                        </p>
                        {room.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {room.unreadCount > 9 ? '9+' : room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white",
        activeRoom ? 'flex' : 'hidden md:flex'
      )}>
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden w-9 h-9 mr-2 rounded-full"
                onClick={() => setActiveRoom(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl py-1 px-2 flex-1"
                onClick={() => {
                  const otherUser = getOtherUser(activeRoom)
                  if (otherUser) {
                    router.push(`/${otherUser.username || otherUser.id}`)
                  }
                }}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={getOtherUser(activeRoom)?.avatar || activeRoom.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {(activeRoom.name || 'U')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm text-gray-900 truncate">
                    {activeRoom.name || 'Chat'}
                  </h2>
                  {typingUsers.length > 0 ? (
                    <p className="text-xs text-blue-600">sedang mengetik...</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {getOtherUser(activeRoom)?.isOnline ? 'Online' : 'Offline'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                  <Video className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.senderId === session?.user?.id
                const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId

                return (
                  <div
                    key={message.id}
                    className={cn("flex items-end gap-2 group", isOwn ? 'flex-row-reverse' : '')}
                  >
                    {showAvatar && !isOwn ? (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.sender.avatar} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {message.sender.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}

                    <div className="max-w-[70%] flex flex-col relative">
                      {!isOwn && showAvatar && (
                        <span className="text-xs text-gray-600 mb-1 px-1">
                          {message.sender.name}
                        </span>
                      )}

                      <div
                        className={cn(
                          "px-4 py-2 rounded-2xl text-sm relative",
                          isOwn
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        )}
                      >
                        {renderMessageContent(message, isOwn)}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 right-0 flex gap-1 mt-1 mr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 bg-white/90 hover:bg-white shadow-sm"
                          onClick={() => handleReply(message)}
                        >
                          <Reply className="w-3 h-3" />
                        </Button>
                      </div>

                      <span className={cn(
                        "text-xs text-gray-400 mt-1 px-1",
                        isOwn ? 'text-right' : 'text-left'
                      )}>
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                        {isOwn && message.isRead && (
                          <span className="ml-1 text-blue-600">✓✓</span>
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
              
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 pl-10">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-gray-200">
              {replyingTo && (
                <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-700">
                      Replying to {replyingTo.sender.name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {replyingTo.content}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                  onChange={handleFileSelect}
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </Button>

                <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 min-h-[44px] max-h-32">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder={uploading ? "Mengirim file..." : "Tulis pesan..."}
                    disabled={uploading}
                    className="w-full px-4 py-3 bg-transparent border-0 focus:outline-none resize-none text-sm disabled:opacity-50"
                    rows={1}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-4 h-4" />
                </Button>

                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 right-4 bg-white border rounded-xl shadow-lg p-4 w-72 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Emoji</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowEmojiPicker(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Tabs defaultValue="Sering Dipakai">
                    <TabsList className="w-full h-8 grid grid-cols-4 mb-2">
                      <TabsTrigger value="Sering Dipakai" className="text-xs">😀</TabsTrigger>
                      <TabsTrigger value="Wajah" className="text-xs">😊</TabsTrigger>
                      <TabsTrigger value="Gesture" className="text-xs">👋</TabsTrigger>
                      <TabsTrigger value="Hati" className="text-xs">❤️</TabsTrigger>
                    </TabsList>
                    {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                      <TabsContent key={category} value={category} className="mt-0">
                        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                          {emojis.map((emoji, index) => (
                            <button
                              key={index}
                              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                              onClick={() => handleEmojiSelect(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 bg-gradient-to-br from-blue-50/30 to-purple-50/30">
            <div className="text-center max-w-md">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                <MessageCircle className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Selamat datang di Chat!</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Pilih percakapan dari daftar di sebelah kiri atau mulai chat baru dengan mentor untuk memulai diskusi yang menarik.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Scroll to mentor section if it exists
                    const mentorSection = document.querySelector('[data-mentor-section]')
                    if (mentorSection) {
                      mentorSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  <Users className="w-4 h-4" />
                  Chat dengan Mentor
                </Button>
              </div>
              
              {mentors.length > 0 && (
                <div className="mt-8 p-4 bg-white/60 rounded-xl border border-gray-200/50">
                  <p className="text-sm text-gray-600 mb-3">Mentor yang tersedia:</p>
                  <div className="flex justify-center gap-2">
                    {mentors.slice(0, 3).map((mentor) => (
                      <button
                        key={mentor.id}
                        onClick={() => startChatWithMentor(mentor.id)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/80 transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={mentor.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {mentor.name?.charAt(0) || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        {mentor.isOnline && (
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                        <span className="text-xs text-gray-600 font-medium truncate max-w-[60px]">
                          {mentor.name?.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
