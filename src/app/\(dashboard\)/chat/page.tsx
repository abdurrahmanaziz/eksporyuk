'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Send, Search, Paperclip, Smile, X, MessageCircle, 
  Image as ImageIcon, Mic, Download, MoreHorizontal, 
  Upload, Phone, Video, Info, ReplyIcon, Trash2, Copy, 
  Download as DownloadIcon, Pause, Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow, format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import PusherClient from 'pusher-js'

// Common emoji list for quick access
const EMOJI_LIST = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🤔', '👏', '✨']

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
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mentorFilter, setMentorFilter] = useState<'all' | 'online' | 'unread'>('all')
  const [pusher, setPusher] = useState<PusherClient | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [recordingAudio, setRecordingAudio] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioPlayersRef = useRef<{ [key: string]: HTMLAudioElement }>({})

  const scrollToBottom = useCallback(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) 
  }, [])

  useEffect(() => { 
    scrollToBottom() 
  }, [messages, scrollToBottom])

  // Fetch data
  useEffect(() => {
    if (!session?.user?.id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const [roomsRes, mentorsRes] = await Promise.all([
          fetch('/api/chat/rooms'), 
          fetch('/api/chat/mentors')
        ])
        if (roomsRes.ok) { 
          const d = await roomsRes.json()
          setRooms(d.rooms || []) 
        }
        if (mentorsRes.ok) { 
          const d = await mentorsRes.json()
          setMentors(d || []) 
        }
      } catch (e) { 
        console.error(e) 
      }
      setLoading(false)
    }
    fetchData()
  }, [session?.user?.id])

  // Fetch messages
  useEffect(() => {
    if (!activeRoom?.id) return
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?roomId=${activeRoom.id}`)
        if (res.ok) { 
          const d = await res.json()
          setMessages(d.messages || []) 
        }
      } catch (e) { 
        console.error(e) 
      }
    }
    fetchMessages()
  }, [activeRoom?.id])

  // Pusher
  useEffect(() => {
    if (!session?.user?.id) return
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster) return
    const client = new PusherClient(key, { cluster, forceTLS: true, authEndpoint: '/api/pusher/auth' })
    setPusher(client)
    const ch = client.subscribe(`user-${session.user.id}`)
    ch.bind('new-message', (d: any) => {
      setRooms(prev => prev.map(r => r.id === d.roomId ? { 
        ...r, 
        lastMessage: { content: d.content, createdAt: new Date().toISOString() }, 
        unreadCount: r.unreadCount + 1 
      } : r))
    })
    return () => { client.disconnect() }
  }, [session?.user?.id])

  useEffect(() => {
    if (!pusher || !activeRoom?.id) return
    const ch = pusher.subscribe(`private-room-${activeRoom.id}`)
    ch.bind('new-message', (d: any) => { 
      if (d.id) setMessages(prev => prev.some(m => m.id === d.id) ? prev : [...prev, d]) 
    })
    return () => { pusher.unsubscribe(`private-room-${activeRoom.id}`) }
  }, [pusher, activeRoom?.id])

  const selectRoom = async (room: ChatRoom) => {
    setActiveRoom(room)
    setReplyTo(null)
    try { 
      await fetch('/api/chat/read', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ roomId: room.id }) 
      })
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r)) 
    } catch {}
  }

  const startChat = async (mentorId: string) => {
    try {
      const res = await fetch('/api/chat/start', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ userId: mentorId }) 
      })
      if (res.ok) { 
        const d = await res.json()
        setRooms(prev => prev.find(r => r.id === d.room.id) ? prev : [d.room, ...prev])
        selectRoom(d.room) 
      }
    } catch { 
      toast.error('Gagal memulai chat') 
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || sending) return
    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)
    try {
      const res = await fetch('/api/chat/send', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          roomId: activeRoom.id, 
          content, 
          type: 'TEXT',
          replyToId: replyTo?.id
        }) 
      })
      if (res.ok) { 
        const d = await res.json()
        setMessages(prev => [...prev, d.message])
        setRooms(prev => prev.map(r => r.id === activeRoom.id ? { 
          ...r, 
          lastMessage: { content, createdAt: new Date().toISOString() } 
        } : r))
        setReplyTo(null)
      }
      else { 
        toast.error('Gagal mengirim')
        setNewMessage(content) 
      }
    } catch { 
      toast.error('Gagal mengirim')
      setNewMessage(content) 
    }
    setSending(false)
  }

  const handleMediaFile = async (file: File, type: 'IMAGE' | 'VIDEO' | 'FILE') => {
    if (!file || !activeRoom) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('roomId', activeRoom.id)
    fd.append('type', type)
    try { 
      const res = await fetch('/api/chat/upload', { method: 'POST', body: fd })
      if (res.ok) { 
        const d = await res.json()
        setMessages(prev => [...prev, d.message])
        setRooms(prev => prev.map(r => r.id === activeRoom.id ? { 
          ...r, 
          lastMessage: { 
            content: `[${type === 'IMAGE' ? 'Foto' : type === 'VIDEO' ? 'Video' : 'File'}]`, 
            createdAt: new Date().toISOString() 
          } 
        } : r))
      } else { 
        toast.error('Upload gagal') 
      }
    } catch { 
      toast.error('Upload gagal') 
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleMediaFile(file, 'IMAGE')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleMediaFile(file, 'VIDEO')
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleMediaFile(file, 'FILE')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' })
        await handleMediaFile(file, 'AUDIO')
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecordingAudio(true)
    } catch (err) {
      toast.error('Tidak bisa mengakses microphone')
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecordingAudio(false)
    }
  }

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const playAudio = (messageId: string, audioUrl: string) => {
    if (playingAudioId === messageId) {
      // Stop playing
      const audio = audioPlayersRef.current[messageId]
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setPlayingAudioId(null)
    } else {
      // Play audio
      let audio = audioPlayersRef.current[messageId]
      if (!audio) {
        audio = new Audio(audioUrl)
        audioPlayersRef.current[messageId] = audio
      }
      audio.play()
      setPlayingAudioId(messageId)
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  const filteredMentors = mentors.filter(m => { 
    const match = m.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return mentorFilter === 'online' ? match && m.isOnline : match 
  })
  const filteredRooms = rooms.filter(r => r.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  const otherUser = activeRoom?.participants?.find(p => p?.user?.id !== session?.user?.id)?.user

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-[30%] bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold">Chat</h1>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input 
              placeholder="Search..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            filteredRooms.map(room => {
              const other = room.participants?.find(p => p?.user?.id !== session?.user?.id)?.user
              return (
                <div 
                  key={room.id} 
                  onClick={() => selectRoom(room)}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    activeRoom?.id === room.id && "bg-muted"
                  )}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={room.avatar || other?.avatar} />
                      <AvatarFallback>{room.name?.[0]}</AvatarFallback>
                    </Avatar>
                    {other?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold truncate">{room.name}</h3>
                      {room.lastMessage && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: true, locale: idLocale })}
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm text-muted-foreground truncate",
                      room.unreadCount > 0 && "font-bold text-foreground"
                    )}>
                      {room.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {room.unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground rounded-full flex-shrink-0">{room.unreadCount}</Badge>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-[70%] flex flex-col bg-gradient-to-b from-card to-background">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={activeRoom.avatar || otherUser?.avatar} />
                    <AvatarFallback>{activeRoom.name?.[0]}</AvatarFallback>
                  </Avatar>
                  {otherUser?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{activeRoom.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {otherUser?.isOnline ? '🟢 Online' : '⚫ Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" title="Call"><Phone size={20} /></Button>
                <Button variant="ghost" size="icon" title="Video call"><Video size={20} /></Button>
                <Button variant="ghost" size="icon" title="Info"><Info size={20} /></Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.senderId === session?.user?.id
                  const prevMessage = messages[index - 1]
                  const nextMessage = messages[index + 1]
                  const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId)
                  const showName = !isOwn && showAvatar
                  const isConsecutive = prevMessage && prevMessage.senderId === message.senderId
                  const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId

                  return (
                    <div
                      key={message.id}
                      className={cn("flex gap-2 group", isOwn && "flex-row-reverse justify-end")}
                      onMouseEnter={() => setHoveredMessageId(message.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      {showAvatar ? (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={message.sender?.avatar} />
                          <AvatarFallback>{message.sender?.name?.[0]}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 flex-shrink-0"></div>
                      )}

                      <div className={cn("flex flex-col", isOwn && "items-end")}>
                        {showName && (
                          <span className="text-xs text-muted-foreground mb-1 ml-2">{message.sender?.name}</span>
                        )}
                        <div className={cn(
                          "relative group/message",
                          isConsecutive && isOwn && "mr-0",
                          isConsecutive && !isOwn && "ml-10"
                        )}>
                          {/* Message Bubble */}
                          <div className={cn(
                            "p-3 rounded-2xl max-w-xs break-words shadow-sm",
                            isOwn 
                              ? "bg-blue-500 text-white rounded-br-none" 
                              : "bg-muted text-foreground rounded-bl-none"
                          )}>
                            {/* Reply To */}
                            {message.replyTo && (
                              <div className={cn(
                                "mb-2 pb-2 border-l-2 pl-2 text-xs opacity-75",
                                isOwn ? "border-blue-300" : "border-primary"
                              )}>
                                <p className="font-semibold">{message.replyTo.sender.name}</p>
                                <p className="truncate">{message.replyTo.content}</p>
                              </div>
                            )}

                            {/* Attachment */}
                            {message.attachment && (
                              <div className="mb-2">
                                {message.attachment.type === 'IMAGE' && (
                                  <img 
                                    src={message.attachment.url} 
                                    alt="Attached image"
                                    className="rounded-lg max-w-full h-auto max-h-48"
                                  />
                                )}
                                {message.attachment.type === 'VIDEO' && (
                                  <video 
                                    src={message.attachment.url}
                                    className="rounded-lg max-w-full h-auto max-h-48"
                                    controls
                                  />
                                )}
                                {message.attachment.type === 'AUDIO' && (
                                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                                    <button
                                      onClick={() => playAudio(message.id, message.attachment!.url)}
                                      className="hover:scale-110 transition-transform"
                                    >
                                      {playingAudioId === message.id ? (
                                        <Pause size={20} />
                                      ) : (
                                        <Play size={20} />
                                      )}
                                    </button>
                                    <span className="text-xs">Audio message</span>
                                  </div>
                                )}
                                {message.attachment.type === 'FILE' && (
                                  <a
                                    href={message.attachment.url}
                                    download={message.attachment.name}
                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 transition-colors"
                                  >
                                    <DownloadIcon size={16} />
                                    <span className="text-xs truncate">{message.attachment.name}</span>
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Text Content */}
                            <p className="text-sm break-words">{message.content}</p>

                            {/* Time */}
                            <p className={cn(
                              "text-xs mt-1 text-right",
                              isOwn ? "text-blue-100" : "text-muted-foreground"
                            )}>
                              {format(new Date(message.createdAt), 'HH:mm')}
                            </p>
                          </div>

                          {/* Message Actions */}
                          {hoveredMessageId === message.id && (
                            <div className={cn(
                              "absolute -top-10 flex gap-1 bg-card border border-border rounded-lg p-1 shadow-lg",
                              isOwn ? "right-0" : "left-0"
                            )}>
                              <button
                                onClick={() => setReplyTo(message)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Reply"
                              >
                                <ReplyIcon size={16} />
                              </button>
                              <button
                                onClick={() => copyMessage(message.content)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Copy"
                              >
                                <Copy size={16} />
                              </button>
                              {isOwn && (
                                <button
                                  className="p-1 hover:bg-muted rounded transition-colors text-red-500"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
              <div className="px-4 py-2 border-t border-border bg-muted/50 flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Replying to {replyTo.sender.name}</p>
                  <p className="text-sm truncate">{replyTo.content}</p>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <div className="space-y-2">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="bg-muted rounded-lg p-3 flex gap-2 flex-wrap">
                    {EMOJI_LIST.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="text-2xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <div className="flex items-end gap-2">
                  {/* File Actions */}
                  <div className="flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" title="Attach">
                          <Paperclip size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                          <ImageIcon size={16} className="mr-2" /> Photo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => videoInputRef.current?.click()}>
                          <Video size={16} className="mr-2" /> Video
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                          <Paperclip size={16} className="mr-2" /> File
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Audio Recording */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={recordingAudio ? stopAudioRecording : startAudioRecording}
                      className={recordingAudio ? "text-red-500" : ""}
                      title={recordingAudio ? "Stop recording" : "Record audio"}
                    >
                      <Mic size={20} />
                    </Button>

                    {/* Emoji Picker Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Emoji"
                    >
                      <Smile size={20} />
                    </Button>
                  </div>

                  {/* Text Input */}
                  <Textarea 
                    placeholder={recordingAudio ? "Recording audio..." : "Type a message..."}
                    className="flex-1 resize-none max-h-32"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    disabled={recordingAudio}
                  />

                  {/* Send Button */}
                  <Button 
                    onClick={sendMessage} 
                    disabled={(!newMessage.trim() && !recordingAudio) || sending}
                    className="flex-shrink-0"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>

              {/* Hidden File Inputs */}
              <input 
                type="file" 
                ref={imageInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              <input 
                type="file" 
                ref={videoInputRef} 
                onChange={handleVideoUpload} 
                className="hidden" 
                accept="video/*"
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">No chat selected</h2>
              <p className="text-muted-foreground mt-2">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
