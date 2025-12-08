'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { getRoleTheme } from '@/lib/role-themes'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Share2,
  Save,
  CheckCircle,
  Loader2,
  Settings,
  UserCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AffiliateSettings {
  affiliateAutoApprove: boolean
  affiliateCommissionEnabled: boolean
  defaultAffiliateCommission: number
  minWithdrawalAmount: number
}

export default function AdminAffiliateSettingsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<AffiliateSettings>({
    affiliateAutoApprove: false,
    affiliateCommissionEnabled: true,
    defaultAffiliateCommission: 10,
    minWithdrawalAmount: 50000,
  })

  const theme = getRoleTheme(session?.user?.role || 'ADMIN')

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      redirect('/dashboard')
    }

    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status, session])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success && data.settings) {
        setSettings({
          affiliateAutoApprove: data.settings.affiliateAutoApprove ?? false,
          affiliateCommissionEnabled: data.settings.affiliateCommissionEnabled ?? true,
          defaultAffiliateCommission: data.settings.defaultAffiliateCommission ?? 10,
          minWithdrawalAmount: data.settings.minWithdrawalAmount ?? 50000,
        })
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
        toast.success('Pengaturan affiliate berhasil disimpan!')
      } else {
        toast.error(data.error || 'Gagal menyimpan pengaturan')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
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
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pengaturan Affiliate</h1>
            <p className="text-gray-600">Konfigurasi sistem affiliate dan pendaftaran</p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-3xl space-y-6">

        {/* Auto Approve Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500 text-white">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Auto Approve Affiliate</h2>
                <p className="text-sm text-gray-600">Pengaturan persetujuan otomatis affiliate baru</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Auto Approve Pendaftaran Affiliate</p>
                <p className="text-sm text-gray-600 mt-1">
                  Jika diaktifkan, affiliate baru akan langsung disetujui tanpa perlu review admin. 
                  Jika dinonaktifkan, affiliate akan berstatus PENDING dan menunggu approval admin.
                </p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, affiliateAutoApprove: !prev.affiliateAutoApprove }))}
                className="ml-4 flex-shrink-0"
              >
                {settings.affiliateAutoApprove ? (
                  <ToggleRight className="w-12 h-12 text-green-500" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-gray-400" />
                )}
              </button>
            </div>

            {/* Status Indicator */}
            <div className={`mt-4 p-4 rounded-lg ${settings.affiliateAutoApprove ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${settings.affiliateAutoApprove ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`font-medium ${settings.affiliateAutoApprove ? 'text-green-800' : 'text-yellow-800'}`}>
                  {settings.affiliateAutoApprove ? 'Auto Approve AKTIF' : 'Auto Approve NONAKTIF (Perlu Review Admin)'}
                </span>
              </div>
              <p className={`mt-2 text-sm ${settings.affiliateAutoApprove ? 'text-green-700' : 'text-yellow-700'}`}>
                {settings.affiliateAutoApprove 
                  ? 'Semua pendaftaran affiliate akan langsung disetujui dan dapat mulai berpromosi.'
                  : 'Pendaftaran affiliate akan masuk ke daftar pending dan admin harus menyetujui secara manual.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500 text-white">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pengaturan Komisi</h2>
                <p className="text-sm text-gray-600">Konfigurasi komisi affiliate</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Enable Commission */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Aktifkan Sistem Komisi</p>
                <p className="text-sm text-gray-600 mt-1">
                  Jika dinonaktifkan, affiliate tidak akan mendapat komisi dari penjualan.
                </p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, affiliateCommissionEnabled: !prev.affiliateCommissionEnabled }))}
                className="ml-4 flex-shrink-0"
              >
                {settings.affiliateCommissionEnabled ? (
                  <ToggleRight className="w-12 h-12 text-green-500" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-gray-400" />
                )}
              </button>
            </div>

            {/* Default Commission Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Komisi Default (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.defaultAffiliateCommission}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultAffiliateCommission: parseInt(e.target.value) || 0 }))}
                  className="w-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Persentase komisi default untuk affiliate baru. Dapat diubah per-affiliate di halaman detail.
              </p>
            </div>

            {/* Min Withdrawal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Withdrawal
              </label>
              <div className="flex items-center gap-3">
                <span className="text-gray-500">Rp</span>
                <input
                  type="number"
                  min={0}
                  value={settings.minWithdrawalAmount}
                  onChange={(e) => setSettings(prev => ({ ...prev, minWithdrawalAmount: parseInt(e.target.value) || 0 }))}
                  className="w-48 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Saldo minimum yang diperlukan sebelum affiliate dapat menarik dana.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Informasi</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li><strong>Auto Approve ON:</strong> Affiliate baru langsung aktif dan dapat promosi</li>
              <li><strong>Auto Approve OFF:</strong> Affiliate baru perlu direview admin di menu Affiliates → Pending</li>
              <li>Affiliate yang sudah disetujui tidak terpengaruh perubahan setting ini</li>
            </ul>
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
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
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
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
