'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileCheck, FileText, Download, Eye, Plus } from 'lucide-react'

type Template = {
  id: string
  name: string
  type: string
  description?: string
  isPremium: boolean
}

const DOC_TYPES = [
  { value: 'INVOICE', label: 'Commercial Invoice' },
  { value: 'PACKING_LIST', label: 'Packing List' },
  { value: 'COO', label: 'Certificate of Origin' },
  { value: 'BL', label: 'Bill of Lading' },
  { value: 'AWB', label: 'Air Waybill' },
  { value: 'CI', label: 'Consular Invoice' },
  { value: 'PO', label: 'Purchase Order' }
]

export default function ExportDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchTemplates()
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTemplates()
    }
  }, [filterType, status])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType && filterType !== 'all') params.append('type', filterType)
      params.append('isActive', 'true')

      const res = await fetch(`/api/documents/templates?${params}`)
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8"><div className="text-center">Loading...</div></div>
  }

  const isPremiumUser = session?.user?.role === 'ADMIN' || session?.user?.role === 'MEMBER_PREMIUM'

  return (
    <ResponsivePageWrapper>
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileCheck className="h-8 w-8" />
          Dokumen Ekspor
        </h1>
        <p className="text-gray-600 mt-2">Template dokumen untuk kebutuhan ekspor Anda</p>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="Semua Jenis Dokumen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!isPremiumUser && (
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Upgrade ke Premium
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const canUse = !template.isPremium || isPremiumUser
          
          return (
            <Card key={template.id} className={!canUse ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-8 w-8 text-blue-600" />
                  {template.isPremium && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                      Premium
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant="outline" className="w-fit">
                  {DOC_TYPES.find(t => t.value === template.type)?.label || template.type}
                </Badge>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    disabled={!canUse}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    disabled={!canUse}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
                {!canUse && (
                  <p className="text-xs text-orange-600 mt-2 text-center">
                    Upgrade ke Premium untuk mengakses template ini
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {templates.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Belum ada template tersedia</p>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="py-6">
          <h3 className="font-semibold text-lg mb-2">📄 Template Dokumen Ekspor</h3>
          <p className="text-sm text-gray-700 mb-4">
            Kami menyediakan berbagai template dokumen yang Anda butuhkan untuk ekspor, termasuk Commercial Invoice, Packing List, Certificate of Origin, dan lainnya.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium">✓ Mudah Digunakan</div>
              <div className="text-gray-600">Isi data, download PDF</div>
            </div>
            <div>
              <div className="font-medium">✓ Sesuai Standar</div>
              <div className="text-gray-600">Format internasional</div>
            </div>
            <div>
              <div className="font-medium">✓ Hemat Waktu</div>
              <div className="text-gray-600">Tidak perlu buat dari awal</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </ResponsivePageWrapper>
  )
}
