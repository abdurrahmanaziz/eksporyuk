'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Wallet, DollarSign, Shield, Save, Loader2, AlertCircle } from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { toast } from 'sonner'

interface WithdrawalSettings {
  withdrawalMinAmount: number
  withdrawalAdminFee: number
  withdrawalPinRequired: boolean
  withdrawalPinLength: number
}

export default function AffiliateWithdrawalSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [settings, setSettings] = useState<WithdrawalSettings>({
    withdrawalMinAmount: 50000,
    withdrawalAdminFee: 5000,
    withdrawalPinRequired: true,
    withdrawalPinLength: 6,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Check affiliate access
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && !['ADMIN', 'FOUNDER', 'CO_FOUNDER', 'AFFILIATE'].includes(session?.user?.role || '')) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Use public endpoint for fetching
        const response = await fetch('/api/settings/withdrawal')
        const data = await response.json()

        if (data.settings) {
          setSettings({
            withdrawalMinAmount: Number(data.settings.withdrawalMinAmount) || 50000,
            withdrawalAdminFee: Number(data.settings.withdrawalAdminFee) || 5000,
            withdrawalPinRequired: data.settings.withdrawalPinRequired ?? true,
            withdrawalPinLength: data.settings.withdrawalPinLength || 6,
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('Gagal memuat pengaturan')
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status])

  const handleSave = async () => {
    // Check if user is admin
    if (session?.user?.role !== 'ADMIN') {
      toast.error('Hanya admin yang dapat mengubah pengaturan penarikan dana')
      return
    }

    try {
      setSaving(true)

      const response = await fetch('/api/admin/settings/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Pengaturan berhasil disimpan!')
      } else {
        toast.error(data.error || 'Gagal menyimpan pengaturan')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Terjadi kesalahan')
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

  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-8 w-8 text-purple-600" />
            Pengaturan Penarikan Dana
          </h1>
          <p className="text-gray-600 mt-2">
            Konfigurasi sistem penarikan dana affiliate Anda
          </p>
        </div>

        {/* Info Alert for Non-Admin */}
        {!isAdmin && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                Anda melihat pengaturan penarikan dana sistem. Hanya admin yang dapat mengubah pengaturan ini.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Minimum Withdrawal Amount */}
        <Card className="shadow-lg border-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Jumlah Minimum Penarikan
            </CardTitle>
            <CardDescription>
              Minimum dana yang dapat ditarik dalam sekali transaksi
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="minAmount" className="text-base font-medium">
                  Minimum Penarikan (Rp)
                </Label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-gray-600">Rp</span>
                  <Input
                    id="minAmount"
                    type="number"
                    value={settings.withdrawalMinAmount}
                    onChange={(e) => setSettings({ ...settings, withdrawalMinAmount: Number(e.target.value) })}
                    disabled={!isAdmin}
                    className="max-w-xs"
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  Affiliate tidak dapat menarik dana kurang dari <strong>Rp {settings.withdrawalMinAmount.toLocaleString('id-ID')}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Fee */}
        <Card className="shadow-lg border-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Biaya Admin Penarikan
            </CardTitle>
            <CardDescription>
              Biaya yang dikenakan untuk setiap transaksi penarikan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="adminFee" className="text-base font-medium">
                  Biaya Admin (Rp)
                </Label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-gray-600">Rp</span>
                  <Input
                    id="adminFee"
                    type="number"
                    value={settings.withdrawalAdminFee}
                    onChange={(e) => setSettings({ ...settings, withdrawalAdminFee: Number(e.target.value) })}
                    disabled={!isAdmin}
                    className="max-w-xs"
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  Setiap penarikan akan dikenakan biaya <strong>Rp {settings.withdrawalAdminFee.toLocaleString('id-ID')}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PIN Settings */}
        <Card className="shadow-lg border-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Keamanan PIN
            </CardTitle>
            <CardDescription>
              Konfigurasi requirement PIN untuk penarikan dana
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* PIN Required Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="pinRequired" className="text-base font-medium cursor-pointer">
                  Wajibkan PIN
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Affiliate harus memasukkan PIN untuk menarik dana
                </p>
              </div>
              <Switch
                id="pinRequired"
                checked={settings.withdrawalPinRequired}
                onCheckedChange={(checked) => setSettings({ ...settings, withdrawalPinRequired: checked })}
                disabled={!isAdmin}
              />
            </div>

            {/* PIN Length */}
            {settings.withdrawalPinRequired && (
              <div>
                <Label htmlFor="pinLength" className="text-base font-medium">
                  Panjang PIN (digit)
                </Label>
                <Input
                  id="pinLength"
                  type="number"
                  min="4"
                  max="8"
                  value={settings.withdrawalPinLength}
                  onChange={(e) => setSettings({ ...settings, withdrawalPinLength: Number(e.target.value) })}
                  disabled={!isAdmin}
                  className="mt-2 max-w-xs"
                />
                <p className="text-sm text-gray-600 mt-2">
                  PIN harus {settings.withdrawalPinLength} digit angka
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        {isAdmin && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
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
