'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Search, Paperclip, Smile, MessageCircle, Image as ImageIcon, Video, Mic, ArrowLeft, Phone, MoreVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import PusherClient from 'pusher-js'

interface Mentor { id: string; name: string; avatar?: string; isOnline: boolean; role: string }
interface ChatRoom { id: string; name: string; avatar?: string; lastMessage?: { content: string; createdAt: string }; unreadCount: number; participants: Array<{ user: { id: string; name: string; avatar?: string; isOnline: boolean; role?: string } }> }
interface Message { id: string; content: string; senderId: string; createdAt: string; type: string; sender: { id: string; name: string; avatar?: string }; attachment?: { url: string; name: string } }

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [])
  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Fetch data
  useEffect(() => {
    if (!session?.user?.id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const [roomsRes, mentorsRes] = await Promise.all([fetch('/api/chat/rooms'), fetch('/api/chat/mentors')])
        if (roomsRes.ok) { const d = await roomsRes.json(); setRooms(d.rooms || []) }
        if (mentorsRes.ok) { const d = await mentorsRes.json(); setMentors(d || []) }
      } catch (e) { console.error(e) }
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
        if (res.ok) { const d = await res.json(); setMessages(d.messages || []) }
      } catch (e) { console.error(e) }
    }
    fetchMessages()
  }, [activeRoom?.id])

  // Pusher
  useEffect(() => {
    if (!session?.user?.id) return
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY, cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster) return
    const client = new PusherClient(key, { cluster, forceTLS: true, authEndpoint: '/api/pusher/auth' })
    setPusher(client)
    const ch = client.subscribe(`user-${session.user.id}`)
    ch.bind('new-message', (d: any) => {
      setRooms(prev => prev.map(r => r.id === d.roomId ? { ...r, lastMessage: { content: d.content, createdAt: new Date().toISOString() }, unreadCount: r.unreadCount + 1 } : r))
    })
    return () => { client.disconnect() }
  }, [session?.user?.id])

  useEffect(() => {
    if (!pusher || !activeRoom?.id) return
    const ch = pusher.subscribe(`private-room-${activeRoom.id}`)
    ch.bind('new-message', (d: any) => { if (d.id) setMessages(prev => prev.some(m => m.id === d.id) ? prev : [...prev, d]) })
    return () => { pusher.unsubscribe(`private-room-${activeRoom.id}`) }
  }, [pusher, activeRoom?.id])

  const selectRoom = async (room: ChatRoom) => {
    setActiveRoom(room)
    try { await fetch('/api/chat/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId: room.id }) }); setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r)) } catch {}
  }

  const startChat = async (mentorId: string) => {
    try {
      const res = await fetch('/api/chat/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: mentorId }) })
      if (res.ok) { const d = await res.json(); setRooms(prev => prev.find(r => r.id === d.room.id) ? prev : [d.room, ...prev]); selectRoom(d.room) }
    } catch { toast.error('Gagal memulai chat') }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || sending) return
    const content = newMessage.trim(); setNewMessage(''); setSending(true)
    try {
      const res = await fetch('/api/chat/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId: activeRoom.id, content, type: 'TEXT' }) })
      if (res.ok) { const d = await res.json(); setMessages(prev => [...prev, d.message]); setRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, lastMessage: { content, createdAt: new Date().toISOString() } } : r)) }
      else { toast.error('Gagal mengirim'); setNewMessage(content) }
    } catch { toast.error('Gagal mengirim'); setNewMessage(content) }
    setSending(false)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !activeRoom) return
    const fd = new FormData(); fd.append('file', file); fd.append('roomId', activeRoom.id)
    try { const res = await fetch('/api/chat/upload', { method: 'POST', body: fd }); if (res.ok) { const d = await res.json(); setMessages(prev => [...prev, d.message]) } } catch { toast.error('Upload gagal') }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const filteredMentors = mentors.filter(m => { const match = m.name?.toLowerCase().includes(searchQuery.toLowerCase()); return mentorFilter === 'online' ? match && m.isOnline : match })
  const filteredRooms = rooms.filter(r => r.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  const otherUser = activeRoom?.participants.find(p => p.user.id !== session?.user?.id)?.user

  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow border border-gray-200 dark:border-gray-700">
      <div className="h-full flex">
        {/* LEFT: Chat List 30% */}
        <div className={cn(
          "h-full bg-white dark:bg-gray-800 border-r border-gray-100 flex flex-col flex-shrink-0",
          "w-full sm:w-80 lg:w-[30%] lg:min-w-[300px] lg:max-w-[380px]",
          activeRoom ? "hidden lg:flex" : "flex"
        )}>
          {/* Header */}
          <div className="p-4">
            <h1 className="text-xl font-bold text-gray-900 mb-3">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search mentors or messages..." className="pl-9 bg-gray-50 border-gray-200 rounded-xl h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>

          {/* Mentors */}
          <div className="px-4 pb-3 border-b border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Chat Dengan Mentor</span>
              <span className="text-xs text-blue-600">Lihat Semua</span>
            </div>
            <div className="flex gap-2 mb-3">
              {(['all', 'online', 'unread'] as const).map(f => (
                <button key={f} onClick={() => setMentorFilter(f)} className={cn("px-3 py-1 rounded-full text-xs font-medium", mentorFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>{f === 'all' ? 'All' : f === 'online' ? 'Online' : 'Unread'}</button>
              ))}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {loading ? [1,2,3,4].map(i => <div key={i} className="w-14 h-14 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />) : 
               filteredMentors.length === 0 ? <p className="text-xs text-gray-400">Tidak ada mentor</p> :
               filteredMentors.slice(0, 6).map(m => (
                <button key={m.id} onClick={() => startChat(m.id)} className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="relative">
                    <Avatar className="w-14 h-14 border-2 border-white shadow-md"><AvatarImage src={m.avatar} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">{m.name?.[0]}</AvatarFallback></Avatar>
                    <span className={cn("absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white", m.isOnline ? "bg-green-500" : "bg-gray-400")} />
                  </div>
                  <span className="text-[11px] text-gray-600 truncate w-14 text-center">{m.name?.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="flex gap-3 animate-pulse"><div className="w-12 h-12 rounded-full bg-gray-200" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div></div>)}</div> :
             filteredRooms.length === 0 ? <div className="text-center py-12"><MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-sm text-gray-500">Belum ada percakapan</p></div> :
             filteredRooms.map(room => {
               const other = room.participants?.find(p => p.user.id !== session?.user?.id)?.user
               const isMentor = other?.role === 'MENTOR' || other?.role === 'ADMIN'
               return (
                 <button key={room.id} onClick={() => selectRoom(room)} className={cn("w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left", activeRoom?.id === room.id && "bg-blue-50 border-l-4 border-blue-600")}>
                   <div className="relative flex-shrink-0">
                     <Avatar className="w-12 h-12"><AvatarImage src={room.avatar} /><AvatarFallback className={cn("text-white font-bold", isMentor ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-blue-500 to-cyan-500")}>{room.name?.[0]}</AvatarFallback></Avatar>
                     {other?.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <h3 className="text-sm font-semibold text-gray-900 truncate">{room.name}</h3>
                         {isMentor && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-700 rounded">MENTOR</span>}
                       </div>
                       {room.lastMessage && <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: false, locale: idLocale })}</span>}
                     </div>
                     <div className="flex items-center justify-between mt-0.5">
                       <p className="text-xs text-gray-500 truncate pr-2">{room.lastMessage?.content || 'No messages yet'}</p>
                       {room.unreadCount > 0 && <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{room.unreadCount}</span>}
                     </div>
                   </div>
                 </button>
               )
             })}
          </div>
        </div>

        {/* RIGHT: Chat Area 70% */}
        <div className={cn("flex-1 h-full flex flex-col bg-gray-50 min-w-0", !activeRoom && "hidden lg:flex")}>
          {!activeRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center mb-5 shadow-lg"><MessageCircle className="w-10 h-10 text-white" /></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Hello, {session?.user?.name?.split(' ')[0]}! 👋</h2>
              <p className="text-gray-500 text-sm text-center max-w-md">Welcome to the mentor chat. Ask any questions about exports, logistics, or regulations. We're here to help!</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveRoom(null)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg -ml-1"><ArrowLeft className="w-5 h-5" /></button>
                  <Avatar className="w-10 h-10"><AvatarImage src={activeRoom.avatar || otherUser?.avatar} /><AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold">{activeRoom.name?.[0]}</AvatarFallback></Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900">{activeRoom.name}</h2>
                    <p className={cn("text-xs flex items-center gap-1", otherUser?.isOnline ? "text-green-500" : "text-gray-400")}><span className={cn("w-2 h-2 rounded-full", otherUser?.isOnline ? "bg-green-500" : "bg-gray-400")} />{otherUser?.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-lg"><Phone className="w-5 h-5 text-gray-500" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg"><Video className="w-5 h-5 text-gray-500" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg"><MoreVertical className="w-5 h-5 text-gray-500" /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3"><MessageCircle className="w-8 h-8 text-white" /></div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Hello, {session?.user?.name?.split(' ')[0]}! 👋</h3>
                    <p className="text-sm text-gray-500">Welcome to the mentor chat. Ask any questions about exports, logistics, or regulations. We're here to help!</p>
                  </div>
                ) : messages.map(msg => {
                  const isOwn = msg.senderId === session?.user?.id
                  return (
                    <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                      {!isOwn && <Avatar className="w-8 h-8 mr-2 flex-shrink-0"><AvatarImage src={msg.sender?.avatar} /><AvatarFallback className="bg-green-500 text-white text-xs">{msg.sender?.name?.[0]}</AvatarFallback></Avatar>}
                      <div className={cn("max-w-[70%] rounded-2xl px-4 py-2.5", isOwn ? "bg-blue-600 text-white rounded-br-md" : "bg-white border border-gray-100 shadow-sm rounded-bl-md")}>
                        {!isOwn && <p className="text-xs font-semibold text-green-600 mb-1">{msg.sender?.name}</p>}
                        {msg.type === 'IMAGE' && msg.attachment && <img src={msg.attachment.url} alt="" className="max-w-full rounded-lg mb-2" />}
                        <p className={cn("text-sm", !isOwn && "text-gray-800")}>{msg.content}</p>
                        <p className={cn("text-[10px] mt-1 text-right", isOwn ? "text-blue-200" : "text-gray-400")}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type your message here..." className="w-full bg-transparent border-0 outline-none text-sm" />
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" accept="image/*,video/*,.pdf" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg"><ImageIcon className="w-5 h-5 text-gray-400" /></button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg"><Video className="w-5 h-5 text-gray-400" /></button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg"><Paperclip className="w-5 h-5 text-gray-400" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg"><Mic className="w-5 h-5 text-gray-400" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg"><Smile className="w-5 h-5 text-gray-400" /></button>
                  <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-full flex items-center justify-center shadow-lg"><Send className="w-5 h-5 text-white" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
