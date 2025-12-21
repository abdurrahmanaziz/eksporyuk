'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { getRoleTheme } from '@/lib/role-themes'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import SettingsNav from '@/components/admin/SettingsNav'
import {
  Palette,
  Save,
  RotateCcw,
  Image as ImageIcon,
  Type,
  Layout,
  Bell,
  Upload,
  X,
  CheckCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

type TabType = 'logo' | 'warna' | 'typography' | 'komponen' | 'notifikasi'

interface BrandingSettings {
  id: number
  siteLogo?: string
  logoAffiliate?: string
  favicon?: string
  brandName?: string
  brandShortName?: string
  tagline?: string
  typographyHeadingSize?: string
  typographyBodySize?: string
  typographyFontFamily?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  buttonPrimaryBg: string
  buttonPrimaryText: string
  buttonSecondaryBg: string
  buttonSecondaryText: string
  buttonSuccessBg: string
  buttonSuccessText: string
  buttonDangerBg: string
  buttonDangerText: string
  buttonBorderRadius: string
  dashboardSidebarBg: string
  dashboardSidebarText: string
  dashboardSidebarActiveText: string
  dashboardSidebarActiveBg: string
  dashboardSidebarHoverBg: string
  dashboardHeaderBg: string
  dashboardHeaderText: string
  dashboardBodyBg: string
  dashboardCardBg: string
  dashboardCardBorder: string
  dashboardCardHeaderBg: string
  dashboardTextPrimary: string
  dashboardTextSecondary: string
  dashboardTextMuted: string
  dashboardBorderColor: string
  dashboardSuccessColor: string
  dashboardWarningColor: string
  dashboardDangerColor: string
  dashboardInfoColor: string
}

const EKSPOR_YUK_BRAND = {
  primaryColor: '#0066CC',
  secondaryColor: '#0052CC',
  accentColor: '#3399FF',
  buttonPrimaryBg: '#0066CC',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#6B7280',
  buttonSecondaryText: '#FFFFFF',
  buttonSuccessBg: '#10B981',
  buttonSuccessText: '#FFFFFF',
  buttonDangerBg: '#EF4444',
  buttonDangerText: '#FFFFFF',
  buttonBorderRadius: '0.5rem',
  dashboardSidebarBg: '#1e293b',
  dashboardSidebarText: '#e2e8f0',
  dashboardSidebarActiveText: '#ffffff',
  dashboardSidebarActiveBg: '#3b82f6',
  dashboardSidebarHoverBg: '#334155',
  dashboardHeaderBg: '#ffffff',
  dashboardHeaderText: '#1f2937',
  dashboardBodyBg: '#f1f5f9',
  dashboardCardBg: '#ffffff',
  dashboardCardBorder: '#e2e8f0',
  dashboardCardHeaderBg: '#f8fafc',
  dashboardTextPrimary: '#1f2937',
  dashboardTextSecondary: '#64748b',
  dashboardTextMuted: '#94a3b8',
  dashboardBorderColor: '#e2e8f0',
  dashboardSuccessColor: '#22c55e',
  dashboardWarningColor: '#f59e0b',
  dashboardDangerColor: '#ef4444',
  dashboardInfoColor: '#3b82f6',
}

const TABS = [
  { id: 'logo' as TabType, label: 'Logo & Identitas', icon: ImageIcon },
  { id: 'warna' as TabType, label: 'Warna & Tema', icon: Palette },
  { id: 'typography' as TabType, label: 'Typography & Teks', icon: Type },
  { id: 'komponen' as TabType, label: 'Komponen UI', icon: Layout },
  { id: 'notifikasi' as TabType, label: 'Notifikasi Realtime', icon: Bell },
]

export default function AdminBrandingSettings() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('logo')
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null)
  
  const [settings, setSettings] = useState<BrandingSettings>({
    id: 1,
    siteLogo: '',
    logoAffiliate: '',
    favicon: '',
    brandName: 'Ekspor Yuk',
    brandShortName: 'EY',
    tagline: 'Platform Membership & Edukasi Ekspor',
    typographyHeadingSize: '2.5rem',
    typographyBodySize: '1rem',
    typographyFontFamily: 'Inter, system-ui, sans-serif',
    ...EKSPOR_YUK_BRAND,
  })

  const theme = getRoleTheme(session?.user?.role || 'ADMIN')

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }

    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings/branding')
      const data = await response.json()

      if (data.success && data.settings) {
        setSettings(prev => ({
          ...prev,
          id: data.settings.id || 1,
          siteLogo: data.settings.siteLogo || '',
          logoAffiliate: data.settings.logoAffiliate || '',
          favicon: data.settings.favicon || '',
          brandName: data.settings.brandName || 'Ekspor Yuk',
          brandShortName: data.settings.brandShortName || 'EY',
          tagline: data.settings.tagline || 'Platform Membership & Edukasi Ekspor',
          typographyHeadingSize: data.settings.typographyHeadingSize || '2.5rem',
          typographyBodySize: data.settings.typographyBodySize || '1rem',
          typographyFontFamily: data.settings.typographyFontFamily || 'Inter, system-ui, sans-serif',
          primaryColor: data.settings.primaryColor || EKSPOR_YUK_BRAND.primaryColor,
          secondaryColor: data.settings.secondaryColor || EKSPOR_YUK_BRAND.secondaryColor,
          accentColor: data.settings.accentColor || EKSPOR_YUK_BRAND.accentColor,
          buttonPrimaryBg: data.settings.buttonPrimaryBg || EKSPOR_YUK_BRAND.buttonPrimaryBg,
          buttonPrimaryText: data.settings.buttonPrimaryText || EKSPOR_YUK_BRAND.buttonPrimaryText,
          buttonSecondaryBg: data.settings.buttonSecondaryBg || EKSPOR_YUK_BRAND.buttonSecondaryBg,
          buttonSecondaryText: data.settings.buttonSecondaryText || EKSPOR_YUK_BRAND.buttonSecondaryText,
          buttonSuccessBg: data.settings.buttonSuccessBg || EKSPOR_YUK_BRAND.buttonSuccessBg,
          buttonSuccessText: data.settings.buttonSuccessText || EKSPOR_YUK_BRAND.buttonSuccessText,
          buttonDangerBg: data.settings.buttonDangerBg || EKSPOR_YUK_BRAND.buttonDangerBg,
          buttonDangerText: data.settings.buttonDangerText || EKSPOR_YUK_BRAND.buttonDangerText,
          buttonBorderRadius: data.settings.buttonBorderRadius || EKSPOR_YUK_BRAND.buttonBorderRadius,
          dashboardSidebarBg: data.settings.dashboardSidebarBg || EKSPOR_YUK_BRAND.dashboardSidebarBg,
          dashboardSidebarText: data.settings.dashboardSidebarText || EKSPOR_YUK_BRAND.dashboardSidebarText,
          dashboardSidebarActiveText: data.settings.dashboardSidebarActiveText || EKSPOR_YUK_BRAND.dashboardSidebarActiveText,
          dashboardSidebarActiveBg: data.settings.dashboardSidebarActiveBg || EKSPOR_YUK_BRAND.dashboardSidebarActiveBg,
          dashboardSidebarHoverBg: data.settings.dashboardSidebarHoverBg || EKSPOR_YUK_BRAND.dashboardSidebarHoverBg,
          dashboardHeaderBg: data.settings.dashboardHeaderBg || EKSPOR_YUK_BRAND.dashboardHeaderBg,
          dashboardHeaderText: data.settings.dashboardHeaderText || EKSPOR_YUK_BRAND.dashboardHeaderText,
          dashboardBodyBg: data.settings.dashboardBodyBg || EKSPOR_YUK_BRAND.dashboardBodyBg,
          dashboardCardBg: data.settings.dashboardCardBg || EKSPOR_YUK_BRAND.dashboardCardBg,
          dashboardCardBorder: data.settings.dashboardCardBorder || EKSPOR_YUK_BRAND.dashboardCardBorder,
          dashboardCardHeaderBg: data.settings.dashboardCardHeaderBg || EKSPOR_YUK_BRAND.dashboardCardHeaderBg,
          dashboardTextPrimary: data.settings.dashboardTextPrimary || EKSPOR_YUK_BRAND.dashboardTextPrimary,
          dashboardTextSecondary: data.settings.dashboardTextSecondary || EKSPOR_YUK_BRAND.dashboardTextSecondary,
          dashboardTextMuted: data.settings.dashboardTextMuted || EKSPOR_YUK_BRAND.dashboardTextMuted,
          dashboardBorderColor: data.settings.dashboardBorderColor || EKSPOR_YUK_BRAND.dashboardBorderColor,
          dashboardSuccessColor: data.settings.dashboardSuccessColor || EKSPOR_YUK_BRAND.dashboardSuccessColor,
          dashboardWarningColor: data.settings.dashboardWarningColor || EKSPOR_YUK_BRAND.dashboardWarningColor,
          dashboardDangerColor: data.settings.dashboardDangerColor || EKSPOR_YUK_BRAND.dashboardDangerColor,
          dashboardInfoColor: data.settings.dashboardInfoColor || EKSPOR_YUK_BRAND.dashboardInfoColor,
        }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Gagal memuat pengaturan branding')
    }
    setLoading(false)
  }

  const handleLogoUpload = async (file: File, type: 'siteLogo' | 'logoAffiliate' | 'favicon') => {
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/x-icon']
    if (!validTypes.includes(file.type)) {
      toast.error('Format file harus JPG, PNG, SVG, WebP, atau ICO')
      return
    }

    setUploadingLogo(type)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/admin/settings/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setSettings(prev => ({ ...prev, [type]: data.url }))
        toast.success(`${type === 'siteLogo' ? 'Logo Utama' : type === 'logoAffiliate' ? 'Logo Affiliate' : 'Favicon'} berhasil diupload`)
      } else {
        toast.error(data.error || 'Gagal mengupload logo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Gagal mengupload logo')
    }
    
    setUploadingLogo(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Pengaturan branding berhasil disimpan!')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(data.error || 'Gagal menyimpan pengaturan branding')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan branding')
    }
    setSaving(false)
  }

  const updateSetting = (key: keyof BrandingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefault = () => {
    setSettings(prev => ({ ...prev, ...EKSPOR_YUK_BRAND }))
    toast.success('Warna direset ke default Ekspor Yuk!')
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.accentColor} 100%)` }}
              >
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Branding & Warna</h1>
                <p className="text-gray-600">Kelola warna brand dan UI di seluruh platform</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={resetToDefault}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Navigation */}
        <SettingsNav />

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-x-auto">
          <div className="flex">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-white border-b-2'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={isActive ? {
                    backgroundColor: settings.primaryColor,
                    borderBottomColor: settings.accentColor,
                  } : {}}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* TAB 1: Logo & Identitas */}
          {activeTab === 'logo' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Logo & Identitas Brand</h2>
                <p className="text-gray-600">Upload logo berbeda untuk setiap role dan atur identitas brand</p>
              </div>

              {/* Logo Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Logo Utama */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Logo Utama <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {settings.siteLogo ? (
                      <div className="space-y-3">
                        <img src={settings.siteLogo} alt="Logo Utama" className="h-20 mx-auto object-contain" />
                        <button
                          onClick={() => updateSetting('siteLogo', '')}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Hapus Logo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                        <div>
                          <label className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                              {uploadingLogo === 'siteLogo' ? 'Mengupload...' : 'Upload Logo'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingLogo === 'siteLogo'}
                              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'siteLogo')}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (max 2MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Untuk semua role kecuali affiliate</p>
                </div>

                {/* Logo Affiliate */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Logo Affiliate <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {settings.logoAffiliate ? (
                      <div className="space-y-3">
                        <img src={settings.logoAffiliate} alt="Logo Affiliate" className="h-20 mx-auto object-contain" />
                        <button
                          onClick={() => updateSetting('logoAffiliate', '')}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Hapus Logo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                        <div>
                          <label className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                              {uploadingLogo === 'logoAffiliate' ? 'Mengupload...' : 'Upload Logo'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingLogo === 'logoAffiliate'}
                              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'logoAffiliate')}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (max 2MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Khusus untuk role affiliate</p>
                </div>

                {/* Favicon */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Favicon
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {settings.favicon ? (
                      <div className="space-y-3">
                        <img src={settings.favicon} alt="Favicon" className="h-16 w-16 mx-auto object-contain" />
                        <button
                          onClick={() => updateSetting('favicon', '')}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Hapus Favicon
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <ImageIcon className="w-10 h-10 mx-auto text-gray-400" />
                        <div>
                          <label className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                              {uploadingLogo === 'favicon' ? 'Mengupload...' : 'Upload Favicon'}
                            </span>
                            <input
                              type="file"
                              accept="image/*,.ico"
                              className="hidden"
                              disabled={uploadingLogo === 'favicon'}
                              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'favicon')}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">ICO, PNG (32x32px)</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Icon di browser tab</p>
                </div>
              </div>

              {/* Brand Identity */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Identitas Brand</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Platform <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings.brandName || ''}
                      onChange={(e) => updateSetting('brandName', e.target.value)}
                      placeholder="Ekspor Yuk"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Pendek
                    </label>
                    <input
                      type="text"
                      value={settings.brandShortName || ''}
                      onChange={(e) => updateSetting('brandShortName', e.target.value)}
                      placeholder="EY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.tagline || ''}
                    onChange={(e) => updateSetting('tagline', e.target.value)}
                    placeholder="Platform Membership & Edukasi Ekspor"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Tips Logo Role-Based:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Logo Utama tampil untuk Admin, Member, Supplier</li>
                      <li>Logo Affiliate tampil khusus untuk role Affiliate</li>
                      <li>Favicon muncul di browser tab untuk semua role</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Warna & Tema */}
          {activeTab === 'warna' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Warna & Tema Global</h2>
                <p className="text-gray-600">Atur warna brand yang konsisten di seluruh platform</p>
              </div>

              {/* Brand Colors */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Warna Brand Utama</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'primaryColor', label: 'Primary Color', desc: 'Logo, header, CTA utama' },
                    { key: 'secondaryColor', label: 'Secondary Color', desc: 'Hover, secondary buttons' },
                    { key: 'accentColor', label: 'Accent Color', desc: 'Highlights, badges' },
                  ].map((color) => (
                    <div key={color.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {color.label}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="color"
                          value={settings[color.key as keyof BrandingSettings] as string}
                          onChange={(e) => updateSetting(color.key as keyof BrandingSettings, e.target.value)}
                          className="w-full h-20 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors"
                        />
                        <input
                          type="text"
                          value={settings[color.key as keyof BrandingSettings] as string}
                          onChange={(e) => updateSetting(color.key as keyof BrandingSettings, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-center"
                        />
                        <p className="text-xs text-gray-500 text-center">{color.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard Colors */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Warna Dashboard</h3>
                
                {/* Sidebar Colors */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Sidebar</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      { key: 'dashboardSidebarBg', label: 'Background' },
                      { key: 'dashboardSidebarText', label: 'Text' },
                      { key: 'dashboardSidebarActiveText', label: 'Active Text' },
                      { key: 'dashboardSidebarActiveBg', label: 'Active BG' },
                      { key: 'dashboardSidebarHoverBg', label: 'Hover BG' },
                    ].map((color) => (
                      <div key={color.key}>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          {color.label}
                        </label>
                        <input
                          type="color"
                          value={settings[color.key as keyof BrandingSettings] as string}
                          onChange={(e) => updateSetting(color.key as keyof BrandingSettings, e.target.value)}
                          className="w-full h-16 border-2 border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings[color.key as keyof BrandingSettings] as string}
                          onChange={(e) => updateSetting(color.key as keyof BrandingSettings, e.target.value)}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card & Status Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Card & Body</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'dashboardBodyBg', label: 'Body BG' },
                        { key: 'dashboardCardBg', label: 'Card BG' },
                        { key: 'dashboardCardBorder', label: 'Card Border' },
                        { key: 'dashboardCardHeaderBg', label: 'Card Header' },
                      ].map((color) => (
                        <div key={color.key}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {color.label}
                          </label>
                          <input
                            type="color"
                            value={settings[color.key as keyof BrandingSettings] as string}
                            onChange={(e) => updateSetting(color.key as keyof BrandingSettings, e.target.value)}
                            className="w-full h-12 border border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Status Colors</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'dashboardSuccessColor', label: 'Success' },
                        { key: 'dashboardWarningColor', label: 'Warning' },
                        { key: 'dashboardDangerColor', label: 'Danger' },
                        { key: 'dashboardInfoColor', label: 'Info' },
                      ].map((color) => (
                        <div key={color.key}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {color.label}
                          </label>
                          <input
                            type="color"
                            value={settings[color.key as keyof BrandingSettings] as string}
                            onChange={(e) => updateSetting(color.key as keyof BrandingSettings, e.target.value)}
                            className="w-full h-12 border border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Typography */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Typography & Teks</h2>
                <p className="text-gray-600">Atur font dan ukuran teks di seluruh platform</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <select
                    value={settings.typographyFontFamily || ''}
                    onChange={(e) => updateSetting('typographyFontFamily', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="Open Sans, sans-serif">Open Sans</option>
                    <option value="Lato, sans-serif">Lato</option>
                    <option value="Poppins, sans-serif">Poppins</option>
                    <option value="Montserrat, sans-serif">Montserrat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ukuran Heading
                  </label>
                  <select
                    value={settings.typographyHeadingSize || ''}
                    onChange={(e) => updateSetting('typographyHeadingSize', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="2rem">Small (2rem)</option>
                    <option value="2.5rem">Medium (2.5rem)</option>
                    <option value="3rem">Large (3rem)</option>
                    <option value="3.5rem">Extra Large (3.5rem)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ukuran Body Text
                  </label>
                  <select
                    value={settings.typographyBodySize || ''}
                    onChange={(e) => updateSetting('typographyBodySize', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0.875rem">Small (14px)</option>
                    <option value="1rem">Medium (16px)</option>
                    <option value="1.125rem">Large (18px)</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Typography</h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h1 
                    className="font-bold"
                    style={{
                      fontFamily: settings.typographyFontFamily || 'Inter, system-ui, sans-serif',
                      fontSize: settings.typographyHeadingSize || '2.5rem',
                    }}
                  >
                    Ini Heading H1
                  </h1>
                  <p
                    style={{
                      fontFamily: settings.typographyFontFamily || 'Inter, system-ui, sans-serif',
                      fontSize: settings.typographyBodySize || '1rem',
                    }}
                  >
                    Ini adalah contoh body text. Platform Ekspor Yuk membantu Anda belajar dan memulai bisnis ekspor dengan mudah. Bergabunglah dengan ribuan member yang sudah sukses!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Komponen UI */}
          {activeTab === 'komponen' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Komponen UI</h2>
                <p className="text-gray-600">Atur style button dan komponen lainnya</p>
              </div>

              {/* Button Styles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Styles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { bgKey: 'buttonPrimaryBg', textKey: 'buttonPrimaryText', label: 'Primary Button' },
                    { bgKey: 'buttonSecondaryBg', textKey: 'buttonSecondaryText', label: 'Secondary Button' },
                    { bgKey: 'buttonSuccessBg', textKey: 'buttonSuccessText', label: 'Success Button' },
                    { bgKey: 'buttonDangerBg', textKey: 'buttonDangerText', label: 'Danger Button' },
                  ].map((btn) => (
                    <div key={btn.bgKey} className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {btn.label}
                      </label>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Background</label>
                          <input
                            type="color"
                            value={settings[btn.bgKey as keyof BrandingSettings] as string}
                            onChange={(e) => updateSetting(btn.bgKey as keyof BrandingSettings, e.target.value)}
                            className="w-full h-12 border border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Text</label>
                          <input
                            type="color"
                            value={settings[btn.textKey as keyof BrandingSettings] as string}
                            onChange={(e) => updateSetting(btn.textKey as keyof BrandingSettings, e.target.value)}
                            className="w-full h-12 border border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                        {/* Preview */}
                        <button
                          className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor: settings[btn.bgKey as keyof BrandingSettings] as string,
                            color: settings[btn.textKey as keyof BrandingSettings] as string,
                            borderRadius: settings.buttonBorderRadius,
                          }}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Border Radius</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Border Radius
                    </label>
                    <select
                      value={settings.buttonBorderRadius}
                      onChange={(e) => updateSetting('buttonBorderRadius', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="0">None (0)</option>
                      <option value="0.25rem">Small (4px)</option>
                      <option value="0.375rem">Medium (6px)</option>
                      <option value="0.5rem">Large (8px)</option>
                      <option value="0.75rem">Extra Large (12px)</option>
                      <option value="9999px">Full Round</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <div className="bg-gray-50 rounded-lg p-4 w-full">
                      <p className="text-sm text-gray-600 mb-3">Preview Border Radius:</p>
                      <button
                        className="px-6 py-3 font-medium"
                        style={{
                          backgroundColor: settings.buttonPrimaryBg,
                          color: settings.buttonPrimaryText,
                          borderRadius: settings.buttonBorderRadius,
                        }}
                      >
                        Sample Button
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Notifikasi Realtime */}
          {activeTab === 'notifikasi' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifikasi Realtime</h2>
                <p className="text-gray-600">Status integrasi Pusher, OneSignal, dan Mailketing</p>
              </div>

              <div className="space-y-4">
                {/* Pusher */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Pusher</h3>
                      <p className="text-sm text-gray-600 mb-3">Real-time notifications di UI</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">Aktif & Terhubung</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OneSignal */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">OneSignal</h3>
                      <p className="text-sm text-gray-600 mb-3">Push notifications (browser & mobile)</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">Aktif & Terhubung</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mailketing */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Mailketing</h3>
                      <p className="text-sm text-gray-600 mb-3">Email notifications & broadcasts</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">Aktif & Terhubung</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-2">Sistem Notifikasi Terintegrasi:</p>
                    <ul className="space-y-1">
                      <li>✓ Notifikasi real-time muncul tanpa refresh halaman</li>
                      <li>✓ Badge counter update otomatis</li>
                      <li>✓ Email notification terkirim via Mailketing</li>
                      <li>✓ Push notification via OneSignal (jika user allow)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
