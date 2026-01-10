'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  Clock, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

interface Backup {
  id: string
  filename: string
  url: string
  size: number
  createdAt: string
  tablesCount: number
  recordsCount: Record<string, number>
}

interface BackupStats {
  totalBackups: number
  lastBackup: string | null
  totalSize: number
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchBackups = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/backup')
      if (res.ok) {
        const data = await res.json()
        setBackups(data.backups || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error)
      toast.error('Gagal memuat daftar backup')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  const createBackup = async () => {
    try {
      setCreating(true)
      toast.info('Membuat backup database...')
      
      const res = await fetch('/api/admin/backup', {
        method: 'POST'
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success('Backup berhasil dibuat!')
        fetchBackups()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal membuat backup')
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast.error('Gagal membuat backup')
    } finally {
      setCreating(false)
    }
  }

  const deleteBackup = async (filename: string) => {
    if (!confirm('Yakin ingin menghapus backup ini?')) return
    
    try {
      setDeleting(filename)
      
      const res = await fetch(`/api/admin/backup?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast.success('Backup berhasil dihapus')
        fetchBackups()
      } else {
        toast.error('Gagal menghapus backup')
      }
    } catch (error) {
      toast.error('Gagal menghapus backup')
    } finally {
      setDeleting(null)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6" />
            Database Backup
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola backup database untuk mencegah kehilangan data
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchBackups}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={createBackup}
            disabled={creating}
          >
            {creating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Buat Backup Sekarang
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Backup</p>
                <p className="text-2xl font-bold">{stats?.totalBackups || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Backup Terakhir</p>
                <p className="text-lg font-semibold">
                  {stats?.lastBackup 
                    ? formatDistanceToNow(new Date(stats.lastBackup), { addSuffix: true, locale: id })
                    : 'Belum ada'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Ukuran</p>
                <p className="text-2xl font-bold">{formatBytes(stats?.totalSize || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Informasi Backup</p>
              <ul className="text-sm text-amber-700 mt-1 space-y-1">
                <li>• Backup otomatis berjalan setiap hari jam 07:00 WIB</li>
                <li>• Maksimal 7 backup tersimpan (yang lama akan dihapus otomatis)</li>
                <li>• Backup disimpan di Vercel Blob Storage</li>
                <li>• Untuk restore, download file lalu hubungi developer</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Backup</CardTitle>
          <CardDescription>
            Backup database yang tersedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada backup</p>
              <p className="text-sm">Klik &quot;Buat Backup Sekarang&quot; untuk membuat backup pertama</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup, index) => (
                <div 
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Database className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{backup.filename}</p>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Terbaru
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>{formatBytes(backup.size)}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true, locale: id })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <a href={backup.url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteBackup(backup.filename)}
                      disabled={deleting === backup.filename}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deleting === backup.filename ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
