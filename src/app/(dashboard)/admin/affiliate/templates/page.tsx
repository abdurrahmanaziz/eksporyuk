'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Mail,
  MousePointer2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Copy,
  Check,
  Star,
  Filter,
  RefreshCw
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
  isActive: boolean
  useCount: number
  createdAt: string
}

interface CTATemplate {
  id: string
  name: string
  buttonText: string
  buttonType: string
  description?: string
  backgroundColor: string
  textColor: string
  icon?: string
  isActive: boolean
  useCount: number
  displayOrder: number
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  WELCOME: 'Welcome Email',
  FOLLOWUP: 'Follow-Up',
  PROMO: 'Promo & Diskon',
  REMINDER: 'Reminder',
  EDUCATION: 'Edukasi',
  ZOOM_FOLLOWUP: 'Follow-Up Zoom',
  PENDING_PAYMENT: 'Pending Payment',
  UPSELL: 'Upsell'
}

const BUTTON_TYPE_LABELS: Record<string, string> = {
  MEMBERSHIP: 'Membership',
  COURSE: 'Kursus',
  PRODUCT: 'Produk',
  OPTIN: 'Optin Form',
  WHATSAPP: 'WhatsApp',
  ZOOM: 'Zoom/Event',
  CUSTOM: 'Custom Link'
}

export default function AdminAffiliateTemplatesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'email' | 'cta'>('email')
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [ctaTemplates, setCTATemplates] = useState<CTATemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const [emailRes, ctaRes] = await Promise.all([
        fetch('/api/admin/affiliate/email-templates'),
        fetch('/api/admin/affiliate/cta-templates')
      ])

      const emailData = await emailRes.json()
      const ctaData = await ctaRes.json()

      if (emailData.success) {
        setEmailTemplates(emailData.templates)
      }

      if (ctaData.success) {
        setCTATemplates(ctaData.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmailTemplate = async (id: string) => {
    if (!confirm('Yakin hapus template ini?')) return

    try {
      const res = await fetch(`/api/admin/affiliate/email-templates/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        alert('Template berhasil dihapus')
        fetchTemplates()
      } else {
        alert(data.error || 'Gagal menghapus template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Gagal menghapus template')
    }
  }

  const handleDeleteCTATemplate = async (id: string) => {
    if (!confirm('Yakin hapus template CTA ini?')) return

    try {
      const res = await fetch(`/api/admin/affiliate/cta-templates/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        alert('Template CTA berhasil dihapus')
        fetchTemplates()
      } else {
        alert(data.error || 'Gagal menghapus template')
      }
    } catch (error) {
      console.error('Error deleting CTA template:', error)
      alert('Gagal menghapus template')
    }
  }

  const filteredEmailTemplates = emailTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const filteredCTATemplates = ctaTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.buttonText.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || template.buttonType === filterType
    return matchesSearch && matchesType
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
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            📚 Template Center
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola template email dan CTA button untuk affiliate
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Templates</p>
                <p className="text-2xl font-bold text-gray-900">{emailTemplates.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                <MousePointer2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">CTA Templates</p>
                <p className="text-2xl font-bold text-gray-900">{ctaTemplates.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {emailTemplates.filter(t => t.isActive).length + ctaTemplates.filter(t => t.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {emailTemplates.reduce((sum, t) => sum + t.useCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('email')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'email'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Email Templates
              </button>
              <button
                onClick={() => setActiveTab('cta')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'cta'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MousePointer2 className="w-4 h-4 inline mr-2" />
                CTA Templates
              </button>
            </div>

            <button
              onClick={() => {
                if (activeTab === 'email') {
                  router.push('/admin/affiliate/templates/email/create')
                } else {
                  router.push('/admin/affiliate/templates/cta/create')
                }
              }}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 justify-center"
            >
              <Plus className="w-4 h-4" />
              Tambah Template
            </button>
          </div>

          {/* Search & Filter */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {activeTab === 'email' ? (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">Semua Kategori</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">Semua Tipe</option>
                  {Object.entries(BUTTON_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === 'email' ? (
              <div className="space-y-3">
                {filteredEmailTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada template email</p>
                  </div>
                ) : (
                  filteredEmailTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-200 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {template.name}
                            </h3>
                            {template.isDefault && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Default
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              template.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Subject:</strong> {template.subject}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {CATEGORY_LABELS[template.category] || template.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {template.useCount} kali digunakan
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/affiliate/templates/email/${template.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmailTemplate(template.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCTATemplates.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <MousePointer2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada template CTA</p>
                  </div>
                ) : (
                  filteredCTATemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-200 rounded-xl hover:border-purple-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          template.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Preview Button */}
                      <button
                        className="w-full py-3 rounded-lg font-medium mb-3 transition-transform hover:scale-105"
                        style={{
                          backgroundColor: template.backgroundColor,
                          color: template.textColor
                        }}
                      >
                        {template.buttonText}
                      </button>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Tipe:</span>
                          <span className="font-medium text-gray-900">
                            {BUTTON_TYPE_LABELS[template.buttonType]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Digunakan:</span>
                          <span className="font-medium text-gray-900">
                            {template.useCount}x
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => router.push(`/admin/affiliate/templates/cta/${template.id}`)}
                          className="flex-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Edit2 className="w-4 h-4 inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCTATemplate(template.id)}
                          className="flex-1 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="font-bold text-indigo-900 mb-2">💡 Tentang Template Center</h3>
          <p className="text-indigo-700 text-sm leading-relaxed mb-3">
            Template Center adalah pusat template yang dibuat admin untuk digunakan affiliate. 
            Semua template akan muncul di sistem affiliate dan bisa langsung dipakai.
          </p>
          <ul className="space-y-1 text-sm text-indigo-700">
            <li>✓ <strong>Email Templates:</strong> Template email untuk broadcast, follow-up, dan automation</li>
            <li>✓ <strong>CTA Templates:</strong> Template tombol untuk Bio Page affiliate</li>
            <li>✓ <strong>Default Template:</strong> Ditandai bintang akan muncul pertama kali</li>
          </ul>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
