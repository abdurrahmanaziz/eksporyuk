'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { getRoleTheme } from '@/lib/role-themes'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import SettingsNav from '@/components/admin/SettingsNav'
import {
  Settings as SettingsIcon,
  Upload,
  Palette,
  Globe,
  Mail,
  MessageSquare,
  Save,
  CheckCircle,
  Image as ImageIcon,
  FileText,
  Code,
  Monitor,
  Languages,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SettingsData {
  id: number
  // Website General Settings
  siteTitle: string
  siteDescription: string
  siteLogo: string
  siteFavicon: string
  primaryColor: string
  secondaryColor: string
  // Button Colors
  buttonPrimaryBg: string
  buttonPrimaryText: string
  buttonSecondaryBg: string
  buttonSecondaryText: string
  buttonSuccessBg: string
  buttonSuccessText: string
  buttonDangerBg: string
  buttonDangerText: string
  buttonBorderRadius: string
  headerText: string
  footerText: string
  contactEmail: string
  contactPhone: string
  whatsappNumber: string
  instagramUrl: string
  facebookUrl: string
  linkedinUrl: string
  customCss: string
  customJs: string
  maintenanceMode: boolean
  defaultLanguage: string
  bannerImage: string
  // Email Footer Settings
  emailFooterCompanyName: string
  emailFooterDescription: string
  emailFooterAddress: string
  emailFooterSupportEmail: string
  emailFooterWebsiteUrl: string
  emailFooterInstagramUrl: string
  emailFooterFacebookUrl: string
  emailFooterLinkedinUrl: string
  emailFooterCopyrightText: string
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SettingsData>({
    id: 1,
    siteTitle: 'Eksporyuk',
    siteDescription: 'Platform Ekspor Indonesia',
    siteLogo: '',
    siteFavicon: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    // Button Colors
    buttonPrimaryBg: '#3B82F6',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBg: '#6B7280',
    buttonSecondaryText: '#FFFFFF',
    buttonSuccessBg: '#10B981',
    buttonSuccessText: '#FFFFFF',
    buttonDangerBg: '#EF4444',
    buttonDangerText: '#FFFFFF',
    buttonBorderRadius: '0.5rem',
    headerText: '',
    footerText: '',
    contactEmail: '',
    contactPhone: '',
    whatsappNumber: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    customCss: '',
    customJs: '',
    maintenanceMode: false,
    defaultLanguage: 'id',
    bannerImage: '',
    // Email Footer Settings
    emailFooterCompanyName: 'EksporYuk',
    emailFooterDescription: 'Platform Edukasi & Mentoring Ekspor Terpercaya',
    emailFooterAddress: 'Jakarta, Indonesia',
    emailFooterSupportEmail: 'support@eksporyuk.com',
    emailFooterWebsiteUrl: 'https://eksporyuk.com',
    emailFooterInstagramUrl: '',
    emailFooterFacebookUrl: '',
    emailFooterLinkedinUrl: '',
    emailFooterCopyrightText: 'EksporYuk. All rights reserved.',
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
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success && data.settings) {
        // Ensure all string fields have proper default values
        const sanitizedSettings = {
          ...data.settings,
          siteTitle: data.settings.siteTitle || '',
          siteDescription: data.settings.siteDescription || '',
          siteLogo: data.settings.siteLogo || '',
          siteFavicon: data.settings.siteFavicon || '',
          primaryColor: data.settings.primaryColor || '#3B82F6',
          secondaryColor: data.settings.secondaryColor || '#1F2937',
          // Button Colors
          buttonPrimaryBg: data.settings.buttonPrimaryBg || '#3B82F6',
          buttonPrimaryText: data.settings.buttonPrimaryText || '#FFFFFF',
          buttonSecondaryBg: data.settings.buttonSecondaryBg || '#6B7280',
          buttonSecondaryText: data.settings.buttonSecondaryText || '#FFFFFF',
          buttonSuccessBg: data.settings.buttonSuccessBg || '#10B981',
          buttonSuccessText: data.settings.buttonSuccessText || '#FFFFFF',
          buttonDangerBg: data.settings.buttonDangerBg || '#EF4444',
          buttonDangerText: data.settings.buttonDangerText || '#FFFFFF',
          buttonBorderRadius: data.settings.buttonBorderRadius || '0.5rem',
          headerText: data.settings.headerText || '',
          footerText: data.settings.footerText || '',
          contactEmail: data.settings.contactEmail || '',
          contactPhone: data.settings.contactPhone || '',
          whatsappNumber: data.settings.whatsappNumber || '',
          instagramUrl: data.settings.instagramUrl || '',
          facebookUrl: data.settings.facebookUrl || '',
          linkedinUrl: data.settings.linkedinUrl || '',
          customCss: data.settings.customCss || '',
          customJs: data.settings.customJs || '',
          defaultLanguage: data.settings.defaultLanguage || 'id',
          bannerImage: data.settings.bannerImage || '',
          maintenanceMode: data.settings.maintenanceMode || false,
          // Email Footer Settings
          emailFooterCompanyName: data.settings.emailFooterCompanyName || 'EksporYuk',
          emailFooterDescription: data.settings.emailFooterDescription || 'Platform Edukasi & Mentoring Ekspor Terpercaya',
          emailFooterAddress: data.settings.emailFooterAddress || 'Jakarta, Indonesia',
          emailFooterSupportEmail: data.settings.emailFooterSupportEmail || 'support@eksporyuk.com',
          emailFooterWebsiteUrl: data.settings.emailFooterWebsiteUrl || 'https://eksporyuk.com',
          emailFooterInstagramUrl: data.settings.emailFooterInstagramUrl || '',
          emailFooterFacebookUrl: data.settings.emailFooterFacebookUrl || '',
          emailFooterLinkedinUrl: data.settings.emailFooterLinkedinUrl || '',
          emailFooterCopyrightText: data.settings.emailFooterCopyrightText || 'EksporYuk. All rights reserved.',
        }
        setSettings(sanitizedSettings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Gagal memuat pengaturan')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Pengaturan berhasil disimpan!')
      } else {
        toast.error(data.error || 'Gagal menyimpan pengaturan')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan')
    }
    setSaving(false)
  }

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleFileUpload = async (file: File, field: 'siteLogo' | 'siteFavicon' | 'bannerImage') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'image')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        updateSetting(field, data.url)
        toast.success('File berhasil diupload!')
      } else {
        toast.error('Gagal upload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Gagal upload file')
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pengaturan Website</h1>
        <p className="text-gray-600">Konfigurasi tampilan dan informasi umum website</p>
      </div>

      {/* Settings Navigation */}
      <SettingsNav />

      {/* Settings Sections */}
      <div className="max-w-4xl space-y-6">

        {/* Site Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="px-6 py-4 border-b border-gray-200"
            style={{ backgroundColor: `${theme.primary}10` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.primary }}
              >
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Informasi Website</h2>
                <p className="text-sm text-gray-600">Judul, deskripsi, dan informasi dasar website</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Website
                </label>
                <input
                  type="text"
                  value={settings.siteTitle}
                  onChange={(e) => updateSetting('siteTitle', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan judul website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bahasa Default
                </label>
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => updateSetting('defaultLanguage', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Website
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => updateSetting('siteDescription', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Masukkan deskripsi website"
              />
            </div>
          </div>
        </div>

        {/* Branding & Assets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="px-6 py-4 border-b border-gray-200"
            style={{ backgroundColor: `${theme.secondary}10` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.secondary }}
              >
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Branding & Assets</h2>
                <p className="text-sm text-gray-600">Logo, favicon, dan gambar website</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Logo Website
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gray-400 transition-colors">
                  {settings.siteLogo ? (
                    <div className="space-y-3">
                      <img src={settings.siteLogo} alt="Logo" className="max-w-full h-20 object-contain mx-auto" />
                      <button
                        onClick={() => updateSetting('siteLogo', '')}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <div>
                        <label className="cursor-pointer text-blue-500 hover:text-blue-700">
                          <span className="text-sm">Upload Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'siteLogo')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Favicon
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gray-400 transition-colors">
                  {settings.siteFavicon ? (
                    <div className="space-y-3">
                      <img src={settings.siteFavicon} alt="Favicon" className="w-16 h-16 object-contain mx-auto" />
                      <button
                        onClick={() => updateSetting('siteFavicon', '')}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <div>
                        <label className="cursor-pointer text-blue-500 hover:text-blue-700">
                          <span className="text-sm">Upload Favicon</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'siteFavicon')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Banner Website
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gray-400 transition-colors">
                  {settings.bannerImage ? (
                    <div className="space-y-3">
                      <img src={settings.bannerImage} alt="Banner" className="max-w-full h-20 object-cover mx-auto rounded" />
                      <button
                        onClick={() => updateSetting('bannerImage', '')}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <div>
                        <label className="cursor-pointer text-blue-500 hover:text-blue-700">
                          <span className="text-sm">Upload Banner</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'bannerImage')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Quick Link */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border-2 border-blue-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                <Palette className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Pengaturan Warna & Branding</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Kelola warna brand, tema, dan tampilan tombol di halaman khusus dengan live preview
                </p>
                <a
                  href="/admin/settings/branding"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  <Palette className="w-5 h-5" />
                  Buka Pengaturan Branding
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Header & Footer */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="px-6 py-4 border-b border-gray-200"
            style={{ backgroundColor: `${theme.secondary}10` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.secondary }}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Header & Footer</h2>
                <p className="text-sm text-gray-600">Teks header dan footer website</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teks Header
              </label>
              <input
                type="text"
                value={settings.headerText}
                onChange={(e) => updateSetting('headerText', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan teks header"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teks Footer
              </label>
              <textarea
                value={settings.footerText}
                onChange={(e) => updateSetting('footerText', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Masukkan teks footer / copyright"
              />
            </div>
          </div>
        </div>

        {/* Contact & Social Media */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="px-6 py-4 border-b border-gray-200"
            style={{ backgroundColor: `${theme.primary}10` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.primary }}
              >
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Kontak & Sosial Media</h2>
                <p className="text-sm text-gray-600">Informasi kontak dan link sosial media</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Kontak
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => updateSetting('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@eksporyuk.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => updateSetting('contactPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+62 812-3456-7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={settings.whatsappNumber}
                  onChange={(e) => updateSetting('whatsappNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+62 812-3456-7890"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Sosial Media
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                  <input
                    type="url"
                    value={settings.instagramUrl}
                    onChange={(e) => updateSetting('instagramUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={settings.facebookUrl}
                    onChange={(e) => updateSetting('facebookUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={settings.linkedinUrl}
                    onChange={(e) => updateSetting('linkedinUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://linkedin.com/..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Footer Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="px-6 py-4 border-b border-gray-200"
            style={{ backgroundColor: `${theme.primary}10` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.primary }}
              >
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Email Footer Settings</h2>
                <p className="text-sm text-gray-600">Konfigurasi footer untuk broadcast email</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={settings.emailFooterCompanyName}
                  onChange={(e) => updateSetting('emailFooterCompanyName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="EksporYuk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <input
                  type="text"
                  value={settings.emailFooterAddress}
                  onChange={(e) => updateSetting('emailFooterAddress', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jakarta, Indonesia"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Singkat
              </label>
              <input
                type="text"
                value={settings.emailFooterDescription}
                onChange={(e) => updateSetting('emailFooterDescription', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Platform Edukasi & Mentoring Ekspor Terpercaya"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Support
                </label>
                <input
                  type="email"
                  value={settings.emailFooterSupportEmail}
                  onChange={(e) => updateSetting('emailFooterSupportEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="support@eksporyuk.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={settings.emailFooterWebsiteUrl}
                  onChange={(e) => updateSetting('emailFooterWebsiteUrl', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://eksporyuk.com"
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Link Sosial Media (untuk footer email)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                  <input
                    type="url"
                    value={settings.emailFooterInstagramUrl}
                    onChange={(e) => updateSetting('emailFooterInstagramUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://instagram.com/eksporyuk"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={settings.emailFooterFacebookUrl}
                    onChange={(e) => updateSetting('emailFooterFacebookUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://facebook.com/eksporyuk"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={settings.emailFooterLinkedinUrl}
                    onChange={(e) => updateSetting('emailFooterLinkedinUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://linkedin.com/company/eksporyuk"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Copyright Text
              </label>
              <input
                type="text"
                value={settings.emailFooterCopyrightText}
                onChange={(e) => updateSetting('emailFooterCopyrightText', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="EksporYuk. All rights reserved."
              />
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-3">Preview Footer Email:</p>
              <div className="bg-white rounded border border-gray-300 p-6 text-center text-xs text-gray-600 space-y-2">
                <p className="font-semibold text-gray-800">{settings.emailFooterCompanyName}</p>
                <p>{settings.emailFooterDescription}</p>
                <p>{settings.emailFooterAddress} | {settings.emailFooterSupportEmail}</p>
                <div className="flex justify-center gap-4 mt-3">
                  {settings.emailFooterWebsiteUrl && <a href="#" className="text-blue-600 hover:underline">Website</a>}
                  {settings.emailFooterInstagramUrl && <a href="#" className="text-blue-600 hover:underline">Instagram</a>}
                  {settings.emailFooterFacebookUrl && <a href="#" className="text-blue-600 hover:underline">Facebook</a>}
                  {settings.emailFooterLinkedinUrl && <a href="#" className="text-blue-600 hover:underline">LinkedIn</a>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <a href="#" className="text-gray-500 hover:text-gray-700 underline text-xs">
                    Unsubscribe dari email ini
                  </a>
                </div>
                <p className="text-gray-400 mt-2">© {new Date().getFullYear()} {settings.emailFooterCopyrightText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Code */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="px-6 py-4 border-b border-gray-200"
            style={{ backgroundColor: `${theme.secondary}10` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.secondary }}
              >
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Custom Code</h2>
                <p className="text-sm text-gray-600">CSS dan JavaScript kustom</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom CSS
              </label>
              <textarea
                value={settings.customCss}
                onChange={(e) => updateSetting('customCss', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                placeholder="/* Custom CSS */"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom JavaScript
              </label>
              <textarea
                value={settings.customJs}
                onChange={(e) => updateSetting('customJs', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                placeholder="// Custom JavaScript"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="px-6 py-4 border-b border-gray-200"
            style={{ backgroundColor: `${theme.primary}10` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.primary }}
              >
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Mode Maintenance</h2>
                <p className="text-sm text-gray-600">Aktifkan mode maintenance untuk website</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">Aktifkan Mode Maintenance</p>
                <p className="text-sm text-gray-600">Website hanya bisa diakses oleh admin saat mode aktif</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={fetchSettings}
            disabled={saving}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Simpan Pengaturan
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Informasi Penting</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Pengaturan akan berlaku untuk seluruh website</li>
              <li>Perubahan warna memerlukan refresh halaman untuk terlihat</li>
              <li>Mode maintenance akan menampilkan halaman khusus untuk user biasa</li>
              <li>Custom CSS/JS akan dimuat di semua halaman</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
