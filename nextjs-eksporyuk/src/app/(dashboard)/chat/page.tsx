'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Send, Search, MoreVertical, Phone, Video, Paperclip, Smile, Image as ImageIcon, X, Reply, User, ExternalLink, FileText, Film, Download, Loader2, Trash2, ChevronLeft, Mic, MessageCircle, Users, Filter, Check, CheckCheck, Clock, ArrowLeft, Plus, Settings, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OnlineStatusBadge from '@/components/presence/OnlineStatusBadge'
import LinkPreview from '@/components/chat/LinkPreview'
import { formatDistanceToNow, format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Pusher from 'pusher-js'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

// Common emojis organized by category
const EMOJI_CATEGORIES = {
  'Sering Dipakai': ['😀', '😂', '🥰', '😍', '🤔', '😊', '👍', '❤️', '🔥', '✨', '🎉', '💪'],
  'Wajah': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  'Gesture': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Hati': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Objek': ['🎁', '🎉', '🎊', '🎈', '🏆', '🥇', '🎯', '💡', '📱', '💻', '📷', '🎬', '🎵', '🎶', '⭐', '🌟', '✨', '💫', '🔥', '💥', '💢', '💦', '💨'],
}

interface Mentor {
  id: string
  name: string
  username?: string
  avatar?: string
  isOnline: boolean
  lastSeenAt?: string
  bio?: string
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

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifSearchQuery, setGifSearchQuery] = useState('')
  const [gifs, setGifs] = useState<any[]>([])
  const [loadingGifs, setLoadingGifs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<{ file: File; type: 'file' | 'image'; preview?: string; isVideo?: boolean } | null>(null)
  
  // New states for redesigned chat
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [messageFilter, setMessageFilter] = useState<'all' | 'online' | 'unread'>('all')
  const [loadingMentors, setLoadingMentors] = useState(true)
  const [startingChat, setStartingChat] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const initialRoomLoaded = useRef(false)

  // Fetch mentors for "Chat Dengan Mentor" section
  const fetchMentors = async () => {
    try {
      setLoadingMentors(true)
      const res = await fetch('/api/mentors')
      if (res.ok) {
        const data = await res.json()
        setMentors(data.mentors || [])
      }
    } catch (error) {
      console.error('Failed to fetch mentors:', error)
    } finally {
      setLoadingMentors(false)
    }
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
        // Refresh rooms and set active room
        const fetchedRooms = await fetchRooms()
        const newRoom = fetchedRooms.find((r: ChatRoom) => r.id === data.roomId)
        if (newRoom) {
          setActiveRoom(newRoom)
        }
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal memulai chat')
      }
    } catch (error) {
      console.error('Failed to start chat:', error)
      toast.error('Gagal memulai chat dengan mentor')
    } finally {
      setStartingChat(null)
    }
  }

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms)
        return data.rooms
      }
      return []
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Handle initial room from URL params
  useEffect(() => {
    const loadRoomsAndSelectInitial = async () => {
      // Fetch mentors in parallel
      fetchMentors()
      
      const fetchedRooms = await fetchRooms()
      
      // Check if there's a room param in URL
      const roomId = searchParams.get('room')
      if (roomId && !initialRoomLoaded.current) {
        initialRoomLoaded.current = true
        let targetRoom = fetchedRooms.find((r: ChatRoom) => r.id === roomId)
        
        // If room not found in list (newly created), add it
        if (!targetRoom) {
          // Refetch rooms to get the newly created room
          const refreshedRooms = await fetchRooms()
          targetRoom = refreshedRooms.find((r: ChatRoom) => r.id === roomId)
        }
        
        if (targetRoom) {
          setActiveRoom(targetRoom)
        }
      }
    }
    
    loadRoomsAndSelectInitial()
  }, [searchParams])

  // Fetch messages for active room
  const fetchMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?roomId=${roomId}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
        scrollToBottom()
        
        // Mark as read
        await fetch('/api/chat/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId }),
        })
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

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
        setIsTyping(false)
        
        // Stop typing indicator
        fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: activeRoom.id,
            isTyping: false,
          }),
        })
      }
    } catch (error) {
      toast.error('Gagal mengirim pesan')
    }
  }

  // Handle reply
  const handleReply = (message: Message) => {
    setReplyingTo(message)
    inputRef.current?.focus()
  }

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null)
  }

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  // Search GIFs using Giphy API
  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Load trending GIFs
      setLoadingGifs(true)
      try {
        const res = await fetch(`/api/chat/giphy?trending=true`)
        if (res.ok) {
          const data = await res.json()
          setGifs(data.gifs || [])
        }
      } catch (error) {
        console.error('Failed to load trending GIFs:', error)
      } finally {
        setLoadingGifs(false)
      }
      return
    }

    setLoadingGifs(true)
    try {
      const res = await fetch(`/api/chat/giphy?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setGifs(data.gifs || [])
      }
    } catch (error) {
      console.error('Failed to search GIFs:', error)
    } finally {
      setLoadingGifs(false)
    }
  }, [])

  // Debounced GIF search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showGifPicker) {
        searchGifs(gifSearchQuery)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [gifSearchQuery, showGifPicker, searchGifs])

  // Send GIF
  const handleSendGif = async (gifUrl: string) => {
    if (!activeRoom) return

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          content: 'GIF',
          type: 'GIF',
          attachmentUrl: gifUrl,
          replyToId: replyingTo?.id || null,
        }),
      })

      if (res.ok) {
        setShowGifPicker(false)
        setReplyingTo(null)
        setGifSearchQuery('')
      }
    } catch (error) {
      toast.error('Gagal mengirim GIF')
    }
  }

  // Handle file selection (preview before send)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = e.target.files?.[0]
    if (!file || !activeRoom) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      return
    }

    // Create preview for images and videos
    let preview: string | undefined
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (type === 'image' && (isImage || isVideo)) {
      preview = URL.createObjectURL(file)
    }

    setPendingFile({ file, type, preview, isVideo })
  }

  // Cancel pending file
  const cancelPendingFile = () => {
    if (pendingFile?.preview) {
      URL.revokeObjectURL(pendingFile.preview)
    }
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  // Send pending file
  const sendPendingFile = async () => {
    if (!pendingFile || !activeRoom) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', pendingFile.file)
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
      cancelPendingFile()
    }
  }

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId))
        toast.success('Pesan berhasil dihapus')
      } else {
        toast.error('Gagal menghapus pesan')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Gagal menghapus pesan')
    }
  }

  // Render link preview for URLs in text
  const renderTextWithLinks = (text: string, isOwn: boolean) => {
    const parts = text.split(URL_REGEX)
    const urls: string[] = text.match(URL_REGEX) || []
    
    return (
      <div className="space-y-2">
        <p className="text-sm whitespace-pre-wrap break-words">
          {parts.map((part, index) => {
            if (urls.includes(part)) {
              return (
                <a
                  key={index}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline hover:no-underline ${isOwn ? 'text-blue-200' : 'text-blue-600'}`}
                >
                  {part}
                </a>
              )
            }
            return part
          })}
        </p>
        {/* Link Preview for first URL */}
        {urls.length > 0 && (
          <LinkPreview url={urls[0]} isOwn={isOwn} />
        )}
      </div>
    )
  }

  // Render message content based on type
  const renderMessageContent = (message: Message, isOwn: boolean) => {
    const messageType = message.type?.toUpperCase() || 'TEXT'
    
    // Reply Preview Component
    const ReplyPreview = message.replyTo ? (
      <div 
        className={`text-xs mb-2 px-3 py-2 rounded-xl border-l-[3px] ${
          isOwn 
            ? 'bg-blue-800/30 border-blue-400' 
            : 'bg-gray-100 border-gray-400'
        }`}
      >
        <p className={`font-semibold text-[11px] ${isOwn ? 'text-blue-200' : 'text-gray-700'}`}>
          ↩ {message.replyTo.sender.name}
        </p>
        <p className={`truncate max-w-[250px] text-[13px] mt-0.5 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
          {message.replyTo.content}
        </p>
      </div>
    ) : null
    
    switch (messageType) {
      case 'IMAGE':
        return (
          <div className="relative group">
            {ReplyPreview}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.attachmentUrl}
              alt={message.attachmentName || 'Image'}
              className="max-w-[280px] max-h-[350px] rounded-[20px] cursor-pointer hover:opacity-95 transition-opacity object-cover"
              onClick={() => setImagePreview(message.attachmentUrl || null)}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.onerror = null
                target.src = '/images/placeholder-image.png'
              }}
            />
            {message.attachmentName && (
              <div className={`text-[11px] mt-1.5 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                {message.attachmentName}
              </div>
            )}
          </div>
        )
      case 'VIDEO':
        return (
          <div className="space-y-1.5">
            {ReplyPreview}
            <video
              src={message.attachmentUrl}
              controls
              className="max-w-[280px] max-h-[350px] rounded-[20px]"
              preload="metadata"
            />
            {(message.attachmentName || message.attachmentSize) && (
              <div className={`text-[11px] flex items-center gap-2 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                {message.attachmentName && <span className="truncate max-w-[200px]">{message.attachmentName}</span>}
                {message.attachmentSize && <span>({formatFileSize(message.attachmentSize)})</span>}
              </div>
            )}
          </div>
        )
      case 'GIF':
        return (
          <div>
            {ReplyPreview}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.attachmentUrl}
              alt="GIF"
              className="max-w-[250px] max-h-[250px] rounded-[20px] object-cover"
            />
          </div>
        )
      case 'FILE':
        const fileName = message.attachmentName || message.content || 'File'
        const fileSize = message.attachmentSize ? formatFileSize(message.attachmentSize) : null
        const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE'
        
        return (
          <div>
            {ReplyPreview}
            <a
              href={message.attachmentUrl}
              download={fileName}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors min-w-[200px] ${
                isOwn 
                  ? 'bg-blue-500 hover:bg-blue-400' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                isOwn ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {fileExt}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                  {fileName}
                </p>
                <p className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                  {fileSize ? `${fileSize} • ` : ''}Klik untuk download
                </p>
              </div>
              <Download className={`w-5 h-5 flex-shrink-0 ${isOwn ? 'text-white' : 'text-gray-600'}`} />
            </a>
          </div>
        )
      default:
        // Check if text contains URLs
        if (URL_REGEX.test(message.content)) {
          return (
            <div>
              {ReplyPreview}
              {renderTextWithLinks(message.content, isOwn)}
            </div>
          )
        }
        return (
          <div>
            {ReplyPreview}
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        )
    }
  }

  // Handle typing
  const handleTyping = async (value: string) => {
    setNewMessage(value)

    if (!activeRoom) return

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (value.length > 0 && !isTyping) {
      setIsTyping(true)
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          isTyping: true,
        }),
      })
    }

    // Set timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          isTyping: false,
        }),
      })
    }, 3000)
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Setup Pusher for realtime updates
  useEffect(() => {
    if (!session?.user?.id || !activeRoom) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!pusherKey) {
      console.log('[PUSHER] Key not configured in chat page')
      return
    }

    console.log('[Pusher] Setting up connection for room:', activeRoom.id)

    const pusher = new Pusher(pusherKey, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    })

    // Subscribe to private room channel
    const channel = pusher.subscribe(`private-room-${activeRoom.id}`)

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] Successfully subscribed to room:', activeRoom.id)
    })

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[Pusher] Subscription error:', error)
      toast.error('Gagal terhubung ke chat realtime')
    })

    // Listen for new messages
    channel.bind('new-message', (message: Message) => {
      console.log('[Pusher] New message received:', message)
      
      setMessages(prev => {
        // Prevent duplicates
        if (prev.find(m => m.id === message.id)) return prev
        return [...prev, message]
      })
      
      scrollToBottom()
      
      // Mark as read if sender is not current user
      if (message.senderId !== session.user.id) {
        fetch('/api/chat/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: activeRoom.id }),
        })
      }
    })

    // Listen for typing indicators
    channel.bind('user-typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.userId === session.user.id) return

      console.log('[Pusher] User typing:', data)

      if (data.isTyping) {
        setTypingUsers(prev => {
          // Add user if not already in list
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName]
          }
          return prev
        })
        
        // Auto-remove after 5 seconds if no update (fallback)
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(name => name !== data.userName))
        }, 5000)
      } else {
        setTypingUsers(prev => prev.filter(name => name !== data.userName))
      }
    })

    // Listen for message read receipts
    channel.bind('messages-read', (data: { userId: string; readAt: string }) => {
      console.log('[Pusher] Messages marked as read by:', data.userId)
      
      setMessages(prev =>
        prev.map(msg =>
          msg.senderId === session.user.id ? { ...msg, isRead: true } : msg
        )
      )
    })

    // Listen for message deletions
    channel.bind('message-deleted', (data: { messageId: string }) => {
      console.log('[Pusher] Message deleted:', data.messageId)
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId))
    })

    // Cleanup on unmount or room change
    return () => {
      console.log('[Pusher] Cleaning up room:', activeRoom.id)
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing indicator before leaving
      if (isTyping) {
        fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: activeRoom.id,
            isTyping: false,
          }),
        })
      }
      
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
    }
  }, [session?.user?.id, activeRoom?.id])

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id)
      // Clear typing users when switching rooms
      setTypingUsers([])
    }
  }, [activeRoom])

  // Filter rooms based on search and filter state
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = (room.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    
    const otherUser = room.participants.find(p => p.user.id !== session?.user?.id)?.user
    
    if (messageFilter === 'online') {
      return otherUser?.isOnline === true
    }
    if (messageFilter === 'unread') {
      return room.unreadCount > 0
    }
    return true
  })

  // Get total unread count
  const totalUnread = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
  
  // Get online mentors count
  const onlineMentorsCount = mentors.filter(m => m.isOnline).length

  const getOtherUser = (room: ChatRoom) => {
    if (room.type === 'DIRECT' || room.type === 'MENTOR') {
      return room.participants.find(p => p.user.id !== session?.user?.id)?.user
    }
    return null
  }
  
  // Format time for message list
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return format(date, 'HH:mm')
    } else if (diffDays === 1) {
      return 'Kemarin'
    } else if (diffDays < 7) {
      return format(date, 'EEEE', { locale: idLocale })
    } else {
      return format(date, 'dd/MM/yy')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] md:h-[calc(100vh-140px)] bg-white md:rounded-2xl md:shadow-xl md:border md:border-gray-100 overflow-hidden">
      {/* Sidebar - Room List */}
      <div className={`w-full md:w-96 border-r border-gray-100 flex flex-col bg-white ${
        activeRoom ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Search */}
        <div className="px-4 py-4 md:px-6 md:py-5 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-[15px]"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1">Start a conversation to see it here</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const otherUser = getOtherUser(room)
              const isActive = activeRoom?.id === room.id

              return (
                <div
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={`mx-3 mb-2 px-4 py-3.5 rounded-xl cursor-pointer active:scale-[0.98] transition-all ${
                    isActive ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-14 h-14 ring-2 ring-white shadow-md">
                        <AvatarImage src={otherUser?.avatar || room.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {(room.name || 'U')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {otherUser?.isOnline && (
                        <div className="absolute bottom-0 right-0">
                          <OnlineStatusBadge
                            isOnline={otherUser.isOnline}
                            size="sm"
                            userId={otherUser.id}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-semibold text-[15px] text-gray-900 truncate">
                          {room.name || 'Chat'}
                        </h3>
                        {room.lastMessage && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(room.lastMessage.createdAt), {
                              addSuffix: false,
                              locale: idLocale,
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${room.unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                          {room.lastMessage?.content || 'No messages yet'}
                        </p>
                        {room.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-[10px] md:text-xs flex-shrink-0 h-4 md:h-5 min-w-[18px] md:min-w-[20px] flex items-center justify-center px-1.5\">
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </Badge>
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
      <div className={`flex-1 flex flex-col ${
        activeRoom ? 'flex' : 'hidden md:flex'
      }`}>
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-4 md:px-6 md:py-5 border-b border-gray-100 flex items-center justify-between bg-white">
              {/* Back Button (Mobile Only) */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden w-10 h-10 mr-2 -ml-1 flex-shrink-0"
                onClick={() => setActiveRoom(null)}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              {/* User Info */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 md:gap-3 cursor-pointer hover:bg-gray-50 rounded-xl p-2 md:p-2 -m-2 transition-colors flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-11 h-11 md:w-12 md:h-12 ring-2 ring-white shadow-md">
                        <AvatarImage src={getOtherUser(activeRoom)?.avatar || activeRoom.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {(activeRoom.name || 'U')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {getOtherUser(activeRoom)?.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 text-[15px] md:text-lg truncate">
                        {activeRoom.name || 'Chat'}
                      </h2>
                      {typingUsers.length > 0 ? (
                        <p className="text-xs md:text-sm text-blue-600 font-medium flex items-center gap-1">
                          <span className="inline-flex gap-0.5">
                            <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                          {typingUsers.join(', ')} sedang mengetik...
                        </p>
                      ) : (
                        <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1.5">
                          {getOtherUser(activeRoom)?.isOnline && (
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          )}
                          {getOtherUser(activeRoom)?.isOnline ? 'Online' : 'Offline'}
                        </p>
                      )}
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => {
                      const otherUser = getOtherUser(activeRoom)
                      if (otherUser) {
                        const profileUrl = `/${otherUser.username || otherUser.id}`
                        window.location.href = profileUrl
                      }
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Lihat Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      const otherUser = getOtherUser(activeRoom)
                      if (otherUser) {
                        const profileUrl = `/${otherUser.username || otherUser.id}`
                        window.open(profileUrl, '_blank')
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Buka di Tab Baru
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="w-8 h-8 md:w-10 md:h-10 hover:bg-gray-100 transition-colors"
                  onClick={() => toast('Fitur Voice Call akan segera hadir!', { icon: '📞' })}
                  title="Voice Call (Coming Soon)"
                >
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="w-8 h-8 md:w-10 md:h-10 hover:bg-gray-100 transition-colors"
                  onClick={() => toast('Fitur Video Call akan segera hadir!', { icon: '📹' })}
                  title="Video Call (Coming Soon)"
                >
                  <Video className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      const otherUser = getOtherUser(activeRoom)
                      if (otherUser) {
                        const profileUrl = `/${otherUser.username || otherUser.id}`
                        window.location.href = profileUrl
                      }
                    }}>
                      <User className="w-4 h-4 mr-2" />
                      Lihat Profil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Hapus Percakapan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 space-y-4 md:space-y-5 bg-gradient-to-b from-gray-50/50 to-white">
              {messages.map((message, index) => {
                const isOwn = message.senderId === session?.user?.id
                const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 md:gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    {showAvatar && !isOwn ? (
                      <Avatar className="w-8 h-8 md:w-8 md:h-8 flex-shrink-0">
                        <AvatarImage src={message.sender.avatar} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">{message.sender.name[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 md:w-8 flex-shrink-0" />
                    )}

                    <div className={`max-w-[80%] md:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isOwn && showAvatar && (
                        <span className="text-[13px] text-gray-600 mb-1.5 px-1 font-medium">
                          {message.sender.name}
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        {/* Reply button - show on hover for other's messages */}
                        {!isOwn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                            onClick={() => handleReply(message)}
                          >
                            <Reply className="w-4 h-4 text-gray-500" />
                          </Button>
                        )}

                        {(() => {
                          const msgType = message.type?.toUpperCase() || 'TEXT'
                          const isMedia = ['IMAGE', 'VIDEO', 'GIF'].includes(msgType)
                          const isFile = msgType === 'FILE'
                          
                          return (
                            <div
                              className={`text-[15px] md:text-base leading-relaxed ${isMedia ? 'p-1' : isFile ? 'p-0 overflow-hidden' : 'px-4 py-3 md:px-4 md:py-3'} ${
                                isOwn
                                  ? isFile ? 'bg-transparent' : isMedia ? 'bg-blue-600 rounded-[24px] shadow-lg shadow-blue-600/20' : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-[24px] rounded-br-lg shadow-lg shadow-blue-600/20'
                                  : isFile ? 'bg-transparent' : isMedia ? 'bg-white rounded-[24px] shadow-md border border-gray-100' : 'bg-white text-gray-800 rounded-[24px] rounded-bl-lg shadow-md border border-gray-100'
                              }`}
                            >
                              {renderMessageContent(message, isOwn)}
                            </div>
                          )
                        })()}

                        {/* Action buttons - show on hover for own messages */}
                        {isOwn && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleReply(message)}
                            >
                              <Reply className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-1.5 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[11px] md:text-xs text-gray-400 font-medium">
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: idLocale,
                          })}
                        </span>
                        {isOwn && message.isRead && (
                          <span className="text-[10px] md:text-xs text-blue-600">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 pl-10">
                  <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {typingUsers.join(', ')} sedang mengetik...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="w-full bg-white border-t border-gray-100" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
                <div className="px-2 py-2 md:px-6 md:py-4 w-full max-w-full">
                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                    onChange={(e) => handleFileSelect(e, 'file')}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileSelect(e, 'image')}
                  />

                  <div className="space-y-2 md:space-y-3 w-full">
                  {/* Reply Preview */}
                  {replyingTo && (
                    <div className="flex items-center justify-between bg-blue-50 rounded-xl p-2.5 md:p-3 border-l-4 border-blue-500">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-blue-700">
                          Replying to {replyingTo.sender.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {replyingTo.content}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 hover:bg-blue-100"
                        onClick={cancelReply}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Main Input Container */}
                  <div className="bg-gray-50 rounded-xl md:rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all max-w-[calc(100%-5rem)] md:max-w-full">
                    {/* Textarea */}
                    <textarea
                      ref={inputRef as any}
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={replyingTo ? `Reply to ${replyingTo.sender.name}...` : "Write a message..."}
                      className="w-full px-2.5 md:px-4 pt-2.5 md:pt-4 pb-1.5 md:pb-2 text-[14px] md:text-base bg-transparent border-0 focus:outline-none focus:ring-0 resize-none min-h-[60px] md:min-h-[80px] max-h-[120px] md:max-h-[200px]"
                      rows={2}
                    />

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between px-2 md:px-3 pb-1.5 md:pb-3 pt-0">
                      <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                        {/* Camera/Image button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 md:w-9 md:h-9 hover:bg-gray-200 rounded-lg text-gray-500 p-0"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <ImageIcon className="w-[16px] h-[16px] md:w-5 md:h-5" />
                        </Button>

                        {/* Video button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 md:w-9 md:h-9 hover:bg-gray-200 rounded-lg text-gray-500 p-0"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <Video className="w-[16px] h-[16px] md:w-5 md:h-5" />
                        </Button>

                        {/* Attachment button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 md:w-9 md:h-9 hover:bg-gray-200 rounded-lg text-gray-500 p-0"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? <Loader2 className="w-[16px] h-[16px] md:w-5 md:h-5 animate-spin" /> : <Paperclip className="w-[16px] h-[16px] md:w-5 md:h-5" />}
                        </Button>

                        {/* GIF button - Hidden on mobile */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hidden md:flex w-9 h-9 hover:bg-gray-200 rounded-lg text-gray-500"
                          onClick={() => toast('GIF picker coming soon!', { icon: '🎬' })}
                        >
                          <Film className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                        {/* Text Format button - Hidden on mobile */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hidden md:flex w-9 h-9 hover:bg-gray-200 rounded-lg text-gray-400 font-semibold text-sm"
                        >
                          Aa
                        </Button>

                        {/* Emoji Picker */}
                        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 md:w-9 md:h-9 hover:bg-gray-200 rounded-lg text-gray-500 p-0"
                            >
                              <Smile className="w-[16px] h-[16px] md:w-5 md:h-5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-2" align="end">
                            <Tabs defaultValue="Sering Dipakai" className="w-full">
                              <TabsList className="w-full h-8 grid grid-cols-5 mb-2">
                                <TabsTrigger value="Sering Dipakai" className="text-xs px-1">😀</TabsTrigger>
                                <TabsTrigger value="Wajah" className="text-xs px-1">😊</TabsTrigger>
                                <TabsTrigger value="Gesture" className="text-xs px-1">👋</TabsTrigger>
                                <TabsTrigger value="Hati" className="text-xs px-1">❤️</TabsTrigger>
                                <TabsTrigger value="Objek" className="text-xs px-1">🎁</TabsTrigger>
                              </TabsList>
                              {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                                <TabsContent key={category} value={category} className="mt-0">
                                  <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
                                    {emojis.map((emoji, index) => (
                                      <button
                                        key={index}
                                        className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded transition-colors"
                                        onClick={() => handleEmojiSelect(emoji)}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </TabsContent>
                              ))}
                            </Tabs>
                          </PopoverContent>
                        </Popover>

                        {/* Send button */}
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() && !pendingFile}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-300 shadow-lg p-0"
                          size="icon"
                        >
                          <Send className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl flex items-center justify-center shadow-lg">
                <Send className="w-12 h-12 md:w-14 md:h-14 text-blue-500" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-900">Select a Conversation</h3>
              <p className="text-sm md:text-base text-gray-500">
                Choose a conversation from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview Gambar</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-white/20"
                onClick={() => setImagePreview(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              <a
                href={imagePreview}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4"
              >
                <Button variant="secondary" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
