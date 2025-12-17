'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Ticket, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface SupportTicket {
  id: string
  ticketNumber: string
  title: string
  category: string
  priority: string
  status: string
  createdAt: string
  messages: any[]
  _count: {
    messages: number
  }
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

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: 'Terbuka', color: 'bg-blue-100 text-blue-800', icon: Clock },
  IN_PROGRESS: { label: 'Diproses', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  WAITING_USER: { label: 'Menunggu Anda', color: 'bg-orange-100 text-orange-800', icon: Clock },
  RESOLVED: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CLOSED: { label: 'Ditutup', color: 'bg-gray-100 text-gray-800', icon: XCircle }
}

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Rendah', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Sedang', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Tinggi', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Mendesak', color: 'bg-red-100 text-red-600' }
}

export default function BantuanPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('my-tickets')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form state
  const [newTicket, setNewTicket] = useState({
    title: '',
    category: '',
    message: ''
  })

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const res = await fetch(`/api/support/tickets?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setTickets(data.data)
      } else {
        toast.error(data.error || 'Gagal memuat tiket')
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Gagal memuat tiket')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTicket.title || !newTicket.category || !newTicket.message) {
      toast.error('Semua field wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Tiket berhasil dibuat!')
        setNewTicket({ title: '', category: '', message: '' })
        setActiveTab('my-tickets')
        fetchTickets()
      } else {
        toast.error(data.error || 'Gagal membuat tiket')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Gagal membuat tiket')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ResponsivePageWrapper>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Ticket className="w-8 h-8 text-blue-600" />
              Bantuan & Dukungan
            </h1>
            <p className="text-gray-600 mt-2">
              Ajukan pertanyaan atau laporkan masalah Anda
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-tickets">Tiket Saya</TabsTrigger>
            <TabsTrigger value="create-ticket">Buat Tiket Baru</TabsTrigger>
          </TabsList>

          {/* My Tickets Tab */}
          <TabsContent value="my-tickets" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Cari tiket..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="OPEN">Terbuka</SelectItem>
                        <SelectItem value="IN_PROGRESS">Diproses</SelectItem>
                        <SelectItem value="WAITING_USER">Menunggu Anda</SelectItem>
                        <SelectItem value="RESOLVED">Selesai</SelectItem>
                        <SelectItem value="CLOSED">Ditutup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets List */}
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  Loading...
                </CardContent>
              </Card>
            ) : filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Belum ada tiket</p>
                  <p className="text-sm mb-4">Buat tiket pertama Anda untuk mendapatkan bantuan</p>
                  <Button onClick={() => setActiveTab('create-ticket')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Tiket Baru
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => {
                  const statusInfo = STATUS_LABELS[ticket.status]
                  const priorityInfo = PRIORITY_LABELS[ticket.priority]
                  const StatusIcon = statusInfo.icon

                  return (
                    <Card
                      key={ticket.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/bantuan/${ticket.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm text-gray-500">
                                {ticket.ticketNumber}
                              </span>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              <Badge className={priorityInfo.color}>
                                {priorityInfo.label}
                              </Badge>
                            </div>

                            <h3 className="font-semibold text-lg">{ticket.title}</h3>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                              </span>
                              <span>
                                {CATEGORY_LABELS[ticket.category]}
                              </span>
                              <span>
                                {ticket._count.messages} pesan
                              </span>
                            </div>

                            {ticket.messages[0] && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {ticket.messages[0].message}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Create Ticket Tab */}
          <TabsContent value="create-ticket">
            <Card>
              <CardHeader>
                <CardTitle>Buat Tiket Baru</CardTitle>
                <CardDescription>
                  Jelaskan masalah atau pertanyaan Anda secara detail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Judul Tiket *</Label>
                    <Input
                      id="title"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                      placeholder="Ringkasan singkat masalah Anda"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Kategori *</Label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori masalah" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">Deskripsi Masalah *</Label>
                    <Textarea
                      id="message"
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      placeholder="Jelaskan masalah Anda secara detail..."
                      rows={8}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimal 10 karakter. Semakin detail, semakin cepat kami dapat membantu.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? 'Mengirim...' : 'Kirim Tiket'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('my-tickets')}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsivePageWrapper>
  )
}
