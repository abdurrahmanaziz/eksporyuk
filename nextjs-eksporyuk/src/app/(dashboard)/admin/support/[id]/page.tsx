'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Settings, User, Bot } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const STATUS_LABELS: Record<string, any> = {
  OPEN: { label: 'Terbuka', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'Diproses', color: 'bg-yellow-100 text-yellow-800' },
  WAITING_USER: { label: 'Menunggu User', color: 'bg-orange-100 text-orange-800' },
  RESOLVED: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Ditutup', color: 'bg-gray-100 text-gray-800' }
}

const PRIORITY_LABELS: Record<string, any> = {
  LOW: { label: 'Rendah', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Sedang', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Tinggi', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Mendesak', color: 'bg-red-100 text-red-600' }
}

export default function AdminTicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params?.id as string

  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ticketId) fetchTicket()
  }, [ticketId])

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status)
      setPriority(ticket.priority)
    }
  }, [ticket])

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
        router.push('/admin/support')
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Gagal memuat tiket')
      router.push('/admin/support')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTicket = async () => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, priority })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Tiket berhasil diupdate')
        fetchTicket()
      } else {
        toast.error(data.error || 'Gagal mengupdate tiket')
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast.error('Gagal mengupdate tiket')
    } finally {
      setUpdating(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!replyMessage.trim()) {
      toast.error('Pesan tidak boleh kosong')
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
        fetchTicket()
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

  if (loading || !ticket) {
    return (
      <ResponsivePageWrapper>
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center text-gray-500">Loading...</CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  const statusInfo = STATUS_LABELS[ticket.status]
  const priorityInfo = PRIORITY_LABELS[ticket.priority]

  return (
    <ResponsivePageWrapper>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.push('/admin/support')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-gray-600">{ticket.ticketNumber}</span>
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                  <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                </div>
                <h1 className="text-2xl font-bold">{ticket.title}</h1>
                <p className="text-sm text-gray-600">
                  User: {ticket.user.name} ({ticket.user.email}) • {ticket.userRole}
                </p>
              </div>
            </div>

            {/* Messages */}
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
                  {ticket.messages.map((message: any) => {
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
                      <div key={message.id} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0">
                          {message.sender.avatar ? (
                            <img src={message.sender.avatar} alt={message.sender.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                              isAdmin ? 'bg-blue-600' : 'bg-gray-600'
                            }`}>
                              {message.sender.name[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className={`flex-1 max-w-[70%]`}>
                          <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm font-medium">{message.sender.name}</span>
                            {isAdmin && (
                              <Badge variant="outline" className="text-xs">Admin</Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {format(new Date(message.createdAt), 'HH:mm', { locale: id })}
                            </span>
                          </div>

                          <div className={`rounded-lg p-4 ${
                            isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{message.message}</p>
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
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleSendReply} className="space-y-3">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Tulis balasan..."
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
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Settings className="w-5 h-5" />
                  Pengaturan Tiket
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Terbuka</SelectItem>
                      <SelectItem value="IN_PROGRESS">Diproses</SelectItem>
                      <SelectItem value="WAITING_USER">Menunggu User</SelectItem>
                      <SelectItem value="RESOLVED">Selesai</SelectItem>
                      <SelectItem value="CLOSED">Ditutup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Prioritas</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Rendah</SelectItem>
                      <SelectItem value="MEDIUM">Sedang</SelectItem>
                      <SelectItem value="HIGH">Tinggi</SelectItem>
                      <SelectItem value="URGENT">Mendesak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleUpdateTicket}
                  disabled={updating || (status === ticket.status && priority === ticket.priority)}
                  className="w-full"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold mb-3">
                  <User className="w-5 h-5" />
                  Info User
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-600">Nama:</span> {ticket.user.name}</p>
                  <p><span className="text-gray-600">Email:</span> {ticket.user.email}</p>
                  <p><span className="text-gray-600">Role:</span> {ticket.userRole}</p>
                  <p><span className="text-gray-600">Dibuat:</span> {format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
