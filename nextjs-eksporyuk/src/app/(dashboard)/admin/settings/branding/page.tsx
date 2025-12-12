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
  Eye,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface BrandingSettings {
  id: number
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
  // Dashboard Theme Colors
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
  // Dashboard Theme Colors - Default
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

export default function AdminBrandingSettings() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<BrandingSettings>({
    id: 1,
    ...EKSPOR_YUK_BRAND,
  })
  const [showPreview, setShowPreview] = useState(true)

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
        setSettings({
          id: data.settings.id || 1,
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
          // Dashboard Theme Colors
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
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Gagal memuat pengaturan branding')
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
        toast.success('Pengaturan branding berhasil disimpan!')
        // Auto-refresh to apply changes
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
    setSettings({ id: settings.id, ...EKSPOR_YUK_BRAND })
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
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
        </div>

        {/* Settings Navigation */}
        <SettingsNav />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Brand Colors */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-200"
                style={{ backgroundColor: `${settings.primaryColor}10` }}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5" style={{ color: settings.primaryColor }} />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Warna Brand Utama</h2>
                    <p className="text-sm text-gray-600">Warna identitas Ekspor Yuk</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="space-y-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="w-full h-20 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-center"
                        placeholder="#0066CC"
                      />
                      <p className="text-xs text-gray-500 text-center">Logo, header, CTA utama</p>
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="space-y-2">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                        className="w-full h-20 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors"
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-center"
                        placeholder="#0052CC"
                      />
                      <p className="text-xs text-gray-500 text-center">Hover, secondary buttons</p>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accent Color
                    </label>
                    <div className="space-y-2">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="w-full h-20 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors"
                      />
                      <input
                        type="text"
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-center"
                        placeholder="#3399FF"
                      />
                      <p className="text-xs text-gray-500 text-center">Highlights, badges</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Button Styles */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-200"
                style={{ backgroundColor: `${settings.secondaryColor}10` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Warna Tombol</h2>
                    <p className="text-sm text-gray-600">Konfigurasi warna untuk semua tombol</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Primary Button */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Primary Button</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Background</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.buttonPrimaryBg}
                          onChange={(e) => updateSetting('buttonPrimaryBg', e.target.value)}
                          className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.buttonPrimaryBg}
                          onChange={(e) => updateSetting('buttonPrimaryBg', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Text</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.buttonPrimaryText}
                          onChange={(e) => updateSetting('buttonPrimaryText', e.target.value)}
                          className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.buttonPrimaryText}
                          onChange={(e) => updateSetting('buttonPrimaryText', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Button */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Secondary Button</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Background</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.buttonSecondaryBg}
                          onChange={(e) => updateSetting('buttonSecondaryBg', e.target.value)}
                          className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.buttonSecondaryBg}
                          onChange={(e) => updateSetting('buttonSecondaryBg', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Text</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.buttonSecondaryText}
                          onChange={(e) => updateSetting('buttonSecondaryText', e.target.value)}
                          className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.buttonSecondaryText}
                          onChange={(e) => updateSetting('buttonSecondaryText', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success & Danger */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700">Success Button</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.buttonSuccessBg}
                          onChange={(e) => updateSetting('buttonSuccessBg', e.target.value)}
                          className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.buttonSuccessBg}
                          onChange={(e) => updateSetting('buttonSuccessBg', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700">Danger Button</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.buttonDangerBg}
                          onChange={(e) => updateSetting('buttonDangerBg', e.target.value)}
                          className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.buttonDangerBg}
                          onChange={(e) => updateSetting('buttonDangerBg', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Border Radius Tombol
                  </label>
                  <select
                    value={settings.buttonBorderRadius}
                    onChange={(e) => updateSetting('buttonBorderRadius', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0">Square (0)</option>
                    <option value="0.25rem">Slight (0.25rem)</option>
                    <option value="0.375rem">Small (0.375rem)</option>
                    <option value="0.5rem">Medium (0.5rem)</option>
                    <option value="0.75rem">Large (0.75rem)</option>
                    <option value="1rem">Extra Large (1rem)</option>
                    <option value="9999px">Pill (rounded full)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dashboard Theme Colors */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-200"
                style={{ backgroundColor: `${settings.dashboardSidebarBg}15` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.dashboardSidebarBg }}>
                    <svg className="w-4 h-4" style={{ color: settings.dashboardSidebarText }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Warna Dashboard</h2>
                    <p className="text-sm text-gray-600">Kustomisasi tampilan panel admin</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Sidebar Colors */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Sidebar
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Background</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardSidebarBg}
                          onChange={(e) => updateSetting('dashboardSidebarBg', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardSidebarBg}
                          onChange={(e) => updateSetting('dashboardSidebarBg', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Text</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardSidebarText}
                          onChange={(e) => updateSetting('dashboardSidebarText', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardSidebarText}
                          onChange={(e) => updateSetting('dashboardSidebarText', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Active BG</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardSidebarActiveBg}
                          onChange={(e) => updateSetting('dashboardSidebarActiveBg', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardSidebarActiveBg}
                          onChange={(e) => updateSetting('dashboardSidebarActiveBg', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Active Text</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardSidebarActiveText}
                          onChange={(e) => updateSetting('dashboardSidebarActiveText', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardSidebarActiveText}
                          onChange={(e) => updateSetting('dashboardSidebarActiveText', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Hover BG</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardSidebarHoverBg}
                          onChange={(e) => updateSetting('dashboardSidebarHoverBg', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardSidebarHoverBg}
                          onChange={(e) => updateSetting('dashboardSidebarHoverBg', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body & Card Colors */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Body & Card
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Body BG</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardBodyBg}
                          onChange={(e) => updateSetting('dashboardBodyBg', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardBodyBg}
                          onChange={(e) => updateSetting('dashboardBodyBg', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Card BG</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardCardBg}
                          onChange={(e) => updateSetting('dashboardCardBg', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardCardBg}
                          onChange={(e) => updateSetting('dashboardCardBg', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Card Border</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardCardBorder}
                          onChange={(e) => updateSetting('dashboardCardBorder', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardCardBorder}
                          onChange={(e) => updateSetting('dashboardCardBorder', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Header BG</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardHeaderBg}
                          onChange={(e) => updateSetting('dashboardHeaderBg', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardHeaderBg}
                          onChange={(e) => updateSetting('dashboardHeaderBg', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Colors */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                    </svg>
                    Warna Teks
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Primary</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={settings.dashboardTextPrimary}
                          onChange={(e) => updateSetting('dashboardTextPrimary', e.target.value)}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardTextPrimary}
                          onChange={(e) => updateSetting('dashboardTextPrimary', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded font-mono text-[10px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Secondary</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={settings.dashboardTextSecondary}
                          onChange={(e) => updateSetting('dashboardTextSecondary', e.target.value)}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardTextSecondary}
                          onChange={(e) => updateSetting('dashboardTextSecondary', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded font-mono text-[10px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Muted</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={settings.dashboardTextMuted}
                          onChange={(e) => updateSetting('dashboardTextMuted', e.target.value)}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardTextMuted}
                          onChange={(e) => updateSetting('dashboardTextMuted', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded font-mono text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Colors */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Warna Status
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Success</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardSuccessColor}
                          onChange={(e) => updateSetting('dashboardSuccessColor', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardSuccessColor}
                          onChange={(e) => updateSetting('dashboardSuccessColor', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Warning</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardWarningColor}
                          onChange={(e) => updateSetting('dashboardWarningColor', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardWarningColor}
                          onChange={(e) => updateSetting('dashboardWarningColor', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Danger</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardDangerColor}
                          onChange={(e) => updateSetting('dashboardDangerColor', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardDangerColor}
                          onChange={(e) => updateSetting('dashboardDangerColor', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Info</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.dashboardInfoColor}
                          onChange={(e) => updateSetting('dashboardInfoColor', e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.dashboardInfoColor}
                          onChange={(e) => updateSetting('dashboardInfoColor', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Preview Mini */}
                <div className="mt-4 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Preview Dashboard</p>
                  <div className="flex rounded-lg overflow-hidden border" style={{ height: '80px' }}>
                    {/* Mini Sidebar */}
                    <div className="w-12" style={{ backgroundColor: settings.dashboardSidebarBg }}>
                      <div className="mt-2 mx-1.5 p-1 rounded" style={{ backgroundColor: settings.dashboardSidebarActiveBg }}>
                        <div className="w-full h-1.5 rounded" style={{ backgroundColor: settings.dashboardSidebarActiveText }}></div>
                      </div>
                      <div className="mt-1.5 mx-1.5 p-1">
                        <div className="w-full h-1.5 rounded" style={{ backgroundColor: settings.dashboardSidebarText, opacity: 0.5 }}></div>
                      </div>
                      <div className="mt-1.5 mx-1.5 p-1">
                        <div className="w-full h-1.5 rounded" style={{ backgroundColor: settings.dashboardSidebarText, opacity: 0.5 }}></div>
                      </div>
                    </div>
                    {/* Mini Content */}
                    <div className="flex-1" style={{ backgroundColor: settings.dashboardBodyBg }}>
                      <div className="h-4 border-b" style={{ backgroundColor: settings.dashboardHeaderBg, borderColor: settings.dashboardBorderColor }}></div>
                      <div className="p-1.5 grid grid-cols-3 gap-1">
                        <div className="h-8 rounded" style={{ backgroundColor: settings.dashboardCardBg, border: `1px solid ${settings.dashboardCardBorder}` }}></div>
                        <div className="h-8 rounded" style={{ backgroundColor: settings.dashboardCardBg, border: `1px solid ${settings.dashboardCardBorder}` }}></div>
                        <div className="h-8 rounded" style={{ backgroundColor: settings.dashboardCardBg, border: `1px solid ${settings.dashboardCardBorder}` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Live Preview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div
                  className="px-4 py-3 border-b border-gray-200 flex items-center justify-between"
                  style={{ backgroundColor: `${settings.primaryColor}10` }}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" style={{ color: settings.primaryColor }} />
                    <h3 className="font-semibold text-gray-900">Live Preview</h3>
                  </div>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showPreview ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showPreview && (
                  <div className="p-6 space-y-4">
                    {/* Brand Colors Preview */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Brand Colors</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <div
                            className="h-12 rounded-lg border border-gray-200"
                            style={{ backgroundColor: settings.primaryColor }}
                          ></div>
                          <p className="text-xs text-gray-500 text-center">Primary</p>
                        </div>
                        <div className="space-y-1">
                          <div
                            className="h-12 rounded-lg border border-gray-200"
                            style={{ backgroundColor: settings.secondaryColor }}
                          ></div>
                          <p className="text-xs text-gray-500 text-center">Secondary</p>
                        </div>
                        <div className="space-y-1">
                          <div
                            className="h-12 rounded-lg border border-gray-200"
                            style={{ backgroundColor: settings.accentColor }}
                          ></div>
                          <p className="text-xs text-gray-500 text-center">Accent</p>
                        </div>
                      </div>
                    </div>

                    {/* Buttons Preview */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-3">Buttons</p>
                      <div className="space-y-2">
                        <button
                          style={{
                            backgroundColor: settings.buttonPrimaryBg,
                            color: settings.buttonPrimaryText,
                            borderRadius: settings.buttonBorderRadius,
                          }}
                          className="w-full px-4 py-2 font-medium text-sm transition-opacity hover:opacity-90"
                        >
                          Primary Button
                        </button>
                        <button
                          style={{
                            backgroundColor: settings.buttonSecondaryBg,
                            color: settings.buttonSecondaryText,
                            borderRadius: settings.buttonBorderRadius,
                          }}
                          className="w-full px-4 py-2 font-medium text-sm transition-opacity hover:opacity-90"
                        >
                          Secondary Button
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            style={{
                              backgroundColor: settings.buttonSuccessBg,
                              color: settings.buttonSuccessText,
                              borderRadius: settings.buttonBorderRadius,
                            }}
                            className="px-3 py-2 font-medium text-xs transition-opacity hover:opacity-90"
                          >
                            Success
                          </button>
                          <button
                            style={{
                              backgroundColor: settings.buttonDangerBg,
                              color: settings.buttonDangerText,
                              borderRadius: settings.buttonBorderRadius,
                            }}
                            className="px-3 py-2 font-medium text-xs transition-opacity hover:opacity-90"
                          >
                            Danger
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Gradient Preview */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Gradient Sample</p>
                      <div
                        className="h-20 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.accentColor} 100%)`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  style={{
                    background: saving ? undefined : `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.accentColor} 100%)`,
                  }}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan Perubahan
                    </>
                  )}
                </button>

                <button
                  onClick={resetToDefault}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset ke Default
                </button>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Informasi</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Perubahan akan diterapkan di seluruh platform</li>
                      <li>• Halaman akan refresh otomatis setelah save</li>
                      <li>• Default warna Ekspor Yuk: #0066CC</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
