'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Send, Search, Paperclip, Smile, X, MessageCircle, 
  Image as ImageIcon, Video, Mic, ArrowLeft, Phone, MoreVertical
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import PusherClient from 'pusher-js'

// ============= TYPES =============
interface Mentor {
  id: string
  name: string
  avatar?: string
  isOnline: boolean
  role: string
}

interface ChatRoom {
  id: string
  name: string
  avatar?: string
  lastMessage?: { content: string; createdAt: string }
  unreadCount: number
  participants: Array<{
    user: { id: string; name: string; avatar?: string; isOnline: boolean; role?: string }
  }>
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  type: string
  sender: { id: string; name: string; avatar?: string }
  attachment?: { url: string; name: string }
}

// ============= MAIN COMPONENT =============
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
  const [showMobileSidebar, setShowMobileSidebar] = useState(true)
  const [mentorFilter, setMentorFilter] = useState<'all' | 'online' | 'unread'>('all')
  const [pusherClient, setPusherClient] = useState<PusherClient | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // ===== FETCH DATA =====
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
          const data = await roomsRes.json()
          setRooms(data.rooms || [])
        }
        
        if (mentorsRes.ok) {
          const data = await mentorsRes.json()
          setMentors(data || [])
        }
      } catch (e) {
        console.error('Fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [session?.user?.id])

  // ===== FETCH MESSAGES =====
  useEffect(() => {
    if (!activeRoom?.id) return
    
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?roomId=${activeRoom.id}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch (e) {
        console.error('Messages error:', e)
      }
    }
    
    fetchMessages()
  }, [activeRoom?.id])

  // ===== PUSHER =====
  useEffect(() => {
    if (!session?.user?.id) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!pusherKey || !pusherCluster) return

    const client = new PusherClient(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
      authEndpoint: '/api/pusher/auth'
    })

    setPusherClient(client)

    const userChannel = client.subscribe(`user-${session.user.id}`)
    userChannel.bind('new-message', (data: any) => {
      setRooms(prev => prev.map(room => 
        room.id === data.roomId 
          ? { ...room, lastMessage: { content: data.content, createdAt: new Date().toISOString() }, unreadCount: room.unreadCount + 1 }
          : room
      ))
    })

    return () => { client.disconnect() }
  }, [session?.user?.id])

  // Subscribe to room
  useEffect(() => {
    if (!pusherClient || !activeRoom?.id) return

    const channel = pusherClient.subscribe(`private-room-${activeRoom.id}`)
    channel.bind('new-message', (data: any) => {
      if (data.id) {
        setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data])
      }
    })

    return () => { pusherClient.unsubscribe(`private-room-${activeRoom.id}`) }
  }, [pusherClient, activeRoom?.id])

  // ===== SELECT ROOM =====
  const selectRoom = async (room: ChatRoom) => {
    setActiveRoom(room)
    setShowMobileSidebar(false)
    
    try {
      await fetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id })
      })
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r))
    } catch (e) {}
  }

  // ===== START CHAT WITH MENTOR =====
  const startChat = async (mentorId: string) => {
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: mentorId })
      })
      
      if (res.ok) {
        const data = await res.json()
        const room = data.room
        setRooms(prev => prev.find(r => r.id === room.id) ? prev : [room, ...prev])
        selectRoom(room)
      }
    } catch (e) {
      toast.error('Gagal memulai chat')
    }
  }

  // ===== SEND MESSAGE =====
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || sending) return
    
    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)
    
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: activeRoom.id, content, type: 'TEXT' })
      })
      
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        setRooms(prev => prev.map(r => 
          r.id === activeRoom.id ? { ...r, lastMessage: { content, createdAt: new Date().toISOString() } } : r
        ))
        scrollToBottom()
      } else {
        toast.error('Gagal mengirim')
        setNewMessage(content)
      }
    } catch (e) {
      toast.error('Gagal mengirim')
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  // ===== FILE UPLOAD =====
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeRoom) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('roomId', activeRoom.id)
    
    try {
      const res = await fetch('/api/chat/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
      }
    } catch (e) {
      toast.error('Upload gagal')
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ===== FILTERS =====
  const filteredMentors = mentors.filter(m => {
    const match = m.name?.toLowerCase().includes(searchQuery.toLowerCase())
    if (mentorFilter === 'online') return match && m.isOnline
    return match
  })

  const filteredRooms = rooms.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getOtherUser = () => {
    if (!activeRoom || !session?.user?.id) return null
    return activeRoom.participants.find(p => p.user.id !== session.user.id)?.user
  }

  const otherUser = getOtherUser()

  // ===== RENDER =====
  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 flex">
      
      {/* ===== LEFT: Chat List (30%) ===== */}
      <aside className={cn(
        "h-full bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col",
        "absolute inset-y-0 left-0 z-20 transition-transform duration-300 lg:static lg:translate-x-0",
        showMobileSidebar ? "translate-x-0" : "-translate-x-full",
        "w-[85%] sm:w-80 lg:w-[30%] lg:min-w-[300px] lg:max-w-[380px]"
      )}>
        {/* Header */}
        <div className="p-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search mentors or messages..."
              className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Mentor Section */}
        <div className="px-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Chat Dengan Mentor</span>
            <span className="text-xs text-blue-600 cursor-pointer hover:underline">Lihat Semua</span>
          </div>
          
          {/* Filter Pills */}
          <div className="flex gap-2 mb-3">
            {(['all', 'online', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setMentorFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition",
                  mentorFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {f === 'all' ? 'All' : f === 'online' ? 'Online' : 'Unread'}
              </button>
            ))}
          </div>
          
          {/* Mentor Avatars - Horizontal Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="w-14 h-14 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />)
            ) : filteredMentors.length === 0 ? (
              <p className="text-xs text-gray-400">Tidak ada mentor</p>
            ) : (
              filteredMentors.slice(0, 6).map(mentor => (
                <button
                  key={mentor.id}
                  onClick={() => startChat(mentor.id)}
                  className="flex flex-col items-center gap-1 min-w-[60px] group"
                >
                  <div className="relative">
                    <Avatar className="w-14 h-14 border-2 border-white shadow-md group-hover:scale-105 transition">
                      <AvatarImage src={mentor.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {mentor.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      "absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                      mentor.isOnline ? "bg-green-500" : "bg-gray-400"
                    )} />
                  </div>
                  <span className="text-[11px] text-gray-600 truncate w-14 text-center font-medium">
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
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada percakapan</p>
              <p className="text-xs text-gray-400 mt-1">Klik mentor untuk mulai chat</p>
            </div>
          ) : (
            filteredRooms.map(room => {
              const participant = room.participants?.find(p => p.user.id !== session?.user?.id)?.user
              const isMentor = participant?.role === 'MENTOR' || participant?.role === 'ADMIN'
              
              return (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left",
                    activeRoom?.id === room.id && "bg-blue-50 border-l-4 border-blue-600"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={room.avatar} />
                      <AvatarFallback className={cn(
                        "text-white font-bold",
                        isMentor ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-blue-500 to-cyan-500"
                      )}>
                        {room.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {participant?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{room.name}</h3>
                        {isMentor && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-700 rounded">MENTOR</span>
                        )}
                      </div>
                      {room.lastMessage && (
                        <span className="text-[10px] text-gray-400">
                          {formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: false, locale: idLocale })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate pr-2">
                        {room.lastMessage?.content || 'No messages yet'}
                      </p>
                      {room.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* ===== RIGHT: Chat Area (70%) ===== */}
      <main className="flex-1 h-full flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0">
        
        {!activeRoom ? (
          /* Welcome State */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center mb-5 shadow-lg">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Hello, {session?.user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-500 text-sm text-center max-w-md">
              Welcome to the mentor chat. Ask any questions about exports, logistics, or regulations. We're here to help!
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg -ml-1">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activeRoom.avatar || otherUser?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold">
                    {activeRoom.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="font-semibold text-gray-900">{activeRoom.name}</h2>
                  <p className={cn("text-xs flex items-center gap-1", otherUser?.isOnline ? "text-green-500" : "text-gray-400")}>
                    <span className={cn("w-2 h-2 rounded-full", otherUser?.isOnline ? "bg-green-500" : "bg-gray-400")} />
                    {otherUser?.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-gray-100 rounded-lg"><Phone className="w-5 h-5 text-gray-500" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg"><Video className="w-5 h-5 text-gray-500" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg"><MoreVertical className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Hello, {session?.user?.name?.split(' ')[0]}! 👋</h3>
                  <p className="text-sm text-gray-500">Welcome to the mentor chat. Ask any questions about exports, logistics, or regulations. We're here to help!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.senderId === session?.user?.id
                  return (
                    <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                      {!isOwn && (
                        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
                          <AvatarImage src={msg.sender?.avatar} />
                          <AvatarFallback className="bg-green-500 text-white text-xs">{msg.sender?.name?.[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5",
                        isOwn 
                          ? "bg-blue-600 text-white rounded-br-md" 
                          : "bg-white border border-gray-100 shadow-sm rounded-bl-md"
                      )}>
                        {!isOwn && <p className="text-xs font-semibold text-green-600 mb-1">{msg.sender?.name}</p>}
                        
                        {msg.type === 'IMAGE' && msg.attachment && (
                          <img src={msg.attachment.url} alt="" className="max-w-full rounded-lg mb-2" />
                        )}
                        
                        <p className={cn("text-sm", !isOwn && "text-gray-800")}>{msg.content}</p>
                        <p className={cn("text-[10px] mt-1 text-right", isOwn ? "text-blue-200" : "text-gray-400")}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Match Design */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="Type your message here..."
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-800 placeholder-gray-400"
                  />
                </div>
                
                {/* Action Icons */}
                <div className="flex items-center gap-1">
                  <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Video className="w-5 h-5 text-gray-400" />
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Paperclip className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Mic className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Smile className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-full flex items-center justify-center transition shadow-lg"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
