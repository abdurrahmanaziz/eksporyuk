'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Award,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Check,
  X,
  Palette,
  Layout,
  Settings,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

type CertificateTemplate = {
  id: string
  name: string
  description: string | null
  backgroundColor: string
  primaryColor: string
  secondaryColor: string | null
  textColor: string
  layout: string
  logoUrl: string | null
  backgroundImage: string | null
  borderStyle: string | null
  fontFamily: string
  titleFontSize: string
  showLogo: boolean
  showSignature: boolean
  showQrCode: boolean
  showBorder: boolean
  isActive: boolean
  isDefault: boolean
  signatureUrl: string | null
  mentorName: string | null
  directorName: string | null
  createdAt: string
  _count: {
    courses: number
  }
}

type Course = {
  id: string
  title: string
  slug: string
}

export default function CertificateTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    fetchTemplates()
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/certificate-templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Gagal memuat template')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (template: CertificateTemplate) => {
    if (!confirm(`Hapus template "${template.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/certificate-templates/${template.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Template berhasil dihapus')
        fetchTemplates()
      } else {
        toast.error(data.message || 'Gagal menghapus template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Gagal menghapus template')
    }
  }

  const handleDuplicate = async (template: CertificateTemplate) => {
    try {
      const res = await fetch('/api/admin/certificate-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          id: undefined,
          name: `${template.name} (Copy)`,
          isDefault: false,
          createdAt: undefined,
          updatedAt: undefined,
          _count: undefined
        })
      })

      if (res.ok) {
        toast.success('Template berhasil diduplikasi')
        fetchTemplates()
      } else {
        toast.error('Gagal menduplikasi template')
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
      toast.error('Gagal menduplikasi template')
    }
  }

  const handleSetDefault = async (template: CertificateTemplate) => {
    try {
      const res = await fetch(`/api/admin/certificate-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          isDefault: true
        })
      })

      if (res.ok) {
        toast.success('Template default berhasil diatur')
        fetchTemplates()
      } else {
        toast.error('Gagal mengatur template default')
      }
    } catch (error) {
      console.error('Error setting default:', error)
      toast.error('Gagal mengatur template default')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // If creating or editing, show editor with live preview
  if (isCreating || editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        courses={courses}
        onClose={() => {
          setIsCreating(false)
          setEditingTemplate(null)
        }}
        onSuccess={() => {
          setIsCreating(false)
          setEditingTemplate(null)
          fetchTemplates()
        }}
      />
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Sertifikat</h1>
          <p className="text-gray-600">Kelola template sertifikat untuk kursus</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Buat Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-1">Total Template</p>
              <p className="text-3xl font-bold">{templates.length}</p>
            </div>
            <Award className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 mb-1">Template Aktif</p>
              <p className="text-3xl font-bold">{templates.filter(t => t.isActive).length}</p>
            </div>
            <Check className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 mb-1">Digunakan</p>
              <p className="text-3xl font-bold">
                {templates.reduce((sum, t) => sum + t._count.courses, 0)}
              </p>
            </div>
            <Layout className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 mb-1">Template Default</p>
              <p className="text-3xl font-bold">{templates.filter(t => t.isDefault).length}</p>
            </div>
            <Settings className="w-10 h-10 opacity-80" />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada template</h3>
          <p className="text-gray-600 mb-6">Buat template sertifikat pertama Anda</p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Buat Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300"
            >
              {/* Template Preview */}
              <div 
                className="relative h-48 p-6 flex items-center justify-center"
                style={{
                  backgroundColor: template.backgroundColor,
                  color: template.textColor,
                  borderBottom: template.showBorder ? `4px solid ${template.primaryColor}` : 'none'
                }}
              >
                <div className="text-center">
                  <Award 
                    className="w-16 h-16 mx-auto mb-3" 
                    style={{ color: template.primaryColor }}
                  />
                  <div 
                    className="text-2xl font-bold"
                    style={{ fontFamily: template.fontFamily }}
                  >
                    Sertifikat
                  </div>
                  <div className="text-sm mt-2 opacity-75">
                    {template.layout}
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {template.isDefault && (
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      Default
                    </span>
                  )}
                  {!template.isActive && (
                    <span className="px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded-full">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Course Count */}
                {template._count.courses > 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                      {template._count.courses} Kursus
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {template.name}
                </h3>
                
                {template.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
                  {template.showLogo && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Logo</span>
                  )}
                  {template.showSignature && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Signature</span>
                  )}
                  {template.showQrCode && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">QR Code</span>
                  )}
                  {template.showBorder && (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">Border</span>
                  )}
                </div>

                {/* Color Palette */}
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <div className="flex gap-1">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: template.primaryColor }}
                      title={template.primaryColor}
                    />
                    {template.secondaryColor && (
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: template.secondaryColor }}
                        title={template.secondaryColor}
                      />
                    )}
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: template.backgroundColor }}
                      title={template.backgroundColor}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleSetDefault(template)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Duplikat
                  </button>
                  {template._count.courses === 0 && (
                    <button
                      onClick={() => handleDelete(template)}
                      className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}

// Template Editor with Live Preview
function TemplateEditor({ 
  template, 
  courses,
  onClose, 
  onSuccess 
}: { 
  template?: CertificateTemplate | null
  courses: Course[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    backgroundColor: template?.backgroundColor || '#FFFFFF',
    primaryColor: template?.primaryColor || '#3B82F6',
    secondaryColor: template?.secondaryColor || '#6B7280',
    textColor: template?.textColor || '#1F2937',
    layout: template?.layout || 'MODERN',
    logoUrl: template?.logoUrl || '',
    signatureUrl: template?.signatureUrl || '',
    fontFamily: template?.fontFamily || 'Inter',
    titleFontSize: template?.titleFontSize || '3xl',
    mentorName: template?.mentorName || '',
    directorName: template?.directorName || '',
    showLogo: template?.showLogo ?? true,
    showSignature: template?.showSignature ?? true,
    showQrCode: template?.showQrCode ?? true,
    showBorder: template?.showBorder ?? true,
    isActive: template?.isActive ?? true,
    isDefault: template?.isDefault ?? false
  })

  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)

  useEffect(() => {
    if (template?.id) {
      fetchTemplateCourses(template.id)
    }
  }, [template?.id])

  const fetchTemplateCourses = async (templateId: string) => {
    try {
      const res = await fetch(`/api/admin/certificate-templates/${templateId}/courses`)
      if (res.ok) {
        const data = await res.json()
        setSelectedCourses(data.courseIds || [])
      }
    } catch (error) {
      console.error('Error fetching template courses:', error)
    }
  }

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, logoUrl: data.url })
        toast.success('Logo berhasil diupload')
      } else {
        toast.error('Gagal upload logo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Gagal upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingSignature(true)
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, signatureUrl: data.url })
        toast.success('Tanda tangan berhasil diupload')
      } else {
        toast.error('Gagal upload tanda tangan')
      }
    } catch (error) {
      console.error('Error uploading signature:', error)
      toast.error('Gagal upload tanda tangan')
    } finally {
      setUploadingSignature(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Nama template wajib diisi')
      return
    }

    setSaving(true)

    try {
      const url = template 
        ? `/api/admin/certificate-templates/${template.id}`
        : '/api/admin/certificate-templates'
      
      const method = template ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const data = await res.json()
        const templateId = data.template?.id || template?.id

        // Update course assignments if template was created/updated
        if (templateId && selectedCourses.length > 0) {
          await fetch(`/api/admin/certificate-templates/${templateId}/courses`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseIds: selectedCourses })
          })
        }

        toast.success(template ? 'Template berhasil diupdate' : 'Template berhasil dibuat')
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Gagal menyimpan template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Gagal menyimpan template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {template ? 'Edit Template' : 'Buat Template Baru'}
            </h1>
            <p className="text-sm text-gray-600">
              Customize template sertifikat dengan live preview
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : template ? 'Update Template' : 'Buat Template'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-6">
            <form className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Informasi Dasar</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Template *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: Modern Blue Certificate"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Deskripsi singkat tentang template ini"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Mentor (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.mentorName}
                    onChange={(e) => setFormData({ ...formData, mentorName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: Dr. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Direktur (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.directorName}
                    onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: Jane Smith, MBA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layout Style
                  </label>
                  <select
                    value={formData.layout}
                    onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MODERN">Modern</option>
                    <option value="CLASSIC">Classic</option>
                    <option value="MINIMAL">Minimal</option>
                    <option value="ELEGANT">Elegant</option>
                  </select>
                </div>

                {/* Course Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Kelas untuk Template Ini
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {courses.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Tidak ada kelas tersedia</p>
                    ) : (
                      courses.map(course => (
                        <label key={course.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.id)}
                            onChange={() => toggleCourse(course.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{course.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCourses.length} kelas dipilih
                  </p>
                </div>
              </div>

              {/* Colors */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Palet Warna</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.secondaryColor || '#6B7280'}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor || ''}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.textColor}
                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.textColor}
                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Assets */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Assets</h3>
                
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Sertifikat
                  </label>
                  {formData.logoUrl ? (
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                        <Image 
                          src={formData.logoUrl} 
                          alt="Logo"
                          width={80}
                          height={80}
                          className="object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '' })}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Hapus Logo
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {uploadingLogo ? 'Uploading...' : 'Klik untuk upload logo'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG (max 2MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>
                  )}
                </div>

                {/* Signature Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanda Tangan
                  </label>
                  {formData.signatureUrl ? (
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-20 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                        <Image 
                          src={formData.signatureUrl} 
                          alt="Signature"
                          width={128}
                          height={80}
                          className="object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, signatureUrl: '' })}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Hapus Tanda Tangan
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {uploadingSignature ? 'Uploading...' : 'Klik untuk upload tanda tangan'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG (max 2MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        disabled={uploadingSignature}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Fitur Tampilan</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.showLogo}
                      onChange={(e) => setFormData({ ...formData, showLogo: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Tampilkan Logo</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.showSignature}
                      onChange={(e) => setFormData({ ...formData, showSignature: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Tampilkan Tanda Tangan</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.showQrCode}
                      onChange={(e) => setFormData({ ...formData, showQrCode: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Tampilkan QR Code</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.showBorder}
                      onChange={(e) => setFormData({ ...formData, showBorder: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Tampilkan Border</span>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Status Template</h3>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Template Aktif</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Set as Default</span>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full overflow-auto">
              <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview - {formData.layout} Style
              </h3>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <div 
                  className={`w-full aspect-[1.414/1] rounded-lg shadow-xl overflow-hidden relative ${
                    formData.layout === 'CLASSIC' ? 'border-8' :
                    formData.layout === 'ELEGANT' ? 'border-2' :
                    formData.layout === 'MINIMAL' ? 'border-0' :
                    'border-4'
                  }`}
                  style={{
                    backgroundColor: formData.backgroundColor,
                    color: formData.textColor,
                    borderColor: formData.showBorder ? formData.primaryColor : 'transparent',
                    borderStyle: formData.showBorder ? (
                      formData.layout === 'CLASSIC' ? 'double' :
                      formData.layout === 'ELEGANT' ? 'solid' : 'solid'
                    ) : 'none'
                  }}
                >
                  {/* Decorative corners for CLASSIC layout */}
                  {formData.layout === 'CLASSIC' && formData.showBorder && (
                    <>
                      <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4" style={{ borderColor: formData.secondaryColor || formData.primaryColor }}></div>
                      <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4" style={{ borderColor: formData.secondaryColor || formData.primaryColor }}></div>
                      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4" style={{ borderColor: formData.secondaryColor || formData.primaryColor }}></div>
                      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4" style={{ borderColor: formData.secondaryColor || formData.primaryColor }}></div>
                    </>
                  )}

                  {/* Gradient background for ELEGANT */}
                  {formData.layout === 'ELEGANT' && (
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `linear-gradient(135deg, ${formData.primaryColor} 0%, ${formData.secondaryColor || formData.primaryColor} 100%)`
                      }}
                    ></div>
                  )}

                  <div className={`h-full p-8 flex flex-col items-center justify-center text-center relative z-10 ${
                    formData.layout === 'MODERN' ? 'gap-3' :
                    formData.layout === 'CLASSIC' ? 'gap-4' :
                    formData.layout === 'MINIMAL' ? 'gap-2' :
                    'gap-3'
                  }`}>
                    {/* Logo */}
                    {formData.showLogo && (
                      <div className={`${
                        formData.layout === 'CLASSIC' ? 'mb-6' :
                        formData.layout === 'ELEGANT' ? 'mb-4' : 'mb-4'
                      }`}>
                        {formData.logoUrl ? (
                          <Image 
                            src={formData.logoUrl} 
                            alt="Logo"
                            width={formData.layout === 'MINIMAL' ? 60 : 80}
                            height={formData.layout === 'MINIMAL' ? 60 : 80}
                            className="object-contain"
                          />
                        ) : (
                          <Award 
                            className={`${formData.layout === 'MINIMAL' ? 'w-12 h-12' : 'w-16 h-16'}`}
                            style={{ color: formData.primaryColor }}
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Title - Different styles per layout */}
                    <h1 
                      className={`font-bold mb-2 ${
                        formData.layout === 'CLASSIC' ? 'text-2xl uppercase tracking-widest' :
                        formData.layout === 'MODERN' ? 'text-3xl' :
                        formData.layout === 'MINIMAL' ? 'text-2xl' :
                        'text-3xl italic'
                      }`}
                      style={{ 
                        fontFamily: formData.fontFamily,
                        color: formData.primaryColor,
                        textShadow: formData.layout === 'ELEGANT' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {formData.layout === 'MINIMAL' ? 'Certificate' : 'CERTIFICATE OF COMPLETION'}
                    </h1>
                    
                    <p className={`text-sm ${formData.layout === 'MINIMAL' ? 'text-xs' : ''}`} style={{ opacity: 0.75 }}>
                      This is to certify that
                    </p>
                    
                    {/* Student Name */}
                    <h2 
                      className={`font-bold ${
                        formData.layout === 'CLASSIC' ? 'text-3xl underline decoration-2' :
                        formData.layout === 'MODERN' ? 'text-4xl' :
                        formData.layout === 'MINIMAL' ? 'text-3xl' :
                        'text-4xl italic'
                      }`}
                      style={{ 
                        fontFamily: formData.fontFamily,
                        textDecoration: formData.layout === 'CLASSIC' ? 'underline' : 'none',
                        textDecorationColor: formData.layout === 'CLASSIC' ? formData.primaryColor : 'transparent'
                      }}
                    >
                      John Doe
                    </h2>
                    
                    <p className={`text-sm ${formData.layout === 'MINIMAL' ? 'text-xs' : ''}`} style={{ opacity: 0.75 }}>
                      has successfully completed
                    </p>
                    
                    {/* Course Name */}
                    <h3 
                      className={`font-semibold ${
                        formData.layout === 'CLASSIC' ? 'text-xl uppercase' :
                        formData.layout === 'MODERN' ? 'text-2xl' :
                        formData.layout === 'MINIMAL' ? 'text-lg' :
                        'text-2xl italic'
                      }`}
                      style={{ color: formData.primaryColor }}
                    >
                      Course Title Here
                    </h3>
                    
                    {/* Mentor & Director Names */}
                    <div className="mt-4 space-y-1">
                      {formData.mentorName && (
                        <p className="text-sm" style={{ opacity: 0.75 }}>
                          Instructor: <span className="font-semibold">{formData.mentorName}</span>
                        </p>
                      )}
                      {formData.directorName && (
                        <p className="text-sm" style={{ opacity: 0.75 }}>
                          Director: <span className="font-semibold">{formData.directorName}</span>
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs mt-2" style={{ opacity: 0.6 }}>
                      {formData.layout === 'CLASSIC' ? 'Dated: November 25, 2025' : 'November 25, 2025'}
                    </p>
                    
                    {/* Signatures */}
                    {formData.showSignature && (
                      <div className={`mt-auto pt-6 flex ${
                        formData.directorName ? 'justify-around' : 'justify-center'
                      } w-full max-w-md`}>
                        {formData.signatureUrl ? (
                          <div className="text-center">
                            <Image 
                              src={formData.signatureUrl} 
                              alt="Signature"
                              width={100}
                              height={40}
                              className="mb-2 mx-auto"
                            />
                            <div 
                              className={`border-t-2 pt-1 px-6 ${formData.layout === 'CLASSIC' ? 'border-t-4' : ''}`}
                              style={{ borderColor: formData.primaryColor }}
                            >
                              <p className="text-xs font-semibold">{formData.mentorName || 'Authorized Signature'}</p>
                              <p className="text-xs opacity-60">Instructor</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-24 h-12 border-b-2 mb-2" style={{ borderColor: formData.primaryColor }}></div>
                            <p className="text-xs font-semibold">{formData.mentorName || 'Signature'}</p>
                            <p className="text-xs opacity-60">Instructor</p>
                          </div>
                        )}

                        {formData.directorName && (
                          <div className="text-center">
                            <div className="w-24 h-12 border-b-2 mb-2" style={{ borderColor: formData.primaryColor }}></div>
                            <p className="text-xs font-semibold">{formData.directorName}</p>
                            <p className="text-xs opacity-60">Director</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* QR Code placeholder */}
                    {formData.showQrCode && (
                      <div 
                        className={`absolute ${
                          formData.layout === 'CLASSIC' ? 'bottom-6 right-6' :
                          formData.layout === 'MINIMAL' ? 'bottom-4 right-4' :
                          'bottom-8 right-8'
                        } w-16 h-16 bg-white rounded border-2 flex items-center justify-center text-xs`}
                        style={{ borderColor: formData.primaryColor }}
                      >
                        <span className="text-gray-400">QR</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
