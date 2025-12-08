'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, Search, Plus, Edit, Trash2, CheckCircle, XCircle, 
  Eye, Heart, Download, Upload, ArrowLeft, Save, X, Package,
  Ship, CreditCard, MapPin, Globe, Phone, Mail, User, FileSpreadsheet,
  FileDown, Loader2
} from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/ui/searchable-select'

type Buyer = {
  id: string
  // Product Request
  productName?: string
  productSpecs?: string
  quantity?: string
  shippingTerms?: string
  destinationPort?: string
  paymentTerms?: string
  // Company
  companyName: string
  country: string
  city?: string
  address?: string
  // Contact
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  // Business
  businessType?: string
  productsInterest?: string
  annualImport?: string
  // Meta
  tags?: string
  notes?: string
  isVerified: boolean
  rating: number
  totalDeals: number
  viewCount: number
  likeCount: number
  createdAt: string
  addedByUser?: {
    name: string
    email: string
  }
}

// Complete list of countries
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',
  'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad',
  'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius',
  'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama', 'Papua New Guinea',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste',
  'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'UAE', 'Uganda', 'UK',
  'Ukraine', 'Uruguay', 'USA', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
  'Other'
]

const SHIPPING_TERMS = [
  { value: 'FOB', label: 'FOB (Free On Board)' },
  { value: 'CIF', label: 'CIF (Cost, Insurance & Freight)' },
  { value: 'CNF', label: 'CNF/CFR (Cost & Freight)' },
  { value: 'EXW', label: 'EXW (Ex Works)' },
  { value: 'DDP', label: 'DDP (Delivered Duty Paid)' },
  { value: 'DAP', label: 'DAP (Delivered at Place)' },
  { value: 'FCA', label: 'FCA (Free Carrier)' },
]

const PAYMENT_TERMS = [
  { value: 'T/T', label: 'T/T (Telegraphic Transfer)' },
  { value: 'L/C', label: 'L/C (Letter of Credit)' },
  { value: 'D/P', label: 'D/P (Documents Against Payment)' },
  { value: 'D/A', label: 'D/A (Documents Against Acceptance)' },
  { value: 'CAD', label: 'CAD (Cash Against Documents)' },
  { value: 'Open Account', label: 'Open Account' },
  { value: 'Advance Payment', label: 'Advance Payment' },
]

const QUANTITY_UNITS = [
  '20ft Container',
  '40ft Container',
  'Metric Ton (MT)',
  'Kilogram (KG)',
  'Pieces (PCS)',
  'Cartons (CTN)',
  'Pallets',
  'Other'
]

