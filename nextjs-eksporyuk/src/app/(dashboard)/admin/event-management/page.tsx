'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Pencil, Eye, DollarSign, Trash2, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Event {
  id: string
  name: string
  slug: string
  checkoutSlug?: string
  price: number
  originalPrice?: number
  eventDate: string
  eventEndDate?: string
  eventDuration?: number
  maxParticipants?: number
  isActive: boolean
  isFeatured: boolean
  productStatus?: string
  eventVisibility?: string
  _count?: {
    UserProduct: number
  }
}

interface EventsResponse {
  events: Event[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function EventManagementPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [page, searchTerm])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await fetch(`/api/admin/events?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Gagal memuat events')
      }

      const data: EventsResponse = await response.json()
      setEvents(data.events || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memuat events')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: string, eventName: string) => {
    if (!confirm(`Hapus event "${eventName}"? Tindakan ini tidak dapat dibatalkan.`)) return

    try {
      setDeleting(eventId)
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Gagal menghapus event')
      }

      toast.success('Event berhasil dihapus')
      loadEvents()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus event')
    } finally {
      setDeleting(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: localeId })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (event: Event) => {
    const now = new Date()
    const eventDate = new Date(event.eventDate)
    const eventEndDate = event.eventEndDate ? new Date(event.eventEndDate) : null

    if (!event.isActive) return { variant: 'secondary' as const, text: 'Non-aktif' }
    if (eventDate > now) return { variant: 'default' as const, text: 'Akan Datang' }
    if (eventEndDate && eventEndDate < now) return { variant: 'outline' as const, text: 'Selesai' }
    return { variant: 'secondary' as const, text: 'Sedang Berlangsung' }
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Event</h1>
            <p className="text-muted-foreground">Kelola semua event dan webinar Anda</p>
          </div>
          <Link href="/admin/events/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Event Baru
            </Button>
          </Link>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari event berdasarkan nama..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Event ({events.length})</CardTitle>
            <CardDescription>
              Halaman {page} dari {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Memuat events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada event. Klik tombol "Tambah Event Baru" untuk membuat event.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Peserta</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => {
                        const statusInfo = getStatusBadge(event)
                        const attendeeCount = event._count?.UserProduct || 0
                        const hasCapacity = event.maxParticipants && event.maxParticipants > 0
                        const isFull = hasCapacity && attendeeCount >= (event.maxParticipants || 0)

                        return (
                          <TableRow key={event.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{event.name}</span>
                                  {event.isFeatured && (
                                    <Badge variant="secondary" className="text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{event.slug}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-sm">
                                <span className="font-medium">{formatDate(event.eventDate)}</span>
                                {event.eventDuration && (
                                  <span className="text-xs text-muted-foreground">
                                    {event.eventDuration} menit
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {event.price === 0 ? 'GRATIS' : formatCurrency(event.price)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {attendeeCount}
                                  {hasCapacity && `/${event.maxParticipants}`}
                                </span>
                                {isFull && (
                                  <Badge variant="destructive" className="text-xs w-fit">
                                    Penuh
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant}>
                                {statusInfo.text}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Event
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => window.open(`/events/${event.slug}`, '_blank')}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Lihat Halaman
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      window.open(
                                        `/checkout/product/${event.checkoutSlug || event.slug}`,
                                        '_blank'
                                      )
                                    }
                                  >
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Lihat Checkout
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/admin/events/${event.id}/form`)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Atur Form & Sales Page
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(event.id, event.name)}
                                    disabled={deleting === event.id || (event._count?.UserProduct || 0) > 0}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus Event
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground">
                      Halaman {page} dari {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Berikutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
  )
}
