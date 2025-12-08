'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  MapPin, 
  Users, 
  Building2, 
  Globe,
  TrendingUp,
  Search,
  Download,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Bell,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface LocationStat {
  province: string
  _count: { id: number }
}

interface MemberStat {
  total: number
  withLocation: number
  verified: number
  provinces: LocationStat[]
}

export default function AdminMemberDirectoryPage() {
  const [stats, setStats] = useState<MemberStat | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sendingReminder, setSendingReminder] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/members/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminder = async (type: 'all' | 'no-location' | 'no-gps' = 'all') => {
    console.log('[REMINDER] Button clicked, type:', type)
    
    if (!confirm(`Kirim reminder ke semua member dengan profil tidak lengkap?`)) {
      console.log('[REMINDER] User cancelled')
      return
    }

    setSendingReminder(true)
    console.log('[REMINDER] Sending request...')
    
    try {
      const res = await fetch('/api/admin/members/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      console.log('[REMINDER] Response status:', res.status)
      const data = await res.json()
      console.log('[REMINDER] Response data:', data)

      if (res.ok) {
        toast.success(data.message, {
          description: `${data.details.notificationsSent} notifikasi berhasil dikirim`
        })
      } else {
        toast.error(data.error || 'Gagal mengirim reminder')
      }
    } catch (error) {
      console.error('[REMINDER] Error:', error)
      toast.error('Terjadi kesalahan saat mengirim reminder')
    } finally {
      setSendingReminder(false)
    }
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  const completionRate = stats ? Math.round((stats.withLocation / stats.total) * 100) : 0
  const verificationRate = stats ? Math.round((stats.verified / stats.withLocation) * 100) : 0

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Member Directory Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Statistik dan manajemen lokasi member
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => handleSendReminder('all')}
            disabled={sendingReminder}
          >
            {sendingReminder ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Kirim Reminder
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total?.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Member</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.withLocation?.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Lokasi Terisi</p>
                <Badge className="mt-1" variant="secondary">{completionRate}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.verified?.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">GPS Terverifikasi</p>
                <Badge className="mt-1" variant="secondary">{verificationRate || 0}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.provinces?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Provinsi Tercakup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for incomplete profiles */}
      {completionRate < 50 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">Banyak member belum lengkapi lokasi</p>
                <p className="text-sm text-amber-700">
                  Hanya {completionRate}% member yang sudah mengisi lokasi. Kirim reminder untuk meningkatkan completion rate.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSendReminder('no-location')}
                disabled={sendingReminder}
              >
                {sendingReminder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Kirim Reminder
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Province Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribusi Member per Provinsi
          </CardTitle>
          <CardDescription>
            Top 20 provinsi dengan member terbanyak
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari provinsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Provinsi</TableHead>
                <TableHead className="text-right">Jumlah Member</TableHead>
                <TableHead className="text-right">Persentase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.provinces
                ?.filter(p => p.province?.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 20)
                .map((prov, index) => {
                  const percentage = ((prov._count.id / (stats?.withLocation || 1)) * 100).toFixed(1)
                  return (
                    <TableRow key={prov.province}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {prov.province}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{prov._count.id.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(parseFloat(percentage) * 2, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </ResponsivePageWrapper>
  )
}
