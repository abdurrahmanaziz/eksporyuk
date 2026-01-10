'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Eye, 
  Search, 
  Filter, 
  Download,
  Calendar,
  Clock,
  User,
  RefreshCw,
  AlertTriangle,
  Activity,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface AuditLog {
  id: string
  action: string
  createdAt: string
  ipAddress: string
  userAgent: string
  metadata: any
  admin: {
    id: string
    email: string
    name: string
    role: string
    avatar?: string
  } | null
  targetUser: {
    id: string
    email: string
    name: string
    role: string
    username?: string
    avatar?: string
  } | null
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Admin Audit Log - View As User
 * 
 * Halaman untuk admin melihat log audit aktivitas "view as user"
 * - Menampilkan siapa admin yang melakukan impersonation
 * - User mana yang di-impersonate
 * - Kapan dan berapa lama
 * - Alasan impersonation
 * - Filter dan search capabilities
 */
export default function AdminAuditViewAsUserPage() {
  const { data: session, status } = useSession()
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedDateRange, setSelectedDateRange] = React.useState({
    from: '',
    to: ''
  })

  // Redirect if not admin
  React.useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
      window.location.href = '/dashboard'
    }
  }, [status, session])

  // Fetch audit logs
  const fetchAuditLogs = React.useCallback(async (page = 1) => {
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      if (selectedDateRange.from) {
        params.append('dateFrom', selectedDateRange.from)
      }

      if (selectedDateRange.to) {
        params.append('dateTo', selectedDateRange.to)
      }

      const response = await fetch(`/api/admin/audit/view-as-user?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const data = await response.json()
      setLogs(data.data.logs)
      setPagination(data.data.pagination)

    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.limit, searchQuery, selectedDateRange])

  React.useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchAuditLogs(1)
    }
  }, [session, fetchAuditLogs])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'ADMIN_VIEW_AS_USER_START': return 'destructive'
      case 'ADMIN_VIEW_AS_USER_END': return 'secondary'
      case 'ADMIN_USER_SEARCH': return 'outline'
      default: return 'default'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'ADMIN_VIEW_AS_USER_START': return 'Mulai View As'
      case 'ADMIN_VIEW_AS_USER_END': return 'Selesai View As'
      case 'ADMIN_USER_SEARCH': return 'Pencarian User'
      default: return action
    }
  }

  if (status === 'loading' || !session) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link 
                href="/admin" 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div className="p-2 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Audit Log - View As User
                </h1>
                <p className="text-muted-foreground">
                  Log aktivitas admin yang melihat sebagai user lain
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => fetchAuditLogs(pagination.page)}
              disabled={isLoading}
              className="rounded-xl"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cari admin atau user email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={selectedDateRange.from}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-auto"
                />
                <Input
                  type="date"
                  value={selectedDateRange.to}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-auto"
                />
                <Button 
                  onClick={() => fetchAuditLogs(1)}
                  disabled={isLoading}
                  className="whitespace-nowrap"
                >
                  Apply Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pagination.totalCount}</p>
                  <p className="text-sm text-muted-foreground">Total Aktivitas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Eye className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {logs.filter(log => log.action === 'ADMIN_VIEW_AS_USER_START').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Impersonation Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {logs.filter(log => log.action === 'ADMIN_USER_SEARCH').length}
                  </p>
                  <p className="text-sm text-muted-foreground">User Searches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">Memuat log audit...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">Tidak ada log audit ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr className="text-left">
                      <th className="p-4 font-medium text-sm text-gray-600 dark:text-gray-300">Waktu</th>
                      <th className="p-4 font-medium text-sm text-gray-600 dark:text-gray-300">Aksi</th>
                      <th className="p-4 font-medium text-sm text-gray-600 dark:text-gray-300">Admin</th>
                      <th className="p-4 font-medium text-sm text-gray-600 dark:text-gray-300">Target User</th>
                      <th className="p-4 font-medium text-sm text-gray-600 dark:text-gray-300">Detail</th>
                      <th className="p-4 font-medium text-sm text-gray-600 dark:text-gray-300">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4">
                          <div className="text-sm">
                            {formatTimestamp(log.createdAt)}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                            {getActionLabel(log.action)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {log.admin && (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {log.admin.name ? log.admin.name.charAt(0).toUpperCase() : log.admin.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{log.admin.name}</p>
                                <p className="text-xs text-muted-foreground">{log.admin.email}</p>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {log.targetUser && (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {log.targetUser.name ? log.targetUser.name.charAt(0).toUpperCase() : log.targetUser.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{log.targetUser.name}</p>
                                <p className="text-xs text-muted-foreground">{log.targetUser.email}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {log.targetUser.role}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {log.metadata && (
                            <div className="text-xs text-muted-foreground max-w-xs">
                              {log.metadata.reason && (
                                <p className="mb-1"><strong>Alasan:</strong> {log.metadata.reason}</p>
                              )}
                              {log.metadata.searchQuery && (
                                <p><strong>Query:</strong> {log.metadata.searchQuery}</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.ipAddress}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={!pagination.hasPrev}
              onClick={() => fetchAuditLogs(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => fetchAuditLogs(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        )}

      </div>
    </ResponsivePageWrapper>
  )
}