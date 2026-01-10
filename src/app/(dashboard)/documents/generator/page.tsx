'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, Download } from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  slug: string
  type: string
  description: string
  thumbnail?: string
  isPremium: boolean
}

interface Field {
  name: string
  label: string
  type: string
  required: boolean
  options?: string[]
}

export default function DocumentGeneratorPage() {
  const { data: session, status } = useSession()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateDetails, setTemplateDetails] = useState<any>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showMemberModal, setShowMemberModal] = useState(false)

  // Check jika user adalah member
  const isMember = session?.user?.role !== 'MEMBER_FREE' || false

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/documents/templates', {
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Templates fetch error:', res.status, data)
        return
      }
      setTemplates(data.templates || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching templates:', error)
      setLoading(false)
    }
  }

  const selectTemplate = (template: Template) => {
    if (!isMember) {
      setShowMemberModal(true)
      return
    }

    setSelectedTemplate(template)
    fetchTemplateDetails(template.id)
  }

  const fetchTemplateDetails = async (templateId: string) => {
    try {
      const res = await fetch(`/api/documents/templates/${templateId}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Template detail fetch error:', res.status, data)
        return
      }
      setTemplateDetails(data)
      setFields(JSON.parse(data.templateFields || '[]'))
      setFormData({})
      setPreview(data.templateHtml)
    } catch (error) {
      console.error('Error fetching template details:', error)
    }
  }

  const handleInputChange = (fieldName: string, value: string) => {
    const newData = { ...formData, [fieldName]: value }
    setFormData(newData)

    // Update preview real-time
    if (templateDetails) {
      let html = templateDetails.templateHtml
      Object.entries(newData).forEach(([key, val]) => {
        const placeholder = `{{${key}}}`
        html = html.replace(new RegExp(placeholder, 'g'), String(val || ''))
      })
      setPreview(html)
    }
  }

  const handleGenerate = async () => {
    if (!selectedTemplate || !templateDetails) return

    try {
      setLoading(true)
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          title: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
          data: formData
        })
      })

      const responseData = await res.json()

      if (!res.ok) {
        console.error('API Error:', {
          status: res.status,
          statusText: res.statusText,
          error: responseData.error,
          message: responseData.message
        })
        throw new Error(responseData.message || 'Failed to generate document')
      }

      // TODO: Download atau preview PDF
      alert('Document generated successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate document')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">Silakan Login</h2>
          <p className="text-gray-600 mb-6">Anda perlu login untuk mengakses document generator</p>
          <Link href="/login">
            <Button>Login Sekarang</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Modal untuk non-member
  if (showMemberModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-md p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold mb-2">Khusus Member</h2>
            <p className="text-gray-600 mb-6">
              Document Generator hanya tersedia untuk member komunitas. Bergabunglah sekarang untuk mengakses fitur ini!
            </p>
            <div className="space-y-3">
              <Link href="/membership" className="block">
                <Button className="w-full">Lihat Paket Membership</Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowMemberModal(false)}
              >
                Kembali
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Jika sudah memilih template
  if (selectedTemplate && templateDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Form Input - Kiri */}
          <div className="space-y-6 overflow-y-auto pr-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{selectedTemplate.name}</h1>
              <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null)
                  setTemplateDetails(null)
                }}
              >
                ← Kembali ke Template
              </Button>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Data Dokumen</h2>
              <form className="space-y-4">
                {fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500"> *</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        rows={3}
                        required={field.required}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        required={field.required}
                      >
                        <option value="">-- Pilih --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </form>

              <div className="mt-6 space-y-2">
                <Button
                  onClick={handleGenerate}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Generate Document
                </Button>
              </div>
            </Card>
          </div>

          {/* Live Preview - Kanan */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-2">📄 Preview</h2>
              <div className="text-xs text-gray-500">Update real-time saat Anda mengisi form</div>
            </div>
            <Card className="p-6 bg-gray-50 overflow-y-auto flex-1">
              <div
                className="bg-white p-4 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // List Templates
  return (
    <ResponsivePageWrapper>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Document Generator</h1>
        <p className="text-gray-600">
          Buat dokumen bisnis profesional dengan template siap pakai
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => selectTemplate(template)}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold">{template.name}</h3>
              {template.isPremium && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Premium</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{template.type}</span>
              <Button size="sm" variant="outline">
                Gunakan Template →
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Tidak ada template tersedia</p>
        </Card>
      )}
    </ResponsivePageWrapper>
  )
}
