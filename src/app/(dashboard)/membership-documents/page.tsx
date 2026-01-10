'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, Download, Eye, Search, Lock, CheckCircle, Clock
} from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

type Document = {
  id: string
  title: string
  description?: string
  category: string
  minimumLevel: string
  fileName: string
  fileSize: number
  fileType: string
  viewCount: number
  downloadCount: number
  createdAt: string
  hasDownloaded: boolean
  lastDownloadedAt?: string
}

const CATEGORIES = [
  'Panduan',
  'Template',
  'Buyer Data',
  'Legalitas',
  'Pelatihan',
  'Referensi',
  'Lainnya',
]

export default function MembershipDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [userLevel, setUserLevel] = useState('FREE')
  const [membership, setMembership] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchDocuments()
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      const debounce = setTimeout(() => {
        fetchDocuments()
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [searchTerm, filterCategory, status])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterCategory && filterCategory !== 'all') params.append('category', filterCategory)

      const res = await fetch(`/api/membership-documents?${params}`)
      const data = await res.json()
      
      setDocuments(data.documents || [])
      setUserLevel(data.userLevel || 'FREE')
      setMembership(data.membership)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (docId: string, title: string) => {
    try {
      setDownloading(docId)
      
      const res = await fetch(`/api/membership-documents/${docId}/download`)
      
      if (!res.ok) {
        const error = await res.json()
        if (res.status === 403) {
          alert(`Akses ditolak: ${error.error}\nLevel Anda: ${error.current}\nLevel diperlukan: ${error.required}`)
        } else {
          alert(error.error || 'Gagal download dokumen')
        }
        return
      }

      // Download file
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = title
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Refresh list
      await fetchDocuments()
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Gagal download dokumen')
    } finally {
      setDownloading(null)
    }
  }

  const handleView = async (docId: string) => {
    try {
      await fetch(`/api/membership-documents/${docId}/download`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'FREE': return 'bg-gray-500'
      case 'SILVER': return 'bg-gray-400'
      case 'GOLD': return 'bg-yellow-500'
      case 'PLATINUM': return 'bg-blue-500'
      case 'LIFETIME': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading && documents.length === 0) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <div className="text-center">Loading...</div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dokumen Membership</h1>
          <p className="text-gray-600 mt-2">Akses dokumen eksklusif sesuai level membership Anda</p>
        </div>

        {/* Membership Status */}
        <Card className="mb-6 border-l-4 border-l-blue-600">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${getLevelBadgeColor(userLevel)} flex items-center justify-center`}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Level Anda: {userLevel}
                  </div>
                  {membership ? (
                    <div className="text-sm text-gray-600">
                      {membership.name} - Aktif hingga {new Date(membership.endDate).toLocaleDateString('id-ID')}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Upgrade membership untuk akses lebih banyak dokumen
                    </div>
                  )}
                </div>
              </div>
              {!membership && (
                <Button onClick={() => router.push('/pricing')}>
                  Upgrade Sekarang
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari dokumen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge className={`mb-2 ${getLevelBadgeColor(doc.minimumLevel)}`}>
                      {doc.minimumLevel}
                    </Badge>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                  </div>
                  {doc.hasDownloaded && (
                    <span title="Sudah didownload">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </span>
                  )}
                </div>
                <CardDescription>{doc.category}</CardDescription>
              </CardHeader>
              <CardContent>
                {doc.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {doc.viewCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {doc.downloadCount}
                    </div>
                  </div>
                  <div>{formatFileSize(doc.fileSize)}</div>
                </div>

                {doc.hasDownloaded && doc.lastDownloadedAt && (
                  <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Terakhir didownload: {new Date(doc.lastDownloadedAt).toLocaleDateString('id-ID')}
                  </div>
                )}

                <Button 
                  className="w-full"
                  onClick={() => {
                    handleView(doc.id)
                    handleDownload(doc.id, doc.fileName)
                  }}
                  disabled={downloading === doc.id}
                >
                  {downloading === doc.id ? (
                    'Downloading...'
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {documents.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                {userLevel === 'FREE' ? (
                  <>
                    <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-semibold">Tidak ada dokumen tersedia untuk level FREE</p>
                    <p className="text-sm mt-2">Upgrade membership Anda untuk mengakses dokumen eksklusif</p>
                    <Button className="mt-4" onClick={() => router.push('/pricing')}>
                      Lihat Paket Membership
                    </Button>
                  </>
                ) : (
                  <>
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Tidak ada dokumen ditemukan</p>
                    <p className="text-sm mt-2">Coba gunakan filter atau pencarian lain</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
