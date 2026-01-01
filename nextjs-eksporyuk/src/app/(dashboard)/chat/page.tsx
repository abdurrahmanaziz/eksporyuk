'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Search, Paperclip, Smile, X, MessageCircle, Image as ImageIcon, Mic, Download, Heart, ThumbsUp, MoreHorizontal, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Interfaces remain the same...
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
  forwardedFrom?: {
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
  const [searchQuery, setSearchQuery] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Handlers
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
        toast.error('Gagal upload file')
      }
    }
    
    setUploadingFiles([])
  }

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

  const handleReply = (message: Message) => {
    setReplyingTo(message)
    textareaRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

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
      toast.error('Gagal mengirim pesan')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return
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

  // Message Component
  const MessageComponent = ({ message, isOwn }: { message: Message; isOwn: boolean }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3 relative group`}>
        {/* Reply Context */}
        {message.replyTo && (
          <div className="mb-2 p-2 bg-opacity-20 bg-white rounded border-l-2 border-gray-400">
            <p className="text-xs opacity-75">{message.replyTo.sender.name}</p>
            <p className="text-sm">{message.replyTo.content}</p>
          </div>
        )}

        {/* Text Message */}
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

        {/* Message Info & Actions */}
        <div className="flex items-center justify-between mt-2 text-xs opacity-75">
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            {message.isEdited && <span className="ml-1">(edited)</span>}
          </span>

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
                className="px-2 py-1 rounded-full text-xs border bg-gray-100 border-gray-300"
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

  // Basic fetch functions
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

  const createOrGetRoom = async (mentorId: string, mentorName: string) => {
    try {
      const res = await fetch('/api/chat/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, mentorName })
      })
      if (res.ok) {
        const data = await res.json()
        // Refetch rooms and set active
        const fetchedRooms = await fetch('/api/chat/rooms').then(r => r.json())
        setRooms(fetchedRooms.rooms || [])
        
        const room = fetchedRooms.rooms?.find((r: ChatRoom) => r.id === data.roomId)
        if (room) {
          setActiveRoom(room)
          fetchMessages(room.id)
        }
      }
    } catch (error) {
      console.error('Error creating room:', error)
    }
  }

  // Effects
  useEffect(() => {
    if (session) {
      fetchMentors()
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
          <p className="text-gray-500">Memuat chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - Mentors & Rooms */}
      <div className="w-full sm:w-80 lg:w-96 bg-white dark:bg-gray-800 flex flex-col border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Chat</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Cari mentor atau pesan..."
              className="pl-10 h-10 bg-gray-50 dark:bg-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Mentors Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Mentors ({mentors.filter(m => m.isOnline).length} online)
          </h3>
          
          <div className="space-y-2">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                onClick={() => createOrGetRoom(mentor.id, mentor.name)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {mentor.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {mentor.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {mentor.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {mentor.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                
                {mentor.unreadCount > 0 && (
                  <Badge variant="destructive" className="min-w-0">
                    {mentor.unreadCount}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Chat Area */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={activeRoom.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {activeRoom.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {activeRoom.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeRoom.type === 'MENTOR' ? 'Mentor' : 'Chat'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4"
               onDragEnter={handleDragEnter}
               onDragLeave={handleDragLeave}
               onDragOver={handleDragOver}
               onDrop={handleDrop}>
            
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-semibold mb-2">Belum ada pesan</h4>
                  <p className="text-sm">Kirim pesan pertama untuk memulai percakapan</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
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

            {/* Drag and Drop Overlay */}
            {dragActive && (
              <div className="fixed inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-50">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-600 font-medium">Drop files here to upload</p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white dark:bg-gray-800">
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
                  <button onClick={cancelReply}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* File Upload Preview */}
            {uploadingFiles.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-2">Uploading {uploadingFiles.length} file(s)...</p>
              </div>
            )}

            <div className="flex items-end gap-3">
              {/* Media Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
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
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full"
                  title="Send image"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>

                <button
                  onMouseDown={startVoiceRecording}
                  onMouseUp={stopVoiceRecording}
                  onMouseLeave={stopVoiceRecording}
                  className={`p-2 rounded-full ${
                    isRecording 
                      ? 'text-red-600 bg-red-50' 
                      : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={isRecording ? "Recording... Release to send" : "Hold to record"}
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
                  placeholder={isRecording ? "Recording..." : "Type a message..."}
                  className="min-h-[44px] max-h-32 py-3 px-4 pr-12 rounded-2xl resize-none"
                  rows={1}
                  disabled={isRecording}
                />
                
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Smile className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {/* Send Button */}
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isRecording}
                className="h-11 w-11 rounded-full"
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
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center max-w-md">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Welcome to Chat!</h3>
            <p className="text-gray-500 mb-6">
              Pilih mentor untuk memulai percakapan
            </p>
          </div>
        </div>
      )}
    </div>
  )
}