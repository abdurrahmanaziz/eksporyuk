'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, Search, Phone, Video, Paperclip, Smile, X, Reply, ArrowLeft, MessageCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
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
  type?: string
  senderId: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  attachmentUrl?: string
  attachmentName?: string
  roomId: string
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
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return

    const messageData = {
      content: newMessage,
      roomId: activeRoom.id,
      type: 'TEXT',
      replyToId: replyingTo?.id || null
    }

    try {
      const res = await fetch('/api/chat/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (res.ok) {
        setNewMessage('')
        setReplyingTo(null)
      } else {
        toast.error('Gagal mengirim pesan')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Gagal mengirim pesan')
    }
  }

  const handleReply = (message: Message) => {
    setReplyingTo(message)
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
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
                })
              )}
              
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
                
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="h-12 pr-12 rounded-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
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
