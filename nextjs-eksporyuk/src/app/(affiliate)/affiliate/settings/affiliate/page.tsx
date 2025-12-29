'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { getRoleTheme } from '@/lib/role-themes'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Share2,
  Save,
  Loader2,
  ToggleRight,
  ToggleLeft,
  AlertCircle,
  Percent,
  Users,
  Gift,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface AffiliateSettings {
  affiliateAutoApprove: boolean
  affiliateCommissionEnabled: boolean
  defaultAffiliateCommission: number
  minWithdrawalAmount: number
}

export default function AffiliateSettingsPage() {
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

    if (status === 'authenticated' && !['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session?.user?.role || '')) {
      redirect('/dashboard')
    }

    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status, session])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings/affiliate')
      const data = await response.json()

      if (data.success && data.settings) {
        setSettings({
          affiliateAutoApprove: data.settings.affiliateAutoApprove ?? false,
          affiliateCommissionEnabled: data.settings.affiliateCommissionEnabled ?? true,
          defaultAffiliateCommission: data.settings.defaultAffiliateCommission ?? 10,
          minWithdrawalAmount: data.settings.minWithdrawalAmount ?? 50000,
        })
      } else {
        toast.error(data.error || 'Gagal memuat pengaturan')
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
      const response = await fetch('/api/admin/settings/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Pengaturan affiliate berhasil disimpan!')
        if (data.settings) {
          setSettings(data.settings)
        }
      } else {
        toast.error(data.error || 'Gagal menyimpan pengaturan')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  const isAdmin = ['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session?.user?.role || '')

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="h-8 w-8 text-purple-600" />
            Pengaturan Program Affiliate
          </h1>
          <p className="text-gray-600 mt-2">
            Konfigurasi sistem komisi dan persetujuan affiliate
          </p>
        </div>

        {/* Info Alert for Non-Admin */}
        {!isAdmin && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                Anda melihat pengaturan program affiliate sistem. Hanya admin yang dapat mengubah pengaturan ini.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commission Enabled */}
        <Card className="shadow-lg border-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5 text-purple-600" />
              Aktifkan Program Komisi
            </CardTitle>
            <CardDescription>
              Aktifkan atau nonaktifkan sistem komisi affiliate secara global
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="commissionEnabled" className="text-base font-medium cursor-pointer">
                  Status Program Komisi
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {settings.affiliateCommissionEnabled ? 'Program komisi aktif' : 'Program komisi tidak aktif'}
                </p>
              </div>
              <Switch
                id="commissionEnabled"
                checked={settings.affiliateCommissionEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, affiliateCommissionEnabled: checked })}
                disabled={!isAdmin}
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Commission */}
        {settings.affiliateCommissionEnabled && (
          <Card className="shadow-lg border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5 text-purple-600" />
                Komisi Default
              </CardTitle>
              <CardDescription>
                Persentase komisi default untuk affiliate jika tidak ada pengaturan khusus
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="defaultCommission" className="text-base font-medium">
                    Komisi Default (%)
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="defaultCommission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.defaultAffiliateCommission}
                      onChange={(e) => setSettings({ ...settings, defaultAffiliateCommission: Number(e.target.value) })}
                      disabled={!isAdmin}
                      className="max-w-xs"
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    Affiliate akan menerima komisi <strong>{settings.defaultAffiliateCommission}%</strong> dari setiap penjualan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-Approve */}
        <Card className="shadow-lg border-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Auto-Persetujuan Affiliate
            </CardTitle>
            <CardDescription>
              Otomatis setujui pendaftar baru sebagai affiliate
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="autoApprove" className="text-base font-medium cursor-pointer">
                  {settings.affiliateAutoApprove ? 'Auto-Persetujuan Aktif' : 'Persetujuan Manual'}
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {settings.affiliateAutoApprove
                    ? 'Pendaftar otomatis menjadi affiliate'
                    : 'Admin harus menyetujui setiap pendaftar'}
                </p>
              </div>
              <Switch
                id="autoApprove"
                checked={settings.affiliateAutoApprove}
                onCheckedChange={(checked) => setSettings({ ...settings, affiliateAutoApprove: checked })}
                disabled={!isAdmin}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="shadow-lg border-amber-100 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              Catatan Penting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900">
            <p>
              • Pengaturan ini berlaku global untuk seluruh affiliate platform
            </p>
            <p>
              • Komisi individual dapat dikonfigurasi per produk atau membership
            </p>
            <p>
              • Perubahan pengaturan akan langsung berlaku untuk transaksi baru
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        {isAdmin && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => redirect('/affiliate/settings')}
              className="border-gray-300"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Pengaturan
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
