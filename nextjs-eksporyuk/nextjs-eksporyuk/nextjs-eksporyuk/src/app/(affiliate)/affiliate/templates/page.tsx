'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FeatureLock from '@/components/affiliate/FeatureLock'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Mail,
  Search,
  Eye,
  Copy,
  Check,
  Star,
  Filter,
  RefreshCw,
  Sparkles,
  BookOpen
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  slug: string
  category: string
  subject: string
  body: string
  previewText?: string
  description?: string
  thumbnailUrl?: string
  isDefault: boolean
  useCount: number
}

const CATEGORY_LABELS: Record<string, { name: string; color: string; icon: string }> = {
  WELCOME: { name: 'Welcome Email', color: 'blue', icon: '👋' },
  FOLLOWUP: { name: 'Follow-Up', color: 'green', icon: '📬' },
  PROMO: { name: 'Promo & Diskon', color: 'red', icon: '🎁' },
  REMINDER: { name: 'Reminder', color: 'yellow', icon: '⏰' },
  EDUCATION: { name: 'Edukasi', color: 'purple', icon: '📚' },
  ZOOM_FOLLOWUP: { name: 'Follow-Up Zoom', color: 'indigo', icon: '🎥' },
  PENDING_PAYMENT: { name: 'Pending Payment', color: 'orange', icon: '💳' },
  UPSELL: { name: 'Upsell', color: 'pink', icon: '⬆️' }
}

export default function AffiliateTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [grouped, setGrouped] = useState<Record<string, EmailTemplate[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/affiliate/email-templates')
      const data = await res.json()

      if (data.success) {
        setTemplates(data.templates)
        setGrouped(data.grouped)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = (template: EmailTemplate) => {
    // Navigate to broadcast page with template pre-filled
    router.push(`/affiliate/broadcast?template=${template.id}`)
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-gray-600">Memuat templates...</p>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <FeatureLock feature="templates">
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 md:p-8 border border-indigo-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                📚 Template Center
              </h1>
              <p className="text-gray-600 leading-relaxed">
                Pilih template email yang sudah disiapkan admin. Tinggal pakai, edit dikit, kirim!
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">Total Templates</p>
            <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">Kategori</p>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(grouped).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">Default</p>
            <p className="text-2xl font-bold text-yellow-600">{templates.filter(t => t.isDefault).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-sm mb-1">Populer</p>
            <p className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.useCount > 10).length}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[200px]"
            >
              <option value="all">🗂️ Semua Kategori</option>
              {Object.entries(CATEGORY_LABELS).map(([key, data]) => (
                <option key={key} value={key}>
                  {data.icon} {data.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {filterCategory === 'all' ? (
          // Show by category
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, categoryTemplates]) => {
              const categoryData = CATEGORY_LABELS[category]
              if (!categoryData) return null

              const visibleTemplates = categoryTemplates.filter(template => {
                return searchQuery === '' || 
                       template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       template.subject.toLowerCase().includes(searchQuery.toLowerCase())
              })

              if (visibleTemplates.length === 0) return null

              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{categoryData.icon}</span>
                    <h2 className="text-xl font-bold text-gray-900">{categoryData.name}</h2>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                      {visibleTemplates.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        categoryData={categoryData}
                        onUse={() => handleUseTemplate(template)}
                        onPreview={() => {
                          setSelectedTemplate(template)
                          setShowPreview(true)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Show filtered
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada template ditemukan</p>
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const categoryData = CATEGORY_LABELS[template.category]
                return (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    categoryData={categoryData}
                    onUse={() => handleUseTemplate(template)}
                    onPreview={() => {
                      setSelectedTemplate(template)
                      setShowPreview(true)
                    }}
                  />
                )
              })
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Tips Menggunakan Template
          </h3>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>✓ Template sudah dibuat admin dengan copywriting yang proven</li>
            <li>✓ Klik "Gunakan Template" untuk langsung pakai di broadcast</li>
            <li>✓ Kamu masih bisa edit sesuai kebutuhan sebelum kirim</li>
            <li>✓ Default template = template terbaik yang paling sering dipakai</li>
          </ul>
        </div>

        {/* Preview Modal */}
        {showPreview && selectedTemplate && (
          <PreviewModal
            template={selectedTemplate}
            onClose={() => {
              setShowPreview(false)
              setSelectedTemplate(null)
            }}
            onUse={() => handleUseTemplate(selectedTemplate)}
            onCopy={(content) => handleCopyContent(content)}
            copied={copied}
          />
        )}
      </div>
    </ResponsivePageWrapper>
    </FeatureLock>
  )
}

// Template Card Component
function TemplateCard({
  template,
  categoryData,
  onUse,
  onPreview
}: {
  template: EmailTemplate
  categoryData: { name: string; color: string; icon: string }
  onUse: () => void
  onPreview: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {template.name}
            </h3>
            {template.isDefault && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <span className={`inline-block px-2 py-0.5 bg-${categoryData.color}-100 text-${categoryData.color}-700 text-xs font-medium rounded-full`}>
            {categoryData.icon} {categoryData.name}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        <strong>Subject:</strong> {template.subject}
      </p>

      {template.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
        <Eye className="w-4 h-4" />
        <span>{template.useCount} kali digunakan</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPreview}
          className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
        >
          <Eye className="w-4 h-4 inline mr-1" />
          Preview
        </button>
        <button
          onClick={onUse}
          className="flex-1 px-3 py-2 text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors text-sm font-medium"
        >
          <Sparkles className="w-4 h-4 inline mr-1" />
          Gunakan
        </button>
      </div>
    </div>
  )
}

// Preview Modal Component
function PreviewModal({
  template,
  onClose,
  onUse,
  onCopy,
  copied
}: {
  template: EmailTemplate
  onClose: () => void
  onUse: () => void
  onCopy: (content: string) => void
  copied: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {template.name}
              </h2>
              <p className="text-sm text-gray-600">
                {CATEGORY_LABELS[template.category]?.name || template.category}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Line
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900 font-medium">{template.subject}</p>
            </div>
          </div>

          {/* Preview Text */}
          {template.previewText && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview Text
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-sm">{template.previewText}</p>
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Body
            </label>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: template.body }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onCopy(template.body)}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Content
                </>
              )}
            </button>
            <button
              onClick={onUse}
              className="flex-1 px-4 py-2.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Gunakan Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
