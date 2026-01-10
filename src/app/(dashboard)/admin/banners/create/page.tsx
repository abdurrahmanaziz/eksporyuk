'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

const PLACEMENTS = [
  { value: 'DASHBOARD', label: 'Dashboard', description: 'Banner utama di halaman dashboard' },
  { value: 'FEED', label: 'Feed', description: 'Banner di feed posts (setiap 5 posts)' },
  { value: 'GROUP', label: 'Group', description: 'Banner di halaman grup' },
  { value: 'PROFILE', label: 'Profile', description: 'Banner di halaman profil' },
  { value: 'SIDEBAR', label: 'Sidebar', description: 'Banner di sidebar kanan' },
  { value: 'POPUP', label: 'Popup', description: 'Banner popup modal' },
  { value: 'FLOATING', label: 'Floating', description: 'Banner mengambang di pojok' },
]

const DISPLAY_TYPES = [
  { value: 'CAROUSEL', label: 'Carousel', description: 'Banner carousel (slide)' },
  { value: 'STATIC', label: 'Static', description: 'Banner statis biasa' },
  { value: 'VIDEO', label: 'Video', description: 'Banner video autoplay' },
  { value: 'POPUP', label: 'Popup', description: 'Banner popup modal' },
  { value: 'FLOATING', label: 'Floating', description: 'Banner floating button' },
  { value: 'INLINE', label: 'Inline', description: 'Banner inline di konten' },
]

const ROLES = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'AFFILIATE', label: 'Affiliate' },
  { value: 'SUPPLIER', label: 'Supplier' },
  { value: 'ADMIN', label: 'Admin' },
]

const MEMBERSHIPS = [
  { value: 'basic', label: 'Basic Member' },
  { value: 'pro', label: 'Pro Member' },
  { value: 'lifetime', label: 'Lifetime Member' },
]

export default function CreateBannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
    linkText: 'Lihat Selengkapnya',
    placement: 'DASHBOARD',
    displayType: 'STATIC',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#3b82f6',
    buttonTextColor: '#ffffff',
    priority: 5,
    startDate: '',
    endDate: '',
    isActive: true,
    viewLimit: null as number | null,
    clickLimit: null as number | null,
    dailyBudget: null as number | null,
    isSponsored: false,
    sponsorName: '',
    sponsorLogo: '',
    targetRoles: [] as string[],
    targetMemberships: [] as string[],
    targetProvinces: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/admin/banners')
      } else {
        alert('Gagal membuat banner')
      }
    } catch (error) {
      console.error('Error creating banner:', error)
      alert('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'banner')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      
      if (res.ok) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
        setImagePreview(data.url)
      } else {
        alert('Gagal upload gambar')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Terjadi kesalahan saat upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <ResponsivePageWrapper>
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/banners"
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buat Banner Baru</h1>
          <p className="text-gray-600 mt-1">Buat banner promosi atau iklan baru</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Informasi Banner</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul Banner *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Contoh: Promo Member Pro 50%"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Deskripsi singkat banner..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gambar Banner *
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Upload gambar</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF (maks 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              
              {imagePreview && (
                <div className="relative w-60 h-40">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video URL (opsional)
            </label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>

        {/* Link & CTA */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900">Link & Call to Action</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link URL
            </label>
            <input
              type="url"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Button
            </label>
            <input
              type="text"
              value={formData.linkText}
              onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Lihat Selengkapnya"
            />
          </div>
        </div>

        {/* Placement & Display */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900">Penempatan & Tampilan</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Penempatan *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PLACEMENTS.map((placement) => (
                <label
                  key={placement.value}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                    formData.placement === placement.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="placement"
                    value={placement.value}
                    checked={formData.placement === placement.value}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value as any })}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{placement.label}</div>
                    <div className="text-xs text-gray-600">{placement.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Tampilan *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DISPLAY_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                    formData.displayType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="displayType"
                    value={type.value}
                    checked={formData.displayType === type.value}
                    onChange={(e) => setFormData({ ...formData, displayType: e.target.value as any })}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority (1-10, semakin tinggi semakin prioritas)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Styling */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900">Styling</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <input
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Color
              </label>
              <input
                type="color"
                value={formData.buttonColor}
                onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Text Color
              </label>
              <input
                type="color"
                value={formData.buttonTextColor}
                onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900">Jadwal & Budget</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limit Views (opsional)
              </label>
              <input
                type="number"
                min="0"
                value={formData.viewLimit || ''}
                onChange={(e) => setFormData({ ...formData, viewLimit: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limit Clicks (opsional)
              </label>
              <input
                type="number"
                min="0"
                value={formData.clickLimit || ''}
                onChange={(e) => setFormData({ ...formData, clickLimit: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Unlimited"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Budget (Rp) (opsional)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.dailyBudget || ''}
                onChange={(e) => setFormData({ ...formData, dailyBudget: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Unlimited"
              />
            </div>
          </div>
        </div>

        {/* Targeting */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900">Targeting (opsional)</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Role
            </label>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <label key={role.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.targetRoles.includes(role.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, targetRoles: [...formData.targetRoles, role.value] })
                      } else {
                        setFormData({ ...formData, targetRoles: formData.targetRoles.filter(r => r !== role.value) })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Membership
            </label>
            <div className="space-y-2">
              {MEMBERSHIPS.map((membership) => (
                <label key={membership.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.targetMemberships.includes(membership.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, targetMemberships: [...formData.targetMemberships, membership.value] })
                      } else {
                        setFormData({ ...formData, targetMemberships: formData.targetMemberships.filter(m => m !== membership.value) })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-gray-700">{membership.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sponsor */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isSponsored"
              checked={formData.isSponsored}
              onChange={(e) => setFormData({ ...formData, isSponsored: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isSponsored" className="text-sm font-medium text-gray-700">
              Banner Sponsor (berbayar)
            </label>
          </div>

          {formData.isSponsored && (
            <div className="space-y-4 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Sponsor
                </label>
                <input
                  type="text"
                  value={formData.sponsorName}
                  onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PT. Sponsor Indonesia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo Sponsor URL
                </label>
                <input
                  type="url"
                  value={formData.sponsorLogo}
                  onChange={(e) => setFormData({ ...formData, sponsorLogo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Aktifkan banner segera setelah dibuat
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <Link
            href="/admin/banners"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.title || !formData.imageUrl}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Membuat...' : 'Buat Banner'}
          </button>
        </div>
      </form>
    </div>
    </ResponsivePageWrapper>
  )
}
