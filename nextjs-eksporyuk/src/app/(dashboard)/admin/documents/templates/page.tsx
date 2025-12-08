'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  Copy,
  Crown,
  Code,
  FileCode,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'

interface ExportDocument {
  id: string
  name: string
  type: string
  description: string | null
  templateHtml: string
  templateFields: any[]
  isActive: boolean
  isPremium: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  createdByUser: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    generated: number
  }
}

// Document types
const DOCUMENT_TYPES = [
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'PACKING_LIST', label: 'Packing List' },
  { value: 'BILL_OF_LADING', label: 'Bill of Lading' },
  { value: 'CERTIFICATE_OF_ORIGIN', label: 'Certificate of Origin' },
  { value: 'COMMERCIAL_INVOICE', label: 'Commercial Invoice' },
  { value: 'PROFORMA_INVOICE', label: 'Proforma Invoice' },
  { value: 'SHIPPING_INSTRUCTION', label: 'Shipping Instruction' },
  { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
  { value: 'QUOTATION', label: 'Quotation' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'OTHER', label: 'Lainnya' },
]

// Field types for template
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select/Dropdown' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'currency', label: 'Currency' },
]

export default function AdminDocumentTemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [templates, setTemplates] = useState<ExportDocument[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')

  // Filters
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    description: '',
    templateHtml: '',
    templateFields: [] as any[],
    isActive: true,
    isPremium: false,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<ExportDocument | null>(null)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTemplate, setDeleteTemplate] = useState<ExportDocument | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Field form state
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: '',
  })

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterType) params.set('type', filterType)
      if (filterStatus) params.set('status', filterStatus)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/admin/documents/templates?${params}`)
      const data = await res.json()

      if (res.ok) {
        setTemplates(data.templates)
        setTypes(data.types || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        toast.error(data.error || 'Gagal memuat template')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }, [search, filterType, filterStatus, page])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTemplates()
    }
  }, [status, fetchTemplates])

  const handleSearch = () => {
    setPage(1)
    fetchTemplates()
  }

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      type: '',
      description: '',
      templateHtml: '',
      templateFields: [],
      isActive: true,
      isPremium: false,
    })
    setIsEditing(false)
  }

  const handleEdit = (template: ExportDocument) => {
    setFormData({
      id: template.id,
      name: template.name,
      type: template.type,
      description: template.description || '',
      templateHtml: template.templateHtml,
      templateFields: template.templateFields || [],
      isActive: template.isActive,
      isPremium: template.isPremium,
    })
    setIsEditing(true)
    setActiveTab('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type || !formData.templateHtml) {
      toast.error('Nama, Tipe, dan Template HTML wajib diisi')
      return
    }

    try {
      setSubmitting(true)

      const url = isEditing
        ? `/api/admin/documents/templates/${formData.id}`
        : '/api/admin/documents/templates'

      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          description: formData.description,
          templateHtml: formData.templateHtml,
          templateFields: formData.templateFields,
          isActive: formData.isActive,
          isPremium: formData.isPremium,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(isEditing ? 'Template berhasil diperbarui' : 'Template berhasil dibuat')
        resetForm()
        setActiveTab('list')
        fetchTemplates()
      } else {
        toast.error(data.error || 'Gagal menyimpan template')
      }
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTemplate) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/documents/templates/${deleteTemplate.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Template berhasil dihapus')
        setDeleteOpen(false)
        setDeleteTemplate(null)
        fetchTemplates()
      } else {
        toast.error(data.error || 'Gagal menghapus template')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  const addField = () => {
    if (!newField.name || !newField.label) {
      toast.error('Nama field dan label wajib diisi')
      return
    }

    const field: any = {
      name: newField.name,
      label: newField.label,
      type: newField.type,
      required: newField.required,
      placeholder: newField.placeholder,
    }

    if (newField.type === 'select' && newField.options) {
      field.options = newField.options.split(',').map(opt => opt.trim())
    }

    setFormData(prev => ({
      ...prev,
      templateFields: [...prev.templateFields, field],
    }))

    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: '',
    })

    toast.success('Field berhasil ditambahkan')
  }

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      templateFields: prev.templateFields.filter((_, i) => i !== index),
    }))
  }

  const copyPlaceholder = (fieldName: string) => {
    navigator.clipboard.writeText(`{{${fieldName}}}`)
    toast.success(`Placeholder {{${fieldName}}} disalin ke clipboard`)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Template Dokumen Ekspor
          </h1>
          <p className="text-gray-500">Kelola template dokumen untuk member</p>
        </div>
        <Button onClick={() => { resetForm(); setActiveTab('form') }}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Daftar Template</TabsTrigger>
          <TabsTrigger value="form">{isEditing ? 'Edit' : 'Buat'} Template</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari template..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Cari
                </Button>
                <Button variant="outline" onClick={fetchTemplates}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Template</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Digunakan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        Belum ada template dokumen
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {template.name}
                                {template.isPremium && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                              {template.description && (
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {template.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {DOCUMENT_TYPES.find(t => t.value === template.type)?.label || template.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {Array.isArray(template.templateFields) ? template.templateFields.length : 0} fields
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {template._count.generated} dokumen
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? 'default' : 'secondary'}>
                            {template.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(template.createdAt), 'dd MMM yyyy', { locale: localeId })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {template.createdByUser?.name || template.createdByUser?.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPreviewTemplate(template)
                                setPreviewOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                setDeleteTemplate(template)
                                setDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Sebelumnya
              </Button>
              <span className="py-2 px-4">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="form">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column - Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Template</CardTitle>
                  <CardDescription>Data dasar template dokumen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Template *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Contoh: Invoice Ekspor Standar"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Tipe Dokumen *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe dokumen" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Deskripsi singkat tentang template ini"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="isActive">Aktif</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isPremium"
                        checked={formData.isPremium}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPremium: checked }))}
                      />
                      <Label htmlFor="isPremium" className="flex items-center gap-1">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        Premium Only
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right column - Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Field Input</CardTitle>
                  <CardDescription>Tambahkan field yang akan diisi user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Nama Field</Label>
                      <Input
                        value={newField.name}
                        onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value.replace(/\s/g, '_') }))}
                        placeholder="buyer_name"
                      />
                    </div>
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={newField.label}
                        onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Nama Buyer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Tipe</Label>
                      <Select
                        value={newField.type}
                        onValueChange={(value) => setNewField(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={newField.placeholder}
                        onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                        placeholder="Masukkan..."
                      />
                    </div>
                  </div>

                  {newField.type === 'select' && (
                    <div>
                      <Label>Options (pisahkan dengan koma)</Label>
                      <Input
                        value={newField.options}
                        onChange={(e) => setNewField(prev => ({ ...prev, options: e.target.value }))}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newField.required}
                      onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: checked }))}
                    />
                    <Label>Wajib diisi</Label>
                  </div>

                  <Button type="button" onClick={addField} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Field
                  </Button>

                  {/* List of fields */}
                  {formData.templateFields.length > 0 && (
                    <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                      <Label className="text-sm font-medium">Fields yang ditambahkan:</Label>
                      {formData.templateFields.map((field, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <Code className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm">{field.name}</span>
                            <span className="text-gray-500">-</span>
                            <span className="text-sm">{field.label}</span>
                            <Badge variant="outline" className="text-xs">{field.type}</Badge>
                            {field.required && <Badge variant="destructive" className="text-xs">Wajib</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => copyPlaceholder(field.name)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => removeField(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Template HTML */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Template HTML
                </CardTitle>
                <CardDescription>
                  Gunakan placeholder {`{{field_name}}`} untuk menampilkan data dari field.
                  Contoh: {`{{buyer_name}}`}, {`{{invoice_date}}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.templateHtml}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateHtml: e.target.value }))}
                  placeholder={`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { text-align: center; }
    .content { margin: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>No: {{invoice_number}}</p>
  </div>
  <div class="content">
    <p>Buyer: {{buyer_name}}</p>
    <p>Date: {{invoice_date}}</p>
  </div>
</body>
</html>`}
                  rows={20}
                  className="font-mono text-sm"
                  required
                />

                {formData.templateFields.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <Label className="text-sm font-medium text-blue-800">Placeholder yang tersedia:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.templateFields.map((field, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="font-mono text-xs"
                          onClick={() => copyPlaceholder(field.name)}
                        >
                          {`{{${field.name}}}`}
                          <Copy className="w-3 h-3 ml-1" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setActiveTab('list')
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Perbarui Template' : 'Simpan Template'}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview: {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Tipe: {DOCUMENT_TYPES.find(t => t.value === previewTemplate?.type)?.label || previewTemplate?.type}
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <Label className="text-sm font-medium">Fields ({Array.isArray(previewTemplate.templateFields) ? previewTemplate.templateFields.length : 0}):</Label>
                <div className="mt-2 space-y-1">
                  {Array.isArray(previewTemplate.templateFields) && previewTemplate.templateFields.map((field: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{field.type}</Badge>
                      <span className="font-mono">{field.name}</span>
                      <span>-</span>
                      <span>{field.label}</span>
                      {field.required && <Badge variant="destructive" className="text-xs">Wajib</Badge>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b font-medium text-sm">
                  Template HTML Preview
                </div>
                <div
                  className="p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.templateHtml }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Hapus Template
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus template "{deleteTemplate?.name}"?
              {deleteTemplate?._count.generated && deleteTemplate._count.generated > 0 && (
                <span className="block mt-2 text-yellow-600">
                  Template ini sudah digunakan untuk {deleteTemplate._count.generated} dokumen.
                  Template akan dinonaktifkan, bukan dihapus.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
