'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { ResponsivePageWrapper } from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Clock, User, Bot } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface Message {
  id: string
  message: string
  createdAt: string
  isSystemMessage: boolean
  sender: {
    id: string
    name: string
    avatar?: string
    role: string
  }
}

interface Ticket {
  id: string
  ticketNumber: string
  title: string
  category: string
  priority: string
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  assignedTo?: {
    id: string
    name: string
  }
  messages: Message[]
}

const CATEGORY_LABELS: Record<string, string> = {
  ACCOUNT_LOGIN: 'Akun & Login',
  MEMBERSHIP_PAYMENT: 'Membership & Pembayaran',
  COURSE: 'Kelas',
  AFFILIATE: 'Affiliate',
  ADS_TRACKING: 'Iklan & Tracking',
  BUG_SYSTEM: 'Bug Sistem',
  OTHER: 'Lainnya'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Terbuka', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'Diproses', color: 'bg-yellow-100 text-yellow-800' },
  WAITING_USER: { label: 'Menunggu Anda', color: 'bg-orange-100 text-orange-800' },
  RESOLVED: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Ditutup', color: 'bg-gray-100 text-gray-800' }
}

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Rendah', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Sedang', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Tinggi', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Mendesak', color: 'bg-red-100 text-red-600' }
}

export default function TicketDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const ticketId = params?.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])

  useEffect(() => {
    scrollToBottom()
  }, [ticket?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTicket = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`)
      const data = await res.json()

      if (data.success) {
        setTicket(data.data)
      } else {
        toast.error(data.error || 'Gagal memuat tiket')
        router.push('/dashboard/bantuan')
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Gagal memuat tiket')
      router.push('/dashboard/bantuan')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!replyMessage.trim()) {
      toast.error('Pesan tidak boleh kosong')
      return
    }

    if (ticket?.status === 'CLOSED') {
      toast.error('Tidak bisa membalas tiket yang sudah ditutup')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Balasan terkirim')
        setReplyMessage('')
        fetchTicket() // Refresh to show new message
      } else {
        toast.error(data.error || 'Gagal mengirim balasan')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Gagal mengirim balasan')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Loading...
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!ticket) {
    return null
  }

  const statusInfo = STATUS_LABELS[ticket.status]
  const priorityInfo = PRIORITY_LABELS[ticket.priority]

  return (
    <ResponsivePageWrapper>
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/bantuan')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-gray-600">
                {ticket.ticketNumber}
              </span>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              <Badge className={priorityInfo.color}>
                {priorityInfo.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <p className="text-sm text-gray-600">
              {CATEGORY_LABELS[ticket.category]} • Dibuat {format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
            </p>
          </div>
        </div>

        {/* Messages */}
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto p-6 space-y-4">
              {ticket.messages.map((message) => {
                const isCurrentUser = message.sender.id === session?.user?.id
                const isAdmin = message.sender.role === 'ADMIN'

                if (message.isSystemMessage) {
                  return (
                    <div key={message.id} className="flex items-center justify-center">
                      <div className="bg-gray-100 text-gray-600 text-xs px-4 py-2 rounded-full flex items-center gap-2">
                        <Bot className="w-3 h-3" />
                        {message.message}
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      {message.sender.avatar ? (
                        <img
                          src={message.sender.avatar}
                          alt={message.sender.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                          isAdmin ? 'bg-blue-600' : 'bg-gray-600'
                        }`}>
                          {message.sender.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'items-end' : ''}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-medium">
                          {isCurrentUser ? 'Anda' : message.sender.name}
                        </span>
                        {isAdmin && !isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            Tim Support
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.createdAt), 'HH:mm', { locale: id })}
                        </span>
                      </div>

                      <div
                        className={`rounded-lg p-4 ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white'
                            : isAdmin
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-gray-50 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Reply Form */}
        {ticket.status !== 'CLOSED' ? (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSendReply} className="space-y-3">
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Tulis balasan Anda..."
                  rows={4}
                  disabled={sending}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={sending || !replyMessage.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    {sending ? 'Mengirim...' : 'Kirim Balasan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-50">
            <CardContent className="p-6 text-center text-gray-600">
              <p className="font-medium">Tiket ini telah ditutup</p>
              <p className="text-sm">Anda tidak dapat menambahkan balasan lagi</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
