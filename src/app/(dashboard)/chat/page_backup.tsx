'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Send, Search, Paperclip, Smile, X, MessageCircle, 
  Image as ImageIcon, Mic, Download, MoreHorizontal, 
  Upload, ArrowLeft, Menu, Users, ChevronLeft, ArrowRight,
  Phone, Video, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

// Message Component
const MessageBubble = ({ message, isOwn, handleReply, handleAddReaction, setShowEmojiPicker, showEmojiPicker }: { 
  message: Message; 
  isOwn: boolean;
  handleReply: (message: Message) => void;
  handleAddReaction: (messageId: string, emoji: string) => void;
  setShowEmojiPicker: (messageId: string | null) => void;
  showEmojiPicker: string | null;
}) => (
  <div className={cn("flex mb-4", isOwn ? "justify-end" : "justify-start")}>
    {/* Avatar for other users */}
    {!isOwn && (
      <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
        <AvatarImage src={message.sender?.avatar} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
          {message.sender?.name?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
    )}
    
    <div className={cn(
      "max-w-[75%] sm:max-w-[70%] rounded-2xl p-3 relative group",
      isOwn 
        ? "bg-blue-500 text-white rounded-br-md" 
        : "bg-gray-100 dark:bg-gray-700 rounded-bl-md"
    )}>
      {/* Sender name for group chats */}
      {!isOwn && (
        <p className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
          {message.sender?.name}
        </p>
      )}
      
      {/* Reply Context */}
      {message.replyTo && (
        <div className={cn(
          "mb-2 p-2 rounded border-l-2",
          isOwn 
            ? "bg-blue-400/30 border-blue-300" 
            : "bg-gray-200 dark:bg-gray-600 border-gray-400"
        )}>
          <p className="text-xs opacity-75">{message.replyTo.sender.name}</p>
          <p className="text-sm truncate">{message.replyTo.content}</p>
        </div>
      )}

      {/* Text Message */}
      {message.type === 'TEXT' && (
        <p className="break-words whitespace-pre-wrap">{message.content}</p>
      )}

      {/* Image Attachment */}
      {message.type === 'IMAGE' && message.attachment && (
        <div className="mb-2">
          <img 
            src={message.attachment.url} 
            alt={message.attachment.name}
            className="max-w-full rounded cursor-pointer"
            onClick={() => window.open(message.attachment!.url, '_blank')}
          />
          {message.content && <p className="mt-2">{message.content}</p>}
        </div>
      )}

      {/* Video Attachment */}
      {message.type === 'VIDEO' && message.attachment && (
        <div className="mb-2">
          <video 
            src={message.attachment.url}
            controls
            className="max-w-full rounded"
          />
          {message.content && <p className="mt-2">{message.content}</p>}
        </div>
      )}

      {/* File Attachment */}
      {message.type === 'FILE' && message.attachment && (
        <div className="flex items-center space-x-2 mb-2">
          <Download className="h-4 w-4 flex-shrink-0" />
          <a 
            href={message.attachment.url}
            download={message.attachment.name}
            className="underline truncate"
          >
            {message.attachment.name}
          </a>
          <span className="text-xs opacity-75 whitespace-nowrap">
            ({Math.round(message.attachment.size / 1024)} KB)
          </span>
        </div>
      )}

      {/* Audio Attachment */}
      {message.type === 'AUDIO' && message.attachment && (
        <div className="mb-2">
          <audio src={message.attachment.url} controls className="max-w-full" />
          {message.content && <p className="mt-2">{message.content}</p>}
        </div>
      )}

      {/* Message Info and Actions */}
      <div className="flex items-center justify-between mt-1 text-xs opacity-75">
        <span>
          {new Date(message.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
          {message.isEdited && <span className="ml-1">(edited)</span>}
        </span>

        <div className="flex items-center gap-1">
          {/* Quick Reply Button */}
          <button
            onClick={() => handleReply(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10"
            title="Balas pesan"
          >
            <ArrowRight className="h-3 w-3" />
          </button>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10">
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleReply(message)}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Balas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEmojiPicker(message.id)}>
                <Smile className="h-4 w-4 mr-2" />
                Tambah Reaksi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Reactions */}
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

      {/* Emoji Picker */}
      {showEmojiPicker === message.id && (
        <div className="absolute bottom-full mb-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2 z-10">
          <div className="flex gap-1">
            {['😀', '😂', '😍', '😢', '😮', '😡', '👍', '👎', '❤️', '🔥'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  handleAddReaction(message.id, emoji)
                  setShowEmojiPicker(null)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
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
  const [dragActive, setDragActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [activeTab, setActiveTab] = useState('rooms')
  const [pusherClient, setPusherClient] = useState<PusherClient | null>(null)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // File Upload Handler
  const handleFileUpload = async (files: File[]) => {
    if (!activeRoom) return
    
    setUploadingFiles(files)
    
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomId', activeRoom.id)
      
      try {
        const response = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const data = await response.json()
          await sendMessage('', {
            type: file.type.startsWith('image/') ? 'IMAGE' : 
                  file.type.startsWith('video/') ? 'VIDEO' : 
                  file.type.startsWith('audio/') ? 'AUDIO' : 'FILE',
            url: data.url,
            name: file.name,
            size: file.size,
            mimeType: file.type
          })
        }
      } catch (error) {
        console.error('File upload error:', error)
        toast.error('Gagal upload file')
      }
    }
    
    setUploadingFiles([])
  }

  // Drag & Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  // Reaction Handler
  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      })
      
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions }
          if (reactions[emoji]) {
            reactions[emoji].count += 1
            reactions[emoji].users.push(session?.user?.id || '')
          } else {
            reactions[emoji] = { count: 1, users: [session?.user?.id || ''] }
          }
          return { ...msg, reactions }
        }
        return msg
      }))
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  // Reply Handler
  const handleReply = (message: Message) => {
    setReplyingTo(message)
    textareaRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  // Send Message
  const sendMessage = async (content: string, attachment?: any) => {
    if (!activeRoom) return

    setSendingMessage(true)
    
    const messageData = {
      content: content || '',
      roomId: activeRoom.id,
      type: attachment?.type || 'TEXT',
      attachment: attachment || null,
      replyToId: replyingTo?.id || null
    }

    try {
      const res = await fetch('/api/chat/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (res.ok) {
        const data = await res.json()
        // Handle response - either direct message or wrapped in success
        const newMsg = data.message || data
        if (newMsg && newMsg.id) {
          setMessages(prev => [...prev, newMsg])
        }
        setNewMessage('')
        setReplyingTo(null)
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Gagal mengirim pesan')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Gagal mengirim pesan')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || sendingMessage) return
    await sendMessage(newMessage)
  }

  // Voice Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const audioChunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, { type: 'audio/wav' })
        handleFileUpload([audioFile])
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting voice recording:', error)
      toast.error('Gagal merekam suara')
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Fetch Functions
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      if (res.ok) {
        const data = await res.json()
        console.log('[Chat] Rooms loaded:', data.rooms?.length || 0)
        setRooms(data.rooms || [])
      } else {
        console.error('Error fetching rooms:', res.status, res.statusText)
        toast.error('Gagal memuat daftar percakapan')
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('Gagal memuat daftar percakapan')
    }
  }, [])

  const fetchMentors = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/mentors')
      if (res.ok) {
        const data = await res.json()
        console.log('[Chat] Mentors loaded:', data?.length || 0)
        // Transform mentors data to match interface
        const mentorsData = (data || []).map((mentor: any) => ({
          id: mentor.id,
          name: mentor.name,
          username: mentor.username,
          avatar: mentor.avatar,
          isOnline: mentor.isOnline || false,
          unreadCount: 0 // Will be updated when rooms are fetched
        }))
        setMentors(mentorsData)
      } else {
        console.error('Error fetching mentors:', res.status, res.statusText)
        toast.error('Gagal memuat daftar mentor')
      }
    } catch (error) {
      console.error('Error fetching mentors:', error)
      toast.error('Gagal memuat daftar mentor')
    }
  }, [])

  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?roomId=${roomId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        
        // Mark messages as read
        await fetch('/api/chat/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId })
        })
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }, [])

  const createOrGetRoom = async (mentorId: string, mentorName: string) => {
    try {
      console.log('[Chat] Creating room with mentor:', { mentorId, mentorName })
      const res = await fetch('/api/chat/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, mentorName })
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('[Chat] Room created/found:', data)
        
        // Refetch rooms to get updated list
        await fetchRooms()
        
        // Find mentor data for avatar
        const mentor = mentors.find(m => m.id === mentorId)
        
        // Create or use returned room object
        const room: ChatRoom = data.room || {
          id: data.roomId,
          name: mentorName,
          type: 'DIRECT',
          avatar: mentor?.avatar || null,
          unreadCount: 0,
          participants: [{
            user: {
              id: mentorId,
              name: mentorName,
              avatar: mentor?.avatar || null,
              isOnline: mentor?.isOnline || false
            }
          }]
        }
        
        setActiveRoom(room)
        await fetchMessages(room.id)
        
        // Hide sidebar on mobile after selecting
        if (window.innerWidth < 768) {
          setShowSidebar(false)
        }
        
        // Switch to rooms tab
        setActiveTab('rooms')
        toast.success(`Chat dengan ${mentorName} dimulai`)
      } else {
        const errorData = await res.json()
        console.error('Error response:', errorData)
        toast.error(errorData.error || 'Gagal membuat chat room')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Gagal membuat chat room')
    }
  }

  const selectRoom = (room: ChatRoom) => {
    setActiveRoom(room)
    fetchMessages(room.id)
    
    // Hide sidebar on mobile
    if (window.innerWidth < 768) {
      setShowSidebar(false)
    }
  }

  // Initial Data Load
  useEffect(() => {
    if (session?.user) {
      const loadData = async () => {
        console.log('[Chat] Loading initial data for user:', session.user.id)
        setLoading(true)
        try {
          await Promise.all([fetchRooms(), fetchMentors()])
          console.log('[Chat] Initial data loaded successfully')
        } catch (error) {
          console.error('[Chat] Error loading initial data:', error)
          toast.error('Gagal memuat data chat')
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [session?.user?.id, fetchRooms, fetchMentors])

  // Refresh messages when active room changes
  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id)
    }
  }, [activeRoom?.id, fetchMessages])

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowSidebar(true)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Setup Pusher for realtime messaging
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

        // Subscribe to user channel for direct messages
        const userChannel = client.subscribe(`user-${session.user.id}`)
        
        // Listen for new messages
        userChannel.bind('new-message', (data: any) => {
          console.log('[Pusher] Received new message:', data)
          
          // Add message to current conversation if it matches active room
          if (data.roomId === activeRoom?.id) {
            setMessages(prev => [...prev, data.message])
          }
          
          // Update room's last message in sidebar
          setRooms(prev => prev.map(room => 
            room.id === data.roomId 
              ? { 
                  ...room, 
                  lastMessage: {
                    content: data.message.content,
                    createdAt: data.message.createdAt
                  },
                  unreadCount: room.id === activeRoom?.id ? room.unreadCount : room.unreadCount + 1
                }
              : room
          ))
        })

        // Listen for message reactions
        userChannel.bind('message-reaction', (data: any) => {
          console.log('[Pusher] Received message reaction:', data)
          
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, reactions: data.reactions }
              : msg
          ))
        })

        // Listen for typing indicators
        userChannel.bind('typing-indicator', (data: any) => {
          console.log('[Pusher] User typing:', data)
          // Add typing indicator logic here
        })

        console.log('[Pusher] Client setup complete')

      } catch (error) {
        console.error('[Pusher] Setup failed:', error)
      }
    }

    setupPusher()

    return () => {
      if (pusherClient) {
        pusherClient.disconnect()
        console.log('[Pusher] Client disconnected')
      }
    }
  }, [session?.user?.id, activeRoom?.id])

  // Subscribe to active room channel
  useEffect(() => {
    if (!pusherClient || !activeRoom?.id) return

    const roomChannel = pusherClient.subscribe(`room-${activeRoom.id}`)
    
    roomChannel.bind('new-message', (data: any) => {
      console.log('[Pusher] Room message:', data)
      setMessages(prev => [...prev, data.message])
    })

    return () => {
      pusherClient.unsubscribe(`room-${activeRoom.id}`)
    }
  }, [pusherClient, activeRoom?.id])

  // Filter rooms and mentors based on search
  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredMentors = mentors.filter(mentor =>
    mentor.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Mobile Menu Button */}
      {!showSidebar && activeRoom && (
        <button
          onClick={() => setShowSidebar(true)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      
      {/* Sidebar - Conversation List */}
      <div className={cn(
        "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300",
        showSidebar 
          ? "w-full md:w-80 lg:w-96" 
          : "w-0 md:w-80 lg:w-96",
        !showSidebar && "overflow-hidden md:overflow-visible"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
            {activeRoom && (
              <button 
                onClick={() => setShowSidebar(false)}
                className="md:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search mentors or messages..."
              className="pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chat Mentors Section */}
        <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="px-4 pt-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chat Dengan Mentor</h3>
            <button 
              onClick={() => setActiveTab('mentors')}
              className="text-blue-600 text-xs font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              Lihat Semua
            </button>
          </div>
          <div className="px-4 mt-3 flex gap-2 mb-3">
            <button className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium shadow-sm">
              All
            </button>
            <button className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium transition-colors">
              Online
            </button>
            <button className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-medium transition-colors">
              Unread
            </button>
          </div>
          
          {/* Mentor Avatars */}
          <div className="flex gap-3 overflow-x-auto p-4 scrollbar-hide">{filteredMentors.slice(0, 4).map((mentor) => (
              <div 
                key={mentor.id}
                onClick={() => createOrGetRoom(mentor.id, mentor.name)}
                className="flex flex-col items-center gap-2 min-w-[64px] cursor-pointer group"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-white dark:border-gray-800 shadow-sm group-hover:scale-105 transition-transform">
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                      {mentor.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full",
                      mentor.isOnline ? "bg-green-500" : "bg-gray-400"
                    )}
                  />
                  {mentor.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white dark:border-gray-800">
                      {mentor.unreadCount}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 text-center truncate w-16">
                  {mentor.name.split(' ')[0]}
                </span>
              </div>
            ))}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Belum ada percakapan</h3>
              <p className="text-sm text-gray-500">Mulai chat dengan memilih mentor di atas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className={cn(
                    "cursor-pointer p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors relative",
                    activeRoom?.id === room.id 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500" 
                      : ""
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12 border-2 border-white dark:border-gray-800 shadow-sm">
                        <AvatarImage src={room.avatar} />
                        <AvatarFallback className={cn(
                          "font-semibold text-white",
                          room.type === 'MENTOR' ? "bg-gradient-to-br from-indigo-500 to-purple-600" :
                          room.type === 'SUPPORT' ? "bg-gradient-to-br from-pink-500 to-rose-600" :
                          "bg-gradient-to-br from-blue-500 to-teal-600"
                        )}>
                          {room.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {room.participants.some(p => p.user.isOnline) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-2">
                          {room.name}
                        </h4>
                        {room.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDistanceToNow(new Date(room.lastMessage.createdAt), { 
                              addSuffix: false, 
                              locale: idLocale 
                            })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {room.lastMessage ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate pr-2">
                            {room.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Belum ada pesan</p>
                        )}
                        
                        {room.unreadCount > 0 && (
                          <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {room.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {!activeRoom ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center px-4">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Selamat datang di chat!</h3>
              <p className="text-gray-500 dark:text-gray-400">Pilih percakapan untuk mulai chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!showSidebar && (
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  
                  <div className="relative">
                    <Avatar className="w-10 h-10 border-2 border-white dark:border-gray-700 shadow-sm">
                      <AvatarImage src={activeRoom.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {activeRoom.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {activeRoom.participants.some(p => p.user.isOnline) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full" />
                    )}
                  </div>
                  
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{activeRoom.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeRoom.participants.some(p => p.user.isOnline) ? '● Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <div className="p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Mulai percakapan</h3>
                    <p className="text-gray-500 dark:text-gray-400">Kirim pesan pertama Anda!</p>
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
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              {/* Reply Preview */}
              {replyingTo && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                        Replying to {replyingTo.sender.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {replyingTo.content}
                      </p>
                    </div>
                    <button
                      onClick={cancelReply}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input Form */}
              <div className="flex items-end gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(Array.from(e.target.files))
                    }
                  }}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                <div className="flex-1">
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
                    className="resize-none min-h-[44px] max-h-32 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:border-blue-500 focus:ring-blue-500"
                    rows={1}
                  />
                </div>
                
                <button
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                  title="Send message"
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
                <Avatar className="w-10 h-10 shadow-sm">
                  <AvatarImage src={activeRoom.avatar} />
                  <AvatarFallback className="bg-indigo-500 text-white font-bold">
                    {activeRoom.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-800 bg-green-500"></span>
              </div>
              
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {activeRoom.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ml-1">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full">
                <div className="text-center max-w-sm p-8 rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 transform transition-transform hover:rotate-6">
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7" />
                    </svg>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Hello, Sultan! 👋</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Welcome to the mentor chat. Ask any questions about exports, logistics, or regulations. We're here to help!
                  </p>
                </div>
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

            {/* Drag and Drop Overlay */}
            {dragActive && (
              <div className="fixed inset-0 bg-blue-500/20 flex items-center justify-center z-50 pointer-events-none">
                <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                  <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-600 dark:text-blue-400 font-medium">
                    Lepas file di sini untuk upload
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            {/* Reply Preview */}
            {replyingTo && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Membalas {replyingTo.sender.name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {replyingTo.content || 'Media file'}
                    </p>
                  </div>
                  <button 
                    onClick={cancelReply}
                    className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* File Upload Preview */}
            {uploadingFiles.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Mengupload {uploadingFiles.length} file...
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
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
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 text-sm resize-none min-h-[50px] max-h-[150px] p-2"
                rows={1}
                disabled={isRecording || sendingMessage}
              />
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || [])
                        handleFileUpload(files)
                      }
                      input.click()
                    }}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Add Image"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Add Video">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Attach File"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button
                    onMouseDown={startVoiceRecording}
                    onMouseUp={stopVoiceRecording}
                    onMouseLeave={stopVoiceRecording}
                    onTouchStart={startVoiceRecording}
                    onTouchEnd={stopVoiceRecording}
                    className={cn(
                      "hidden sm:block p-2 rounded-lg transition-colors",
                      isRecording 
                        ? "text-red-600 bg-red-50 dark:bg-red-900/30" 
                        : "text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    )}
                    title="Voice Message"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-gray-400 hover:text-amber-400 transition-colors p-1">
                    <Smile className="h-5 w-5" />
                  </button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isRecording || sendingMessage}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl w-10 h-10 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                handleFileUpload(files)
                e.target.value = ''
              }}
              className="hidden"
            />
          </div>
        </section>
      ) : (
        /* Empty State when no room selected */
        <section className={cn(
          "hidden sm:flex flex-1 flex-col bg-white dark:bg-gray-800 sm:rounded-2xl shadow-sm border sm:border-gray-200 dark:border-gray-700 h-full relative overflow-hidden items-center justify-center",
          !showSidebar ? "flex" : "hidden sm:flex"
        )}>
          <div className="text-center max-w-md px-4">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
              <MessageCircle className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Selamat Datang di Chat!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Pilih percakapan dari daftar atau mulai chat baru dengan memilih mentor
            </p>
            <Button 
              onClick={() => {/* Navigate to mentor selection */}} 
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Lihat Daftar Mentor
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