export default function AdminBuyersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterVerified, setFilterVerified] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  
  // Tab state
  const [activeTab, setActiveTab] = useState('list')
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null)
  
  // Import/Export state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState<{success?: boolean, message?: string, errors?: string[]} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    // Product Request
    productName: '',
    productSpecs: '',
    quantity: '',
    shippingTerms: '',
    destinationPort: '',
    paymentTerms: '',
    // Company
    companyName: '',
    country: '',
    city: '',
    address: '',
    // Contact
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    // Business
    businessType: '',
    productsInterest: '',
    annualImport: '',
    // Meta
    tags: '',
    notes: '',
    isVerified: false
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    } else if (status === 'authenticated') {
      fetchBuyers()
    }
  }, [status, router, session, page])

  useEffect(() => {
    if (status === 'authenticated') {
      const debounce = setTimeout(() => {
        setPage(1)
        fetchBuyers()
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [searchTerm, filterCountry, filterVerified, status])

  const fetchBuyers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterCountry && filterCountry !== 'all') params.append('country', filterCountry)
      if (filterVerified !== 'all') params.append('verified', filterVerified)
      params.append('page', page.toString())
      params.append('limit', '20')

      const res = await fetch(`/api/databases/buyers?${params}`)
      const data = await res.json()
      
      setBuyers(data.buyers || [])
      setPagination(data.pagination || { total: 0, totalPages: 0 })
    } catch (error) {
      console.error('Error fetching buyers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/databases/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        resetForm()
        setActiveTab('list')
        fetchBuyers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create buyer')
      }
    } catch (error) {
      console.error('Error creating buyer:', error)
      alert('Failed to create buyer')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingBuyer) return

    try {
      setSaving(true)
      const res = await fetch(`/api/databases/buyers/${editingBuyer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setEditingBuyer(null)
        resetForm()
        setActiveTab('list')
        fetchBuyers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update buyer')
      }
    } catch (error) {
      console.error('Error updating buyer:', error)
      alert('Failed to update buyer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedBuyer) return

    try {
      const res = await fetch(`/api/databases/buyers/${selectedBuyer.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setShowDeleteDialog(false)
        setSelectedBuyer(null)
        fetchBuyers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete buyer')
      }
    } catch (error) {
      console.error('Error deleting buyer:', error)
      alert('Failed to delete buyer')
    }
  }

  const openEditTab = (buyer: Buyer) => {
    setEditingBuyer(buyer)
    setFormData({
      productName: buyer.productName || '',
      productSpecs: buyer.productSpecs || '',
      quantity: buyer.quantity || '',
      shippingTerms: buyer.shippingTerms || '',
      destinationPort: buyer.destinationPort || '',
      paymentTerms: buyer.paymentTerms || '',
      companyName: buyer.companyName,
      country: buyer.country,
      city: buyer.city || '',
      address: buyer.address || '',
      contactPerson: buyer.contactPerson || '',
      email: buyer.email || '',
      phone: buyer.phone || '',
      website: buyer.website || '',
      businessType: buyer.businessType || '',
      productsInterest: buyer.productsInterest || '',
      annualImport: buyer.annualImport || '',
      tags: buyer.tags || '',
      notes: buyer.notes || '',
      isVerified: buyer.isVerified
    })
    setActiveTab('edit')
  }

  const openCreateTab = () => {
    setEditingBuyer(null)
    resetForm()
    setActiveTab('create')
  }

  const openDeleteDialog = (buyer: Buyer) => {
    setSelectedBuyer(buyer)
    setShowDeleteDialog(true)
  }

  const resetForm = () => {
    setFormData({
      productName: '',
      productSpecs: '',
      quantity: '',
      shippingTerms: '',
      destinationPort: '',
      paymentTerms: '',
      companyName: '',
      country: '',
      city: '',
      address: '',
      contactPerson: '',
      email: '',
      phone: '',
      website: '',
      businessType: '',
      productsInterest: '',
      annualImport: '',
      tags: '',
      notes: '',
      isVerified: false
    })
  }

  const cancelForm = () => {
    setEditingBuyer(null)
    resetForm()
    setActiveTab('list')
  }

  // Import/Export handlers
  const handleExport = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      if (filterCountry && filterCountry !== 'all') params.append('country', filterCountry)
      if (filterVerified !== 'all') params.append('verified', filterVerified)

      const res = await fetch(`/api/databases/buyers/export?${params}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `buyers_export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export buyers')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/databases/buyers/template')
      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'buyer_import_template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error) {
      console.error('Template download error:', error)
      alert('Failed to download template')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      setImportResult(null)

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/databases/buyers/import', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setImportResult({
          success: true,
          message: data.message,
          errors: data.errors
        })
        fetchBuyers()
      } else {
        setImportResult({
          success: false,
          message: data.error || 'Import failed',
          errors: data.details
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        message: 'Failed to import file'
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Form Component (reusable for create & edit)
  const BuyerForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={cancelForm}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-xl">{isEdit ? 'Edit Buyer Request' : 'Add New Buyer Request'}</CardTitle>
                <CardDescription>
                  {isEdit ? `Editing: ${editingBuyer?.companyName}` : 'Fill in the buyer request details below'}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelForm}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={isEdit ? handleEdit : handleCreate} 
                disabled={!formData.companyName || !formData.country || saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : (isEdit ? 'Update Buyer' : 'Create Buyer')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Product Request Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Product Request (WANTED)
          </CardTitle>
          <CardDescription>
            Information about the product this buyer is looking for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Label>Product Name *</Label>
              <Input
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g., Coconut, Coffee Beans, Palm Oil"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Main product the buyer is looking for</p>
            </div>
            
            <div>
              <Label>Quantity Required</Label>
              <Input
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g., 2 Twenty-Foot Container"
                className="mt-1"
              />
            </div>

            <div className="lg:col-span-3">
              <Label>Product Specifications</Label>
              <Textarea
                value={formData.productSpecs}
                onChange={(e) => setFormData({ ...formData, productSpecs: e.target.value })}
                placeholder="Type: Fresh Tender Coconut&#10;Grade: A&#10;Size: Medium to Large&#10;Packaging: Mesh Bags"
                rows={4}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Detailed specifications, type, grade, packaging requirements, etc.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping & Payment Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ship className="w-5 h-5 text-green-600" />
            Shipping & Payment Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Shipping Terms</Label>
              <Select value={formData.shippingTerms} onValueChange={(value) => setFormData({ ...formData, shippingTerms: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select shipping terms" />
                </SelectTrigger>
                <SelectContent>
                  {SHIPPING_TERMS.map(term => (
                    <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Destination Port</Label>
              <Input
                value={formData.destinationPort}
                onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
                placeholder="e.g., Sydney, Melbourne"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Payment Terms</Label>
              <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map(term => (
                    <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Label>Company Name *</Label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Business Type</Label>
              <Input
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                placeholder="e.g., Importer, Distributor, Retailer"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Country *</Label>
              <SearchableSelect
                options={COUNTRIES}
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
                placeholder="Select country"
                searchPlaceholder="Type to search country..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Annual Import Volume</Label>
              <Input
                value={formData.annualImport}
                onChange={(e) => setFormData({ ...formData, annualImport: e.target.value })}
                placeholder="e.g., $1M - $10M"
                className="mt-1"
              />
            </div>
            
            <div className="lg:col-span-3">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Contact Person</Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Enter contact name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+62 xxx xxx xxx"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-600" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Other Products of Interest</Label>
              <Textarea
                value={formData.productsInterest}
                onChange={(e) => setFormData({ ...formData, productsInterest: e.target.value })}
                placeholder="List other products this buyer might be interested in"
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Internal Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes about this buyer (not visible to members)"
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., premium, reliable, large-volume, urgent"
                className="mt-1"
              />
            </div>
            
            <div className="flex items-end">
              <div className="flex items-center gap-3 h-10">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <Label htmlFor="isVerified" className="cursor-pointer font-normal flex items-center gap-2">
                  <Badge variant={formData.isVerified ? "default" : "secondary"} className="text-sm py-1">
                    {formData.isVerified ? (
                      <><CheckCircle className="w-4 h-4 mr-1" /> Verified Buyer</>
                    ) : (
                      <><XCircle className="w-4 h-4 mr-1" /> Not Verified</>
                    )}
                  </Badge>
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Action Bar */}
      <Card className="sticky bottom-4 shadow-lg">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Required fields: Product Name, Company Name, Country
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
              <Button 
                onClick={isEdit ? handleEdit : handleCreate} 
                disabled={!formData.companyName || !formData.country || saving}
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : (isEdit ? 'Update Buyer' : 'Create Buyer')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <ResponsivePageWrapper>
      <div className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Header - Always visible */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Buyer Database Management</h1>
              <p className="text-gray-600 mt-2">Manage international buyers and importers</p>
            </div>
            <div className="flex gap-2">
              {activeTab === 'list' && (
                <>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setShowImportDialog(true)}
                  >
                    <Upload className="w-4 h-4" />
                    Import Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export
                  </Button>
                  <Button onClick={openCreateTab} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Buyer
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <TabsList className="mb-6">
            <TabsTrigger value="list" className="gap-2">
              <Building2 className="w-4 h-4" />
              Buyer List
            </TabsTrigger>
            {activeTab === 'create' && (
              <TabsTrigger value="create" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Buyer
              </TabsTrigger>
            )}
            {activeTab === 'edit' && editingBuyer && (
              <TabsTrigger value="edit" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit: {editingBuyer.companyName.substring(0, 20)}...
              </TabsTrigger>
            )}
          </TabsList>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Buyers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pagination.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Verified</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {buyers.filter(b => b.isVerified).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {buyers.reduce((sum, b) => sum + (b.viewCount || 0), 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Likes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {buyers.reduce((sum, b) => sum + (b.likeCount || 0), 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative col-span-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by product, company, contact..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <SearchableSelect
                    options={['all', ...COUNTRIES]}
                    value={filterCountry}
                    onValueChange={setFilterCountry}
                    placeholder="All Countries"
                    searchPlaceholder="Search country..."
                  />
                  <Select value={filterVerified} onValueChange={setFilterVerified}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="true">Verified</SelectItem>
                      <SelectItem value="false">Not Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product / Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Country
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Terms
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            Loading...
                          </td>
                        </tr>
                      ) : buyers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No buyers found. Click "Add Buyer" to create one.
                          </td>
                        </tr>
                      ) : (
                        buyers.map((buyer) => (
                          <tr key={buyer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  {buyer.productName && (
                                    <div className="font-medium text-blue-600 truncate">
                                      WANTED: {buyer.productName}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-900 truncate">{buyer.companyName}</div>
                                  {buyer.contactPerson && (
                                    <div className="text-xs text-gray-500 truncate">{buyer.contactPerson}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm text-gray-900">{buyer.country}</div>
                                  {buyer.destinationPort && (
                                    <div className="text-xs text-gray-500">Port: {buyer.destinationPort}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {buyer.email && (
                                <div className="text-sm text-gray-900 truncate max-w-xs flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {buyer.email}
                                </div>
                              )}
                              {buyer.phone && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {buyer.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {buyer.shippingTerms && (
                                  <Badge variant="outline" className="text-xs">{buyer.shippingTerms}</Badge>
                                )}
                                {buyer.paymentTerms && (
                                  <Badge variant="outline" className="text-xs ml-1">{buyer.paymentTerms}</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <Badge variant={buyer.isVerified ? "default" : "secondary"}>
                                  {buyer.isVerified ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" /> Verified</>
                                  ) : (
                                    <><XCircle className="w-3 h-3 mr-1" /> Pending</>
                                  )}
                                </Badge>
                                <div className="flex gap-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{buyer.viewCount || 0}</span>
                                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{buyer.likeCount || 0}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/databases/buyers/${buyer.id}`)}
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openEditTab(buyer)}
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openDeleteDialog(buyer)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 text-sm text-gray-600">
                  Page {page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create">
            <BuyerForm isEdit={false} />
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit">
            <BuyerForm isEdit={true} />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Buyer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedBuyer?.companyName}</strong>? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteDialog(false)
                setSelectedBuyer(null)
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                Import Buyers from Excel
              </DialogTitle>
              <DialogDescription>
                Upload an Excel file (.xlsx) to import buyers in bulk
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Download Template */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <FileDown className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">Download Template</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Download the template file with sample data and instructions
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleDownloadTemplate}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <label 
                  htmlFor="import-file"
                  className="flex flex-col items-center justify-center cursor-pointer py-4"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                      <span className="text-sm text-gray-600 mt-2">Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 mt-2">
                        Click to upload Excel file
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Supports .xlsx and .xls files
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={`p-4 rounded-lg ${
                  importResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        importResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {importResult.message}
                      </p>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <ul className="text-sm text-red-700 mt-2 space-y-1">
                          {importResult.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Required fields: Company Name, Country</p>
                <p>• Duplicate company names will be skipped</p>
                <p>• Use the template for correct column format</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => {
                setShowImportDialog(false)
                setImportResult(null)
              }}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsivePageWrapper>
  )
}
