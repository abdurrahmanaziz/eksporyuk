'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Ticket, Search, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const STATUS_LABELS: Record<string, any> = {
  OPEN: { label: 'Terbuka', color: 'bg-blue-100 text-blue-800', icon: Clock },
  IN_PROGRESS: { label: 'Diproses', color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp },
  WAITING_USER: { label: 'Menunggu User', color: 'bg-orange-100 text-orange-800', icon: Clock },
  RESOLVED: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CLOSED: { label: 'Ditutup', color: 'bg-gray-100 text-gray-800', icon: XCircle }
}

const PRIORITY_LABELS: Record<string, any> = {
  LOW: { label: 'Rendah', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Sedang', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Tinggi', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Mendesak', color: 'bg-red-100 text-red-600' }
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

export default function AdminSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [statusFilter, priorityFilter, categoryFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)

      const [ticketsRes, statsRes] = await Promise.all([
        fetch(`/api/support/tickets?${params.toString()}`),
        fetch('/api/support/stats')
      ])

      const ticketsData = await ticketsRes.json()
      const statsData = await statsRes.json()

      if (ticketsData.success) setTickets(ticketsData.data)
      if (statsData.success) setStats(statsData.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ResponsivePageWrapper>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Ticket className="w-8 h-8 text-blue-600" />
            Manajemen Tiket Support
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola semua tiket bantuan pengguna
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.summary.total}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <p className="text-sm text-blue-600">Terbuka</p>
                <p className="text-2xl font-bold text-blue-600">{stats.summary.open}</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-600">Diproses</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.summary.inProgress}</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <p className="text-sm text-orange-600">Menunggu</p>
                <p className="text-2xl font-bold text-orange-600">{stats.summary.waitingUser}</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">Mendesak</p>
                <p className="text-2xl font-bold text-red-600">{stats.summary.urgent}</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <p className="text-sm text-green-600">Selesai</p>
                <p className="text-2xl font-bold text-green-600">{stats.summary.resolved}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Cari tiket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="OPEN">Terbuka</SelectItem>
                  <SelectItem value="IN_PROGRESS">Diproses</SelectItem>
                  <SelectItem value="WAITING_USER">Menunggu User</SelectItem>
                  <SelectItem value="RESOLVED">Selesai</SelectItem>
                  <SelectItem value="CLOSED">Ditutup</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  <SelectItem value="URGENT">Mendesak</SelectItem>
                  <SelectItem value="HIGH">Tinggi</SelectItem>
                  <SelectItem value="MEDIUM">Sedang</SelectItem>
                  <SelectItem value="LOW">Rendah</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">Loading...</CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada tiket ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map(ticket => {
              const statusInfo = STATUS_LABELS[ticket.status] || { label: ticket.status, color: 'bg-gray-100 text-gray-800', icon: Clock }
              const priorityInfo = PRIORITY_LABELS[ticket.priority] || { label: ticket.priority, color: 'bg-gray-100 text-gray-600' }
              const StatusIcon = statusInfo.icon || Clock

              return (
                <Card
                  key={ticket.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/admin/support/${ticket.id}`)}
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
                          <Badge variant="outline">
                            {CATEGORY_LABELS[ticket.category]}
                          </Badge>
                        </div>

                        <h3 className="font-semibold text-lg">{ticket.title}</h3>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            User: {ticket.user.name}
                          </span>
                          <span>
                            Role: {ticket.userRole}
                          </span>
                          <span>
                            {format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                          </span>
                          <span>
                            {ticket._count.messages} pesan
                          </span>
                          {ticket.assignedTo && (
                            <span>
                              Assigned: {ticket.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
