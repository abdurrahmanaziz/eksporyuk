'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const PACKAGE_TYPES = [
  { value: 'BASIC', label: 'Paket Dasar' },
  { value: 'PROFESSIONAL', label: 'Paket Profesional' },
  { value: 'ENTERPRISE', label: 'Paket Enterprise' }
]

const DURATIONS = [
  { value: 'MONTHLY', label: 'Bulanan' },
  { value: 'QUARTERLY', label: 'Triwulanan' },
  { value: 'YEARLY', label: 'Tahunan' },
  { value: 'LIFETIME', label: 'Seumur Hidup' }
]

const DEFAULT_FEATURES = {
  maxProducts: 10,
  maxCategories: 5,
  orderManagement: true,
  analyticsAccess: true,
  customBranding: false,
  dedicatedSupport: false,
  apiAccess: false
}

export default function CreateSupplierPackagePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    type: 'BASIC',
    duration: 'MONTHLY',
    price: '',
    originalPrice: '',
    description: '',
    isActive: true,
    displayOrder: 0,
    features: DEFAULT_FEATURES,
    commissionType: 'PERCENTAGE',
    affiliateCommissionRate: '30'
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setForm(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleFeatureChange = (feature: keyof typeof DEFAULT_FEATURES, value: any) => {
    setForm(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name || !form.slug || !form.price) {
      setError('Nama, slug, dan harga harus diisi')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/supplier/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
          affiliateCommissionRate: parseFloat(form.affiliateCommissionRate) || 30
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || errorData.message || 'Failed to create package')
      }

      router.push('/admin/supplier/packages')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating package')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/supplier/packages">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Buat Paket Supplier Baru</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-800">{error}</CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Paket *</label>
              <Input
                value={form.name}
                onChange={handleNameChange}
                placeholder="Contoh: Paket Premium Supplier"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug *</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="paket-premium-supplier"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Slug otomatis dihasilkan dari nama paket
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipe Paket *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  {PACKAGE_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Durasi *</label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  {DURATIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi lengkap tentang paket ini"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Harga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Harga Paket *</label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Harga Asli (Opsional)</label>
                <Input
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => setForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                  placeholder="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Untuk menampilkan diskon</p>
              </div>
            </div>

            {/* Affiliate Commission */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipe Komisi Affiliate</label>
                <select
                  value={form.commissionType}
                  onChange={(e) => setForm(prev => ({ ...prev, commissionType: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FLAT">Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {form.commissionType === 'PERCENTAGE' ? 'Komisi Affiliate (%)' : 'Komisi Affiliate (Rp)'}
                </label>
                <Input
                  type="number"
                  value={form.affiliateCommissionRate}
                  onChange={(e) => setForm(prev => ({ ...prev, affiliateCommissionRate: e.target.value }))}
                  placeholder={form.commissionType === 'PERCENTAGE' ? '30' : '100000'}
                  step={form.commissionType === 'PERCENTAGE' ? '1' : '1000'}
                />
                <p className="text-xs text-gray-500 mt-1">Komisi untuk affiliate per transaksi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Fitur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Maksimal Produk</label>
              <Input
                type="number"
                value={form.features.maxProducts}
                onChange={(e) => handleFeatureChange('maxProducts', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Maksimal Kategori</label>
              <Input
                type="number"
                value={form.features.maxCategories}
                onChange={(e) => handleFeatureChange('maxCategories', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.features.orderManagement}
                  onChange={(e) => handleFeatureChange('orderManagement', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Manajemen Pesanan</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.features.analyticsAccess}
                  onChange={(e) => handleFeatureChange('analyticsAccess', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Akses Analitik</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.features.customBranding}
                  onChange={(e) => handleFeatureChange('customBranding', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Branding Kustom</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.features.dedicatedSupport}
                  onChange={(e) => handleFeatureChange('dedicatedSupport', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Dukungan Dedicated</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.features.apiAccess}
                  onChange={(e) => handleFeatureChange('apiAccess', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Akses API</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Urutan Tampilan</label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
              />
              <p className="text-xs text-gray-500 mt-1">Angka lebih kecil tampil di awal</p>
            </div>

            <label className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Paket Aktif</span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? 'Membuat...' : 'Buat Paket'}
          </Button>
          <Link href="/admin/supplier/packages">
            <Button variant="outline">Batal</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
