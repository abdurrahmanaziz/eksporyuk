'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Wallet, DollarSign, Shield, Settings, Save, AlertCircle } from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { toast } from 'sonner'

interface WithdrawalSettings {
  withdrawalMinAmount: number
  withdrawalAdminFee: number
  withdrawalPinRequired: boolean
  withdrawalPinLength: number
  xenditEnabled: boolean
}

export default function AdminWithdrawalSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [settings, setSettings] = useState<WithdrawalSettings>({
    withdrawalMinAmount: 50000,
    withdrawalAdminFee: 5000,
    withdrawalPinRequired: true,
    withdrawalPinLength: 6,
    xenditEnabled: true,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Check admin access
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/withdrawal')
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

    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchSettings()
    }
  }, [status, session])

  const handleSave = async () => {
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat pengaturan...</p>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Wallet className="h-8 w-8 text-blue-600" />
          Pengaturan Penarikan Dana
        </h1>
        <p className="text-gray-600 mt-2">
          Konfigurasi minimal penarikan, biaya admin, dan keamanan PIN
        </p>
      </div>

      {/* Warning Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">Perhatian!</h3>
          <p className="text-sm text-amber-800">
            Perubahan pengaturan ini akan langsung berlaku untuk semua permintaan penarikan baru. 
            Pastikan konfigurasi sudah sesuai sebelum menyimpan.
          </p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="space-y-6">
        {/* Minimum Amount */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Jumlah Minimum Penarikan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Minimal Withdrawal (Rp)</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Jumlah minimum yang dapat ditarik oleh affiliate
                </p>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={settings.withdrawalMinAmount}
                  onChange={(e) =>
                    setSettings({ ...settings, withdrawalMinAmount: parseInt(e.target.value) || 0 })
                  }
                  className="text-lg font-semibold"
                  placeholder="50000"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Rekomendasi: Rp 50.000 - Rp 100.000
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-900">Preview:</span>
                  <span className="text-xl font-bold text-blue-700">
                    Rp {settings.withdrawalMinAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Fee */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-green-600" />
              Biaya Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Admin Fee (Rp)</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Biaya admin yang dipotong dari setiap penarikan
                </p>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={settings.withdrawalAdminFee}
                  onChange={(e) =>
                    setSettings({ ...settings, withdrawalAdminFee: parseInt(e.target.value) || 0 })
                  }
                  className="text-lg font-semibold"
                  placeholder="5000"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Rekomendasi: Rp 5.000 - Rp 10.000 per transaksi
                </p>
              </div>

              {/* Example Calculation */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-green-900 mb-3">Contoh Perhitungan:</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-800">Jumlah Penarikan:</span>
                    <span className="font-semibold">Rp 100.000</span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>Biaya Admin:</span>
                    <span className="font-semibold">- Rp {settings.withdrawalAdminFee.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-px bg-green-300 my-2"></div>
                  <div className="flex justify-between text-green-900 font-bold text-base">
                    <span>Diterima Affiliate:</span>
                    <span>Rp {(100000 - settings.withdrawalAdminFee).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PIN Security */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-purple-600" />
              Keamanan PIN
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* PIN Required Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-medium">Wajib PIN untuk Penarikan</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    User harus memasukkan PIN setiap kali request penarikan
                  </p>
                </div>
                <Switch
                  checked={settings.withdrawalPinRequired}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, withdrawalPinRequired: checked })
                  }
                  className="ml-4"
                />
              </div>

              {/* PIN Length */}
              <div>
                <Label className="text-base font-medium">Panjang PIN</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Jumlah digit PIN yang harus diatur user
                </p>
                <select
                  value={settings.withdrawalPinLength}
                  onChange={(e) =>
                    setSettings({ ...settings, withdrawalPinLength: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={4}>4 Digit</option>
                  <option value={6}>6 Digit (Rekomendasi)</option>
                  <option value={8}>8 Digit</option>
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  PIN 6 digit memberikan keseimbangan antara keamanan dan kemudahan
                </p>
              </div>

              {/* Security Info */}
              {settings.withdrawalPinRequired && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Fitur Keamanan Aktif
                  </h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>✓ PIN di-hash dengan bcrypt sebelum disimpan</li>
                    <li>✓ User harus set PIN sebelum bisa withdraw</li>
                    <li>✓ PIN wajib diverifikasi setiap transaksi</li>
                    <li>✓ User bisa update PIN kapan saja</li>
                  </ul>
                </div>
              )}

              {!settings.withdrawalPinRequired && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Peringatan Keamanan
                  </h4>
                  <p className="text-sm text-amber-800">
                    Menonaktifkan PIN akan mengurangi keamanan sistem penarikan. 
                    Sangat disarankan untuk tetap aktif.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Xendit Integration */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-green-600" />
              Integrasi Xendit
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Xendit Enable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Aktifkan Penarikan Instant
                  </h4>
                  <p className="text-sm text-gray-600">
                    Memungkinkan affiliate untuk penarikan instant via Xendit (5-10 menit)
                  </p>
                </div>
                <Switch
                  checked={settings.xenditEnabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, xenditEnabled: checked })
                  }
                />
              </div>

              {/* Xendit Status Info */}
              <div className={`p-4 rounded-lg border-2 ${
                settings.xenditEnabled 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      settings.xenditEnabled ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="font-medium text-sm">
                      Status: {settings.xenditEnabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {settings.xenditEnabled 
                      ? '✅ Affiliate dapat memilih penarikan instant dengan biaya admin sama' 
                      : '⚠️ Hanya penarikan manual tersedia (1-3 hari kerja)'
                    }
                  </p>
                </div>
              </div>

              {!settings.xenditEnabled && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    💡 <strong>Info:</strong> Untuk mengaktifkan fitur instant withdrawal, 
                    pastikan environment variables Xendit sudah dikonfigurasi di server.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/settings')}
          disabled={saving}
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
    </div>
    </ResponsivePageWrapper>
  )
}
