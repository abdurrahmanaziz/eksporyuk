'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, Search, Phone, Video, Paperclip, Smile, X, Reply, ArrowLeft, MessageCircle, FileText, Image as ImageIcon, Mic, Download, Heart, ThumbsUp, Laugh, Angry, Sad, Forward, MoreHorizontal, Play, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow, format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Pusher from 'pusher-js'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO'
  senderId: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  attachmentUrl?: string
  attachmentName?: string
  attachmentSize?: number
  attachmentType?: string
  thumbnailUrl?: string
  roomId: string
  createdAt: string
  isRead: boolean
  isEdited?: boolean
  editedAt?: string
  replyTo?: {
    id: string
    content: string
    type?: string
    attachmentUrl?: string
    sender: {
      name: string
      avatar?: string
    }
  }
  reactions?: Array<{
    emoji: string
    count: number
    users: Array<{
      id: string
      name: string
    }>
  }>
  forwardedFrom?: {
    id: string
    name: string
    avatar?: string
  }
}

export default function ChatPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'online'>('all')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const fetchMentors = async () => {
    try {
      const res = await fetch('/api/chat/mentors')
      if (res.ok) {
        const data = await res.json()
        setMentors(data)
      }
    } catch (error) {
      console.error('Error fetching mentors:', error)
    }
  }

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      if (res.ok) {
        const data = await res.json()
        return data.rooms
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
    return []
  }

  const fetchMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?roomId=${roomId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

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
          sendMessage('', {
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
      }
    }
    
    setUploadingFiles([])
  }

  // Drag and Drop Handlers
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

  // Reaction Handlers
  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      })
      
      // Update local state optimistically
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

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch('/api/chat/reactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      })
      
      // Update local state optimistically
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions }
          if (reactions[emoji]) {
            reactions[emoji].count -= 1
            reactions[emoji].users = reactions[emoji].users.filter(id => id !== session?.user?.id)
            if (reactions[emoji].count === 0) {
              delete reactions[emoji]
            }
          }
          return { ...msg, reactions }
        }
        return msg
      }))
    } catch (error) {
      console.error('Error removing reaction:', error)
    }
  }

  // Reply Handlers
  const handleReply = (message: Message) => {
    setReplyingTo(message)
    textareaRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  // Voice Recording Handlers
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
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Message Edit Handlers
  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await fetch('/api/chat/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content: newContent })
      })
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, isEdited: true, editedAt: new Date() }
          : msg
      ))
      setEditingMessage(null)
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  // Forward Message Handler
  const handleForwardMessage = async (message: Message, targetRoomId: string) => {
    try {
      await fetch('/api/chat/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessageId: message.id,
          targetRoomId,
          content: message.content,
          attachment: message.attachment
        })
      })
    } catch (error) {
      console.error('Error forwarding message:', error)
    }
  }

  const createOrGetRoom = async (mentorId: string, mentorName: string) => {
    try {
      const res = await fetch('/api/chat/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, mentorName })
      })
      if (res.ok) {
        const data = await res.json()
        const fetchedRooms = await fetchRooms()
        setRooms(fetchedRooms)
        const room = fetchedRooms.find(r => r.id === data.roomId)
        if (room) {
          setActiveRoom(room)
          fetchMessages(room.id)
        }
      }
    } catch (error) {
      console.error('Error creating room:', error)
    }
  }

  // Enhanced Send Message Function
  const sendMessage = async (content: string, attachment?: any) => {
    if (!activeRoom) return

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
        const newMsg = await res.json()
        setMessages(prev => [...prev, newMsg])
        setNewMessage('')
        setReplyingTo(null)
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return
    await sendMessage(newMessage)
  }

  // Enhanced Message Component
  const MessageComponent = ({ message, isOwn }: { message: Message; isOwn: boolean }) => {
    const [showOptions, setShowOptions] = useState(false)

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3 relative group`}>
          {/* Reply Context */}
          {message.replyTo && (
            <div className="mb-2 p-2 bg-opacity-20 bg-white rounded border-l-2 border-gray-400">
              <p className="text-xs opacity-75">{message.replyTo.sender.name}</p>
              <p className="text-sm">{message.replyTo.content}</p>
            </div>
          )}

          {/* Message Content */}
          {message.type === 'TEXT' && (
            <p className="break-words">{message.content}</p>
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
              <Download className="h-4 w-4" />
              <a 
                href={message.attachment.url}
                download={message.attachment.name}
                className="underline"
              >
                {message.attachment.name}
              </a>
              <span className="text-xs opacity-75">
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
          <div className="flex items-center justify-between mt-2 text-xs opacity-75">
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
              {message.isEdited && <span className="ml-1">(edited)</span>}
            </span>

            {/* Message Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleReply(message)}>
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEmojiPicker(message.id)}>
                  Add Reaction
                </DropdownMenuItem>
                {isOwn && (
                  <>
                    <DropdownMenuItem onClick={() => setEditingMessage(message)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem>
                  Forward
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
                  onClick={() => {
                    if (reaction.users.includes(session?.user?.id || '')) {
                      handleRemoveReaction(message.id, emoji)
                    } else {
                      handleAddReaction(message.id, emoji)
                    }
                  }}
                  className={`px-2 py-1 rounded-full text-xs border ${
                    reaction.users.includes(session?.user?.id || '')
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  {emoji} {reaction.count}
                </button>
              ))}
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker === message.id && (
            <div className="absolute bottom-full mb-2 bg-white border rounded-lg shadow-lg p-2 z-10">
              <div className="flex gap-1">
                {['😀', '😂', '😍', '😢', '😮', '😡', '👍', '👎', '❤️', '🔥'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleAddReaction(message.id, emoji)
                      setShowEmojiPicker(null)
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
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
  }

  const getOtherUser = (room: ChatRoom) => {
    if (room.type === 'DIRECT') {
      return room.participants.find(p => p.user.id !== session?.user?.id)?.user
    }
    return null
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchMentors()
      fetchRooms().then(rooms => {
        setRooms(rooms)
        setLoading(false)
      })
    }
  }, [session])

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id)
    }
  }, [activeRoom])

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
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - Message List */}
      <div className="w-full sm:w-80 lg:w-96 bg-white dark:bg-gray-800 sm:rounded-2xl shadow-sm flex flex-col border-r sm:border border-gray-200 dark:border-gray-700 h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search mentors or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mentor Section */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Mentors ({mentors.filter(m => m.isOnline).length} online)
            </h3>
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              {mentors.filter(m => m.isOnline).length} online
            </Badge>
          </div>

          {mentors.length > 0 && (
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2">
                {mentors.slice(0, 6).map((mentor) => (
                  <button
                    key={mentor.id}
                    onClick={() => createOrGetRoom(mentor.id, mentor.name)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[60px] relative group"
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                        <AvatarImage src={mentor.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                          {mentor.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {mentor.isOnline && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                      {mentor.unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                          {mentor.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full">
                      {mentor.name?.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Belum ada percakapan
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Pilih mentor untuk memulai chat
              </p>
            </div>
          ) : (
            rooms.map((room) => {
              const otherUser = getOtherUser(room)
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-800 relative",
                    activeRoom?.id === room.id && "bg-blue-50 dark:bg-blue-900/20 border-blue-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={otherUser?.avatar || room.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {(otherUser?.name || room.name)?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {otherUser?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {otherUser?.name || room.name || 'Unknown'}
                        </h4>
                        {room.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(room.lastMessage.createdAt), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {room.lastMessage?.content || 'Mulai percakapan...'}
                        </p>
                        {room.unreadCount > 0 && (
                          <Badge className="ml-2 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                            {room.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "hidden sm:flex flex-1 flex-col bg-white dark:bg-gray-800 sm:rounded-2xl shadow-sm border sm:border-gray-200 dark:border-gray-700 h-full relative overflow-hidden",
        activeRoom ? 'flex' : 'hidden sm:flex'
      )}>
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden w-9 h-9 mr-2 rounded-full"
                onClick={() => setActiveRoom(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3 flex-1">
                {(() => {
                  const otherUser = getOtherUser(activeRoom)
                  return (
                    <>
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={otherUser?.avatar || activeRoom.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {(otherUser?.name || activeRoom.name)?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {otherUser?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {otherUser?.name || activeRoom.name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {otherUser?.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
              
              <div className="flex gap-2">
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
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-800 dark:to-purple-800 rounded-full flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-10 h-10 text-blue-500" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Mulai Percakapan</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Kirim pesan pertama untuk memulai percakapan dengan mentor
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.senderId === session?.user?.id
                  return (
                    <MessageComponent 
                      key={message.id} 
                      message={message} 
                      isOwn={isOwn} 
                    />
                  )
                })
              )}
              <div ref={messagesEndRef} />
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              {replyingTo && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-l-4 border-blue-500 relative">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Membalas {replyingTo.sender.name}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                    {replyingTo.content}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                </div>
                
              {/* Enhanced Message Input Area */}
              <div className={`p-4 border-t bg-white dark:bg-gray-800 ${dragActive ? 'bg-blue-50 border-blue-300' : ''}`}
                   onDragEnter={handleDragEnter}
                   onDragLeave={handleDragLeave}
                   onDragOver={handleDragOver}
                   onDrop={handleDrop}>
                
                {/* Reply Preview */}
                {replyingTo && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Replying to {replyingTo.sender.name}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {replyingTo.content || 'Media file'}
                        </p>
                      </div>
                      <button 
                        onClick={cancelReply}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* File Upload Preview */}
                {uploadingFiles.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 mb-2">Uploading {uploadingFiles.length} file(s)...</p>
                    <div className="grid grid-cols-4 gap-2">
                      {uploadingFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square bg-white rounded border flex items-center justify-center text-xs p-2">
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drag and Drop Overlay */}
                {dragActive && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-blue-600 font-medium">Drop files here to upload</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-end gap-3">
                  {/* Media Attachment Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Attach file"
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
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Send image"
                    >
                      <Image className="h-5 w-5" />
                    </button>

                    <button
                      onMouseDown={startVoiceRecording}
                      onMouseUp={stopVoiceRecording}
                      onMouseLeave={stopVoiceRecording}
                      className={`p-2 rounded-full transition-colors ${
                        isRecording 
                          ? 'text-red-600 bg-red-50' 
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={isRecording ? "Recording... Release to send" : "Hold to record voice"}
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
                      placeholder={isRecording ? "Recording voice message..." : "Type a message..."}
                      className="min-h-[44px] max-h-32 py-3 px-4 pr-12 rounded-2xl bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={1}
                      disabled={isRecording}
                    />
                    
                    {/* Emoji Button */}
                    <button
                      onClick={() => {/* Toggle emoji picker */}}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-500 transition-colors"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Send Button */}
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isRecording}
                    className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-5 h-5 text-white" />
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 bg-gradient-to-br from-blue-50/30 to-purple-50/30">
            <div className="text-center max-w-md">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                <MessageCircle className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Selamat datang di Chat!</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Pilih mentor atau mulai percakapan baru untuk berkomunikasi dengan tim Eksporyuk
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  <strong className="text-gray-600">Tips:</strong> Gunakan pencarian untuk menemukan mentor atau pesan tertentu
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
