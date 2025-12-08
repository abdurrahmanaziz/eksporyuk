'use client'

import { useState, useEffect } from 'react'
import FeatureLock from '@/components/affiliate/FeatureLock'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  UserPlus, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Tag,
  X,
  Mail,
  Phone,
  MessageSquare,
  Download
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  status: string
  source: string
  notes: string | null
  lastContactedAt: Date | null
  createdAt: Date
  optinForm?: {
    formName: string
  } | null
  tags: {
    id: string
    tag: string
  }[]
}

interface LeadStats {
  new: number
  contacted: number
  qualified: number
  converted: number
  inactive: number
}

export default function LeadsPage() {
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const [filters, setFilters] = useState({
    status: '',
    source: '',
    search: '',
    tag: '',
    startDate: '',
    endDate: ''
  })

  const [showLeadModal, setShowLeadModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<string | null>(null)
  const [managingTags, setManagingTags] = useState<Lead | null>(null)
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  const [leadFormData, setLeadFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    status: 'new',
    source: 'manual',
    notes: ''
  })

  useEffect(() => {
    fetchLeads()
  }, [filters, pagination.page])

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.source && { source: filters.source }),
        ...(filters.search && { search: filters.search }),
        ...(filters.tag && { tag: filters.tag }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const res = await fetch(`/api/affiliate/leads?${params}`)
      const data = await res.json()

      if (res.ok) {
        setLeads(data.leads)
        setStats(data.stats)
        setPagination({
          ...pagination,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        })
      } else {
        toast.error('Gagal memuat leads')
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Gagal memuat leads')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead)
      setLeadFormData({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        whatsapp: lead.whatsapp || '',
        status: lead.status,
        source: lead.source,
        notes: lead.notes || ''
      })
    } else {
      setEditingLead(null)
      setLeadFormData({
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        status: 'new',
        source: 'manual',
        notes: ''
      })
    }
    setShowLeadModal(true)
  }

  const handleSave = async () => {
    if (!leadFormData.name.trim()) {
      toast.error('Nama harus diisi')
      return
    }

    setSaving(true)
    try {
      const url = editingLead 
        ? `/api/affiliate/leads/${editingLead.id}`
        : '/api/affiliate/leads'
      
      const res = await fetch(url, {
        method: editingLead ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadFormData)
      })

      if (res.ok) {
        toast.success(editingLead ? 'Lead berhasil diupdate!' : 'Lead berhasil ditambahkan!')
        setShowLeadModal(false)
        await fetchLeads()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan lead')
      }
    } catch (error) {
      console.error('Error saving lead:', error)
      toast.error('Gagal menyimpan lead')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (leadId: string) => {
    try {
      const res = await fetch(`/api/affiliate/leads/${leadId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Lead berhasil dihapus!')
        setDeletingLead(null)
        await fetchLeads()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Gagal menghapus lead')
    }
  }

  const handleAddTag = async (leadId: string) => {
    if (!newTag.trim()) return

    try {
      const res = await fetch(`/api/affiliate/leads/${leadId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTag.trim() })
      })

      if (res.ok) {
        toast.success('Tag berhasil ditambahkan!')
        setNewTag('')
        await fetchLeads()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menambahkan tag')
      }
    } catch (error) {
      console.error('Error adding tag:', error)
      toast.error('Gagal menambahkan tag')
    }
  }

  const handleRemoveTag = async (leadId: string, tagId: string) => {
    try {
      const res = await fetch(`/api/affiliate/leads/${leadId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId })
      })

      if (res.ok) {
        toast.success('Tag berhasil dihapus!')
        await fetchLeads()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus tag')
      }
    } catch (error) {
      console.error('Error removing tag:', error)
      toast.error('Gagal menghapus tag')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      contacted: 'bg-yellow-100 text-yellow-700',
      qualified: 'bg-purple-100 text-purple-700',
      converted: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Baru',
      contacted: 'Dihubungi',
      qualified: 'Qualified',
      converted: 'Converted',
      inactive: 'Tidak Aktif'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Memuat Leads...</p>
            </div>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <FeatureLock feature="leads">
    <ResponsivePageWrapper>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold">Leads (Mini CRM)</h1>
                <p className="text-gray-600">Kelola dan follow-up leads Anda</p>
              </div>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Lead
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Baru</p>
                <p className="text-3xl font-bold text-blue-600">{stats.new || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Dihubungi</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.contacted || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Qualified</p>
                <p className="text-3xl font-bold text-purple-600">{stats.qualified || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Converted</p>
                <p className="text-3xl font-bold text-green-600">{stats.converted || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Tidak Aktif</p>
                <p className="text-3xl font-bold text-gray-600">{stats.inactive || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label>Cari</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nama, email, atau phone..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="new">Baru</SelectItem>
                    <SelectItem value="contacted">Dihubungi</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sumber</Label>
                <Select
                  value={filters.source}
                  onValueChange={(value) => setFilters({ ...filters, source: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Sumber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sumber</SelectItem>
                    <SelectItem value="optin">Optin Form</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Tag</Label>
                <Input
                  placeholder="Filter by tag..."
                  value={filters.tag}
                  onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                />
              </div>
              <div>
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setFilters({ status: '', source: '', search: '', tag: '', startDate: '', endDate: '' })}
                >
                  Reset Filter
                </Button>
              </div>
              <div className="flex items-end">
                <Button 
                  className="w-full"
                  onClick={async () => {
                    try {
                      const params = new URLSearchParams({
                        export: 'csv',
                        ...(filters.status && { status: filters.status }),
                        ...(filters.source && { source: filters.source }),
                        ...(filters.search && { search: filters.search }),
                        ...(filters.tag && { tag: filters.tag }),
                        ...(filters.startDate && { startDate: filters.startDate }),
                        ...(filters.endDate && { endDate: filters.endDate })
                      })
                      const res = await fetch(`/api/affiliate/leads?${params}`)
                      if (res.ok) {
                        const blob = await res.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        window.URL.revokeObjectURL(url)
                        toast.success('Export berhasil!')
                      } else {
                        toast.error('Gagal export data')
                      }
                    } catch (error) {
                      console.error('Error exporting:', error)
                      toast.error('Gagal export data')
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardContent className="p-0">
            {leads.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Belum ada leads</h3>
                <p className="text-gray-500 mb-4">
                  Mulai kumpulkan leads dari Optin Form atau tambahkan manual
                </p>
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Lead Pertama
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sumber</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium">{lead.name}</div>
                          {lead.optinForm && (
                            <div className="text-xs text-gray-500">{lead.optinForm.formName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            {lead.email && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </div>
                            )}
                            {lead.whatsapp && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <MessageSquare className="h-3 w-3" />
                                {lead.whatsapp}
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(lead.status)}>
                            {getStatusLabel(lead.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 capitalize">{lead.source}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {lead.tags.map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                {tag.tag}
                              </Badge>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => setManagingTags(lead)}
                            >
                              <Tag className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(lead.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(lead)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingLead(lead.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {leads.length > 0 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Menampilkan {leads.length} dari {pagination.total} leads
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Modal */}
        <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLead ? 'Edit Lead' : 'Tambah Lead Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingLead ? 'Update informasi lead' : 'Tambahkan lead baru secara manual'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={leadFormData.name}
                  onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadFormData.email}
                    onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={leadFormData.phone}
                    onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                    placeholder="08123456789"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={leadFormData.whatsapp}
                  onChange={(e) => setLeadFormData({ ...leadFormData, whatsapp: e.target.value })}
                  placeholder="628123456789"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={leadFormData.status}
                    onValueChange={(value) => setLeadFormData({ ...leadFormData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Baru</SelectItem>
                      <SelectItem value="contacted">Dihubungi</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Sumber</Label>
                  <Select
                    value={leadFormData.source}
                    onValueChange={(value) => setLeadFormData({ ...leadFormData, source: value })}
                    disabled={!!editingLead}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="optin">Optin Form</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={leadFormData.notes}
                  onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })}
                  placeholder="Catatan tentang lead ini..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLeadModal(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : editingLead ? 'Update Lead' : 'Tambah Lead'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tag Management Modal */}
        <Dialog open={!!managingTags} onOpenChange={() => setManagingTags(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kelola Tags</DialogTitle>
              <DialogDescription>
                Tambah atau hapus tags untuk {managingTags?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Tags Saat Ini</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {managingTags?.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="gap-1">
                      {tag.tag}
                      <button
                        onClick={() => managingTags && handleRemoveTag(managingTags.id, tag.id)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!managingTags?.tags || managingTags.tags.length === 0) && (
                    <p className="text-sm text-gray-500">Belum ada tags</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="newTag">Tambah Tag Baru</Label>
                <div className="flex gap-2">
                  <Input
                    id="newTag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Masukkan tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && managingTags) {
                        handleAddTag(managingTags.id)
                      }
                    }}
                  />
                  <Button
                    onClick={() => managingTags && handleAddTag(managingTags.id)}
                    disabled={!newTag.trim()}
                  >
                    Tambah
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setManagingTags(null)}>
                Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingLead} onOpenChange={() => setDeletingLead(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Lead?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus lead ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingLead && handleDelete(deletingLead)}
                className="bg-red-600 hover:bg-red-700"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ResponsivePageWrapper>
    </FeatureLock>
  )
}
