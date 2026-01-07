'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Send, Search, Paperclip, Smile, X, MessageCircle, 
  Image as ImageIcon, Mic, Download, MoreHorizontal, 
  Upload, ArrowLeft, Menu, Users, ChevronLeft
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

  // Filter rooms and mentors based on search
  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredMentors = mentors.filter(mentor =>
    mentor.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Message Component
  const MessageBubble = ({ message, isOwn }: { message: Message; isOwn: boolean }) => (
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

        {/* Message Info */}
        <div className="flex items-center justify-between mt-1 text-xs opacity-75">
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            {message.isEdited && <span className="ml-1">(edited)</span>}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleReply(message)}>
                Balas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEmojiPicker(message.id)}>
                Tambah Reaksi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Memuat chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile Menu Button */}
      {!showSidebar && activeRoom && (
        <button
          onClick={() => setShowSidebar(true)}
          className="md:hidden fixed top-20 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "bg-white dark:bg-gray-800 flex flex-col border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
        showSidebar 
          ? "w-full md:w-72 lg:w-80" 
          : "w-0 overflow-hidden md:w-72 lg:w-80"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chat</h2>
            {activeRoom && (
              <button 
                onClick={() => setShowSidebar(false)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari chat..."
              className="pl-9 h-10 bg-gray-50 dark:bg-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs for Rooms & Mentors */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start px-4 pt-2 bg-transparent">
            <TabsTrigger value="rooms" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Percakapan
              {rooms.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {rooms.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mentors" className="flex-1">
              <Users className="w-4 h-4 mr-2" />
              Mentor
              {mentors.filter(m => m.isOnline).length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                  {mentors.filter(m => m.isOnline).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Rooms List */}
          <TabsContent value="rooms" className="flex-1 overflow-y-auto m-0 p-2">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Belum ada percakapan</p>
                <p className="text-sm">Mulai chat dengan memilih mentor</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => selectRoom(room)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      activeRoom?.id === room.id 
                        ? "bg-blue-50 dark:bg-blue-900/30" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={room.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {room.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {room.name}
                        </p>
                        {room.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDistanceToNow(new Date(room.lastMessage.createdAt), { 
                              addSuffix: false, 
                              locale: idLocale 
                            })}
                          </span>
                        )}
                      </div>
                      {room.lastMessage && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {room.lastMessage.content || 'Media'}
                        </p>
                      )}
                    </div>
                    
                    {room.unreadCount > 0 && (
                      <Badge variant="destructive" className="flex-shrink-0">
                        {room.unreadCount}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Mentors List */}
          <TabsContent value="mentors" className="flex-1 overflow-y-auto m-0 p-2">
            {filteredMentors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Tidak ada mentor</p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Online mentors first */}
                {filteredMentors
                  .sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0))
                  .map((mentor) => (
                  <div
                    key={mentor.id}
                    onClick={() => createOrGetRoom(mentor.id, mentor.name)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={mentor.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
                          {mentor.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {mentor.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {mentor.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {mentor.isOnline ? (
                          <span className="text-green-600">Online</span>
                        ) : (
                          'Offline'
                        )}
                      </p>
                    </div>
                    
                    {mentor.unreadCount > 0 && (
                      <Badge variant="destructive">
                        {mentor.unreadCount}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Area */}
      {activeRoom ? (
        <div className={cn(
          "flex-1 flex flex-col",
          !showSidebar ? "w-full" : "hidden md:flex"
        )}>
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSidebar(true)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <Avatar className="w-10 h-10">
                <AvatarImage src={activeRoom.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {activeRoom.name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {activeRoom.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeRoom.type === 'MENTOR' ? 'Mentor' : 
                   activeRoom.type === 'GROUP' ? 'Grup' : 'Chat'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-3 sm:p-4"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-semibold mb-2">Belum ada pesan</h4>
                  <p className="text-sm">Kirim pesan pertama untuk memulai percakapan</p>
                </div>
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
          <div className="p-3 sm:p-4 border-t bg-white dark:bg-gray-800">
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

            <div className="flex items-end gap-2 sm:gap-3">
              {/* Media Buttons */}
              <div className="flex items-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                  title="Lampirkan file"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                
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
                  className="hidden sm:block p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full transition-colors"
                  title="Kirim gambar"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>

                <button
                  onMouseDown={startVoiceRecording}
                  onMouseUp={stopVoiceRecording}
                  onMouseLeave={stopVoiceRecording}
                  onTouchStart={startVoiceRecording}
                  onTouchEnd={stopVoiceRecording}
                  className={cn(
                    "hidden sm:block p-2 rounded-full transition-colors",
                    isRecording 
                      ? "text-red-600 bg-red-50 dark:bg-red-900/30" 
                      : "text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                  )}
                  title={isRecording ? "Merekam... Lepas untuk kirim" : "Tahan untuk merekam"}
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
              
              {/* Message Input */}
              <div className="flex-1 relative">
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
                  placeholder={isRecording ? "Merekam..." : "Ketik pesan..."}
                  className="min-h-[44px] max-h-32 py-3 px-4 rounded-2xl resize-none"
                  rows={1}
                  disabled={isRecording || sendingMessage}
                />
              </div>
              
              {/* Send Button */}
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isRecording || sendingMessage}
                className="h-11 w-11 rounded-full flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
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
        </div>
      ) : (
        /* Empty State when no room selected */
        <div className={cn(
          "flex-1 flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900",
          !showSidebar ? "hidden" : "hidden md:flex"
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
            <Button onClick={() => setActiveTab('mentors')} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Lihat Daftar Mentor
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
