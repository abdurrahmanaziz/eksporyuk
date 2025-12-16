'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import FeatureLock from '@/components/affiliate/FeatureLock'
import {
  Image as ImageIcon,
  Download,
  Copy,
  CheckCircle,
  FileText,
  Mail,
  Share2,
  Search,
  Filter,
  Grid3x3,
  List,
} from 'lucide-react'

interface Material {
  id: string
  title: string
  description: string
  type: 'banner' | 'social' | 'email' | 'copy'
  category: string
  fileUrl: string | null
  content: string | null
  thumbnailUrl: string | null
  downloadCount: number
  createdAt: string
}

interface MaterialsData {
  materials: Material[]
  categories: string[]
}

export default function MaterialsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<MaterialsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    fetchMaterials()
  }, [typeFilter, categoryFilter])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/affiliate/materials?type=${typeFilter}&category=${categoryFilter}`
      )
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner':
        return <ImageIcon className="w-5 h-5" />
      case 'social':
        return <Share2 className="w-5 h-5" />
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'copy':
        return <FileText className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'banner':
        return 'Banner'
      case 'social':
        return 'Social Media'
      case 'email':
        return 'Email Template'
      case 'copy':
        return 'Sales Copy'
      default:
        return type
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'banner':
        return 'bg-purple-100 text-purple-700'
      case 'social':
        return 'bg-blue-100 text-blue-700'
      case 'email':
        return 'bg-green-100 text-green-700'
      case 'copy':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat materi marketing...</p>
        </div>
      </div>
    )
  }

  return (
    <FeatureLock feature="materials">
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}15` }}
          >
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.primary }} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Materi Marketing</h1>
            <p className="text-xs sm:text-sm text-gray-600">Asset promosi siap pakai untuk affiliate</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Tipe Materi</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="all">Semua Tipe</option>
              <option value="banner">Banner</option>
              <option value="social">Social Media</option>
              <option value="email">Email Template</option>
              <option value="copy">Sales Copy</option>
            </select>
          </div>
          
          {data && data.categories.length > 0 && (
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Kategori</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              >
                <option value="all">Semua Kategori</option>
                {data.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Materials Grid/List */}
      {data && data.materials.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6' : 'space-y-3 sm:space-y-4'}>
          {data.materials.map((material) => (
            <div 
              key={material.id}
              className={`bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''
              }`}
            >
              {/* Thumbnail */}
              {material.thumbnailUrl && (
                <div className={viewMode === 'list' ? 'w-full sm:w-48 flex-shrink-0' : 'w-full'}>
                  <img
                    src={material.thumbnailUrl}
                    alt={material.title}
                    className="w-full h-36 sm:h-48 object-cover"
                  />
                </div>
              )}
              
              <div className="p-3 sm:p-6 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {getTypeIcon(material.type)}
                    </div>
                    <div>
                      <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium ${getTypeBadgeColor(material.type)}`}>
                        {getTypeLabel(material.type)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-1">{material.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 line-clamp-2">{material.description}</p>
                
                {material.category && (
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-4">
                    Kategori: <span className="font-medium">{material.category}</span>
                  </div>
                )}

                {/* Text Content Preview */}
                {material.content && (
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-2 sm:mb-4">
                    <p className="text-[10px] sm:text-xs text-gray-700 line-clamp-2 sm:line-clamp-3 font-mono">
                      {material.content}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {material.fileUrl && (
                    <a
                      href={material.fileUrl}
                      download
                      className="flex-1 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      Download
                    </a>
                  )}
                  
                  {material.content && (
                    <button
                      onClick={() => handleCopy(material.content!, material.id)}
                      className="flex-1 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium"
                    >
                      {copiedId === material.id ? (
                        <>
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                          <span className="text-green-600">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Salin Text</span>
                          <span className="sm:hidden">Salin</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 text-[10px] sm:text-xs text-gray-500">
                  Diunduh {material.downloadCount} kali
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 py-12 sm:py-16">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-sm sm:text-lg font-medium mb-1.5 sm:mb-2">Belum ada materi tersedia</p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Materi marketing akan ditambahkan oleh admin
            </p>
          </div>
        </div>
      )}
    </div>
    </FeatureLock>
  )
}
