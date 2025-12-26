'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Download, Lock, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Document {
  id: string
  title: string
  description: string
  category: string
  visibility: string
  uploadDate: string
  views: number
  downloads: number
  active: boolean
  fileType: string
}

interface UserMembership {
  name: string
  level: number
}

const MEMBERSHIP_LEVELS = {
  LIFETIME: 4,
  PLATINUM: 3,
  GOLD: 2,
  SILVER: 1,
  FREE: 0
}

export default function DocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Fetch user membership and documents
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserMembership()
      fetchDocuments()
    }
  }, [session, filterCategory])

  const fetchUserMembership = async () => {
    try {
      const response = await fetch('/api/user/membership')
      if (response.ok) {
        const data = await response.json()
        const level = data.membership
          ? MEMBERSHIP_LEVELS[
              data.membership.name
                .toUpperCase()
                .replace(/\s+/g, '_') as keyof typeof MEMBERSHIP_LEVELS
            ] || MEMBERSHIP_LEVELS.FREE
          : MEMBERSHIP_LEVELS.FREE

        setUserMembership({
          name: data.membership?.name || 'Free Member',
          level
        })
      }
    } catch (error) {
      console.error('Error fetching membership:', error)
      setUserMembership({ name: 'Free Member', level: MEMBERSHIP_LEVELS.FREE })
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterCategory) params.append('category', filterCategory)

      const response = await fetch(`/api/documents?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      // Filter documents based on membership level
      const filteredDocs = data.documents.filter((doc: Document) => {
        const requiredLevel =
          MEMBERSHIP_LEVELS[doc.visibility as keyof typeof MEMBERSHIP_LEVELS] || 0
        return (userMembership?.level || 0) >= requiredLevel
      })

      setDocuments(filteredDocs)
    } catch (error) {
      toast.error('Gagal mengambil daftar dokumen')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (documentId: string, title: string) => {
    try {
      setDownloading(documentId)
      const response = await fetch(`/api/documents/${documentId}/download`)

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Anda tidak memiliki akses ke dokumen ini')
        } else {
          toast.error('Gagal mengunduh dokumen')
        }
        return
      }

      // Get filename from headers or use title
      const contentDisposition = response.headers.get('content-disposition')
      let filename = title
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match) filename = match[1]
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Dokumen berhasil diunduh')
    } catch (error) {
      toast.error('Gagal mengunduh dokumen')
      console.error(error)
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getBadgeColor = (visibility: string) => {
    const colors: Record<string, string> = {
      SILVER: 'bg-slate-100 text-slate-800',
      GOLD: 'bg-yellow-100 text-yellow-800',
      PLATINUM: 'bg-cyan-100 text-cyan-800',
      LIFETIME: 'bg-purple-100 text-purple-800'
    }
    return colors[visibility] || 'bg-gray-100 text-gray-800'
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session?.user) {
    return null
  }

  const displayDocuments = documents.filter((doc) => {
    const matchesCategory = !filterCategory || doc.category === filterCategory
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = [...new Set(documents.map((doc) => doc.category))].filter(Boolean)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dokumen & Resource</h1>
          <p className="mt-2 text-gray-600">
            Akses dokumen dan resource yang tersedia untuk paket{' '}
            <span className="font-semibold text-blue-600">{userMembership?.name}</span>
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Dokumen
            </label>
            <Input
              placeholder="Cari judul atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <Select value={filterCategory || 'all'} onValueChange={(value) => setFilterCategory(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-600">Memuat dokumen...</p>
          </div>
        ) : displayDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center">
              {searchQuery || filterCategory
                ? 'Tidak ada dokumen yang cocok dengan kriteria pencarian'
                : 'Belum ada dokumen yang tersedia untuk paket Anda'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayDocuments.map((doc) => {
              const canAccess =
                (userMembership?.level || 0) >=
                (MEMBERSHIP_LEVELS[doc.visibility as keyof typeof MEMBERSHIP_LEVELS] || 0)

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200"
                >
                  <div className="p-6 flex flex-col h-full">
                    {/* Title & Badge */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 flex-1 line-clamp-2">
                          {doc.title}
                        </h3>
                      </div>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getBadgeColor(
                          doc.visibility
                        )}`}
                      >
                        {doc.visibility}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                      {doc.description || 'Tidak ada deskripsi'}
                    </p>

                    {/* Category & Date */}
                    <div className="text-xs text-gray-500 space-y-1 mb-4">
                      {doc.category && <p>Kategori: {doc.category}</p>}
                      <p>Diupload: {formatDate(doc.uploadDate)}</p>
                      <p>
                        Views: {doc.views} | Downloads: {doc.downloads}
                      </p>
                    </div>

                    {/* Download Button */}
                    {canAccess ? (
                      <Button
                        onClick={() => handleDownload(doc.id, doc.title)}
                        disabled={downloading === doc.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {downloading === doc.id ? 'Mengunduh...' : 'Unduh'}
                      </Button>
                    ) : (
                      <Button disabled className="w-full bg-gray-300 cursor-not-allowed">
                        <Lock className="w-4 h-4 mr-2" />
                        Paket {doc.visibility} Diperlukan
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
