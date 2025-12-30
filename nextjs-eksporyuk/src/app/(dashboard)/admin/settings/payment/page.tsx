'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, CreditCard, Building2, Wallet, DollarSign, Settings2, Image, Check, User, Phone } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface BankAccount {
  id: string
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
  branch?: string
  isActive: boolean
  logo?: string
  customLogoUrl?: string
  order: number
}

interface PaymentChannel {
  code: string
  name: string
  type: 'bank_transfer' | 'ewallet' | 'qris' | 'retail' | 'paylater' | 'cardless_credit'
  icon: string
  isActive: boolean
  fee?: number
  description?: string
  logo?: string
  customLogoUrl?: string
}

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null)
  
  // Helper function to get logo URL based on payment channel
  const getLogoUrl = (code: string) => {
    // Using local SVG assets
    const baseUrl = '/images/payment-logos'
    
    const logos: { [key: string]: string } = {
      // Banks
      'BCA': `${baseUrl}/bca.svg`,
      'MANDIRI': `${baseUrl}/mandiri.svg`,
      'BNI': `${baseUrl}/bni.svg`,
      'BRI': `${baseUrl}/bri.svg`,
      'BSI': `${baseUrl}/bsi.svg`,
      'CIMB': `${baseUrl}/cimb.svg`,
      'PERMATA': `${baseUrl}/permata.svg`,
      'JAGO': `${baseUrl}/jago.svg`,
      'SAHABAT_SAMPOERNA': `${baseUrl}/sahabat-sampoerna.svg`,
      
      // E-Wallets
      'OVO': `${baseUrl}/ovo.svg`,
      'DANA': `${baseUrl}/dana.svg`,
      'GOPAY': `${baseUrl}/gopay.svg`,
      'LINKAJA': `${baseUrl}/linkaja.svg`,
      'SHOPEEPAY': `${baseUrl}/shopeepay.svg`,
      'ASTRAPAY': `${baseUrl}/astrapay.svg`,
      'JENIUSPAY': `${baseUrl}/jeniuspay.svg`,
      
      // QRIS
      'QRIS': `${baseUrl}/qris.svg`,
      
      // Retail
      'ALFAMART': `${baseUrl}/alfamart.svg`,
      'INDOMARET': `${baseUrl}/indomaret.svg`,
      
      // PayLater / Cardless Credit
      'KREDIVO': `${baseUrl}/kredivo.svg`,
      'AKULAKU': `${baseUrl}/akulaku.svg`,
    }
    
    return logos[code] || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%230066CC'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='white' font-family='Arial'%3E${code.substring(0, 3)}%3C/text%3E%3C/svg%3E`
  }
  
  // Manual Bank Accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [bankDialogOpen, setBankDialogOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null)
  
  // Xendit Channels
  const [xenditChannels, setXenditChannels] = useState<PaymentChannel[]>([
    // Virtual Account (Bank Transfer)
    { code: 'BCA', name: 'Bank Central Asia (BCA)', type: 'bank_transfer', icon: '🔵', isActive: true },
    { code: 'MANDIRI', name: 'Bank Mandiri', type: 'bank_transfer', icon: '🟡', isActive: true },
    { code: 'BNI', name: 'Bank Negara Indonesia (BNI)', type: 'bank_transfer', icon: '🟠', isActive: true },
    { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)', type: 'bank_transfer', icon: '🔵', isActive: true },
    { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)', type: 'bank_transfer', icon: '🟢', isActive: true },
    { code: 'CIMB', name: 'CIMB Niaga', type: 'bank_transfer', icon: '🔴', isActive: false },
    { code: 'PERMATA', name: 'Bank Permata', type: 'bank_transfer', icon: '🟢', isActive: false },
    { code: 'SAHABAT_SAMPOERNA', name: 'Bank Sahabat Sampoerna', type: 'bank_transfer', icon: '🔵', isActive: false },
    
    // E-Wallet
    { code: 'OVO', name: 'OVO', type: 'ewallet', icon: '🟣', isActive: true },
    { code: 'DANA', name: 'DANA', type: 'ewallet', icon: '🔵', isActive: true },
    { code: 'GOPAY', name: 'GoPay', type: 'ewallet', icon: '🟢', isActive: true },
    { code: 'LINKAJA', name: 'LinkAja', type: 'ewallet', icon: '🔴', isActive: false },
    { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', icon: '🟠', isActive: false },
    { code: 'ASTRAPAY', name: 'AstraPay', type: 'ewallet', icon: '🔵', isActive: false },
    { code: 'JENIUSPAY', name: 'Jenius Pay', type: 'ewallet', icon: '🟡', isActive: false },
    
    // QRIS
    { code: 'QRIS', name: 'QRIS (Scan QR)', type: 'qris', icon: '📱', isActive: true },
    
    // Retail (Minimarket)
    { code: 'ALFAMART', name: 'Alfamart', type: 'retail', icon: '🔴', isActive: true },
    { code: 'INDOMARET', name: 'Indomaret', type: 'retail', icon: '🟡', isActive: true },
    
    // Cardless Credit / PayLater
    { code: 'KREDIVO', name: 'Kredivo', type: 'cardless_credit', icon: '🟣', isActive: false },
    { code: 'AKULAKU', name: 'Akulaku', type: 'cardless_credit', icon: '🟠', isActive: false },
  ])
  
  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    enableManualBank: true,
    enableXendit: true,
    sandboxMode: false,
    autoActivation: true,
    paymentExpiryHours: 72,
    minAmount: 10000,
    maxAmount: 100000000,
    contactWhatsapp: '',
    contactEmail: '',
    contactPhone: '',
    contactName: 'Customer Service',
  })

  useEffect(() => {
    fetchPaymentSettings()
  }, [])

  const fetchPaymentSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/payment-settings')
      if (response.ok) {
        const data = await response.json()
        if (data.bankAccounts) setBankAccounts(data.bankAccounts)
        if (data.xenditChannels) setXenditChannels(data.xenditChannels)
        if (data.settings) setPaymentSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch payment settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePaymentSettings = async () => {
    setSaving(true)
    try {
      console.log('[Payment Settings UI] Saving:', {
        bankAccountsCount: bankAccounts.length,
        xenditChannelsCount: xenditChannels.length,
        settings: paymentSettings
      })

      const response = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccounts,
          xenditChannels,
          settings: paymentSettings
        })
      })

      const result = await response.json()
      console.log('[Payment Settings UI] Save response:', result)

      if (response.ok) {
        toast.success('Payment settings saved successfully!')
        // Refetch to confirm save
        await fetchPaymentSettings()
      } else {
        throw new Error(result.error || 'Failed to save')
      }
    } catch (error) {
      console.error('[Payment Settings UI] Save error:', error)
      toast.error('Failed to save payment settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleXenditChannel = (code: string) => {
    setXenditChannels(channels =>
      channels.map(ch =>
        ch.code === code ? { ...ch, isActive: !ch.isActive } : ch
      )
    )
  }

  const openBankDialog = (bank?: BankAccount) => {
    setEditingBank(bank || null)
    setBankDialogOpen(true)
  }

  const saveBankAccount = (bank: BankAccount) => {
    if (editingBank) {
      setBankAccounts(accounts =>
        accounts.map(acc => acc.id === bank.id ? bank : acc)
      )
    } else {
      setBankAccounts(accounts => [...accounts, { ...bank, id: Date.now().toString() }])
    }
    setBankDialogOpen(false)
    setEditingBank(null)
  }

  const deleteBankAccount = (id: string) => {
    if (confirm('Hapus rekening bank ini?')) {
      setBankAccounts(accounts => accounts.filter(acc => acc.id !== id))
    }
  }

  const toggleBankAccount = (id: string) => {
    setBankAccounts(accounts =>
      accounts.map(acc =>
        acc.id === id ? { ...acc, isActive: !acc.isActive } : acc
      )
    )
  }

  const handleLogoUpload = async (channelCode: string, file: File) => {
    setUploadingLogo(channelCode)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      formData.append('channelCode', channelCode)

      const response = await fetch('/api/admin/upload-payment-logo', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const { logoUrl } = await response.json()
        
        // Update xenditChannels with new logo URL
        setXenditChannels(channels =>
          channels.map(ch =>
            ch.code === channelCode ? { ...ch, customLogoUrl: logoUrl } : ch
          )
        )
        
        toast.success(`Logo ${channelCode} berhasil diupload! Jangan lupa klik "Simpan Pengaturan"`)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Upload failed:', response.status, errorData)
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error('Gagal upload logo')
    } finally {
      setUploadingLogo(null)
    }
  }

  const resetLogo = (channelCode: string) => {
    setXenditChannels(channels =>
      channels.map(ch =>
        ch.code === channelCode ? { ...ch, customLogoUrl: undefined } : ch
      )
    )
    toast.success(`Logo ${channelCode} direset ke default. Jangan lupa klik "Simpan Pengaturan"`)
  }

  const handleBankLogoUpload = async (bankId: string, file: File) => {
    setUploadingLogo(bankId)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      formData.append('bankId', bankId)

      const response = await fetch('/api/admin/upload-bank-logo', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const { logoUrl } = await response.json()
        
        // Update bankAccounts with new logo URL
        setBankAccounts(banks =>
          banks.map(bank =>
            bank.id === bankId ? { ...bank, customLogoUrl: logoUrl } : bank
          )
        )
        
        toast.success('Logo bank berhasil diupload! Jangan lupa klik "Simpan Pengaturan"')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Upload failed:', response.status, errorData)
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }
    } catch (error) {
      console.error('Bank logo upload error:', error)
      toast.error('Gagal upload logo bank')
    } finally {
      setUploadingLogo(null)
    }
  }

  const resetBankLogo = (bankId: string) => {
    setBankAccounts(banks =>
      banks.map(bank =>
        bank.id === bankId ? { ...bank, customLogoUrl: undefined } : bank
      )
    )
    toast.success('Logo bank direset ke default. Jangan lupa klik "Simpan Pengaturan"')
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground">
            Kelola metode pembayaran manual dan payment gateway
          </p>
        </div>
        <Button 
          onClick={savePaymentSettings} 
          disabled={saving} 
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Settings2 className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Umum
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Building2 className="h-4 w-4" />
            Rekening Manual
          </TabsTrigger>
          <TabsTrigger value="xendit" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Xendit Channels
          </TabsTrigger>
          <TabsTrigger value="logos" className="gap-2">
            <Image className="h-4 w-4" />
            Logo Management
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2" onClick={() => window.location.href = '/admin/settings/checkout-colors'}>
            <Wallet className="h-4 w-4" />
            Warna Checkout
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pengaturan Umum
          </CardTitle>
          <CardDescription>
            Konfigurasi umum untuk sistem pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Rekening Bank Manual</Label>
                <p className="text-sm text-muted-foreground">Aktifkan pembayaran via transfer manual</p>
              </div>
              <Switch
                checked={paymentSettings.enableManualBank}
                onCheckedChange={(checked) =>
                  setPaymentSettings({ ...paymentSettings, enableManualBank: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Xendit Payment Gateway</Label>
                <p className="text-sm text-muted-foreground">Aktifkan pembayaran otomatis via Xendit</p>
              </div>
              <Switch
                checked={paymentSettings.enableXendit}
                onCheckedChange={(checked) =>
                  setPaymentSettings({ ...paymentSettings, enableXendit: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Sandbox Mode</Label>
                <p className="text-sm text-muted-foreground">Testing mode untuk development</p>
              </div>
              <Switch
                checked={paymentSettings.sandboxMode}
                onCheckedChange={(checked) =>
                  setPaymentSettings({ ...paymentSettings, sandboxMode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Activation</Label>
                <p className="text-sm text-muted-foreground">Aktifkan membership otomatis setelah bayar</p>
              </div>
              <Switch
                checked={paymentSettings.autoActivation}
                onCheckedChange={(checked) =>
                  setPaymentSettings({ ...paymentSettings, autoActivation: checked })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <Label>Payment Expiry (Hours)</Label>
              <Input
                type="number"
                value={paymentSettings.paymentExpiryHours}
                onChange={(e) =>
                  setPaymentSettings({ ...paymentSettings, paymentExpiryHours: parseInt(e.target.value) })
                }
                placeholder="72"
              />
              <p className="text-xs text-muted-foreground mt-1">Default: 72 jam (3 hari)</p>
            </div>

            <div>
              <Label>Minimum Amount (Rp)</Label>
              <Input
                type="number"
                value={paymentSettings.minAmount}
                onChange={(e) =>
                  setPaymentSettings({ ...paymentSettings, minAmount: parseInt(e.target.value) })
                }
                placeholder="10000"
              />
            </div>

            <div>
              <Label>Maximum Amount (Rp)</Label>
              <Input
                type="number"
                value={paymentSettings.maxAmount}
                onChange={(e) =>
                  setPaymentSettings({ ...paymentSettings, maxAmount: parseInt(e.target.value) })
                }
                placeholder="100000000"
              />
            </div>
          </div>

          {/* Payment Contact Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Kontak Pembayaran
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Kontak yang akan ditampilkan di halaman pembayaran untuk konfirmasi
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Nama Kontak</Label>
                <Input
                  value={paymentSettings.contactName}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, contactName: e.target.value })
                  }
                  placeholder="Customer Service"
                />
                <p className="text-xs text-muted-foreground mt-1">Contoh: Customer Service, Admin, dll</p>
              </div>
              
              <div>
                <Label>Nomor WhatsApp</Label>
                <Input
                  value={paymentSettings.contactWhatsapp}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, contactWhatsapp: e.target.value })
                  }
                  placeholder="628123456789"
                />
                <p className="text-xs text-muted-foreground mt-1">Format: 628xxx tanpa + atau 0</p>
              </div>
              
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={paymentSettings.contactEmail}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, contactEmail: e.target.value })
                  }
                  placeholder="cs@eksporyuk.com"
                />
              </div>
              
              <div>
                <Label>Nomor Telepon</Label>
                <Input
                  value={paymentSettings.contactPhone}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, contactPhone: e.target.value })
                  }
                  placeholder="021-1234567"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Manual Bank Accounts Tab */}
        <TabsContent value="manual">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Rekening Bank Manual
              </CardTitle>
              <CardDescription>
                Rekening bank untuk pembayaran manual transfer
              </CardDescription>
            </div>
            <Button 
              onClick={() => openBankDialog()} 
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Tambah Rekening
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada rekening bank manual</p>
              <p className="text-sm">Klik "Tambah Rekening" untuk menambah</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map((bank) => {
                const logoUrl = bank.customLogoUrl || getLogoUrl(bank.bankCode)
                return (
                  <div
                    key={bank.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Card Header with Logo */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 border-b">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{bank.bankName}</h3>
                          <p className="text-xs text-muted-foreground">{bank.bankCode}</p>
                        </div>
                        <Switch
                          checked={bank.isActive}
                          onCheckedChange={() => toggleBankAccount(bank.id)}
                        />
                      </div>
                      
                      {/* Logo Display */}
                      <div className="relative w-full h-24 bg-white rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                        <img 
                          src={logoUrl} 
                          alt={bank.bankName}
                          className="max-w-full max-h-full object-contain p-2"
                          onError={(e) => {
                            e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60'%3E%3Crect width='100' height='60' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%2364748b' font-family='Arial'%3E${bank.bankCode}%3C/text%3E%3C/svg%3E`
                          }}
                        />
                      </div>

                      {/* Logo Upload Controls */}
                      <div className="mt-3 space-y-2">
                        <label className="cursor-pointer">
                          <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border rounded-md hover:bg-gray-50 transition-colors text-sm">
                            <Image className="h-3.5 w-3.5" />
                            <span>{uploadingLogo === bank.id ? 'Uploading...' : 'Upload Logo'}</span>
                          </div>
                          <input
                            type="file"
                            accept="image/svg+xml,image/png,image/jpeg,image/webp"
                            className="hidden"
                            disabled={uploadingLogo === bank.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleBankLogoUpload(bank.id, file)
                            }}
                          />
                        </label>
                        
                        {bank.customLogoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => resetBankLogo(bank.id)}
                          >
                            Reset ke Logo Default
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Card Body - Account Details */}
                    <div className="p-4 space-y-3 bg-white">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Nomor Rekening</p>
                        <p className="font-mono font-semibold text-sm">{bank.accountNumber}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Atas Nama</p>
                        <p className="font-medium text-sm">{bank.accountName}</p>
                      </div>
                      
                      {bank.branch && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Cabang</p>
                          <p className="text-sm">{bank.branch}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openBankDialog(bank)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteBankAccount(bank.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Xendit Channels Tab */}
        <TabsContent value="xendit">
      {/* Xendit Payment Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Xendit Payment Channels
          </CardTitle>
          <CardDescription>
            Aktifkan/nonaktifkan metode pembayaran Xendit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bank Transfer / Virtual Account */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Virtual Account (Bank Transfer)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {xenditChannels
                .filter(ch => ch.type === 'bank_transfer')
                .map((channel) => {
                  const logoUrl = getLogoUrl(channel.code)
                  return (
                    <div
                      key={channel.code}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center p-2 shadow-sm">
                          <img 
                            src={logoUrl} 
                            alt={channel.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/40?text=' + channel.code.slice(0,3)
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{channel.name}</p>
                          <p className="text-xs text-muted-foreground">{channel.code}</p>
                        </div>
                      </div>
                      <Switch
                        checked={channel.isActive}
                        onCheckedChange={() => toggleXenditChannel(channel.code)}
                      />
                    </div>
                  )
                })}
            </div>
          </div>

          {/* E-Wallet */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              E-Wallet
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {xenditChannels
                .filter(ch => ch.type === 'ewallet')
                .map((channel) => {
                  const logoUrl = getLogoUrl(channel.code)
                  return (
                    <div
                      key={channel.code}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center p-2 shadow-sm">
                          <img 
                            src={logoUrl} 
                            alt={channel.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/40?text=' + channel.code.slice(0,3)
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{channel.name}</p>
                          <p className="text-xs text-muted-foreground">{channel.code}</p>
                        </div>
                      </div>
                      <Switch
                        checked={channel.isActive}
                        onCheckedChange={() => toggleXenditChannel(channel.code)}
                      />
                    </div>
                  )
                })}
            </div>
          </div>

          {/* QRIS */}
          <div>
            <h3 className="font-semibold mb-3">QRIS</h3>
            <div className="grid grid-cols-2 gap-3">
              {xenditChannels
                .filter(ch => ch.type === 'qris')
                .map((channel) => {
                  const logoUrl = getLogoUrl(channel.code)
                  return (
                    <div
                      key={channel.code}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center p-2 shadow-sm">
                          <img 
                            src={logoUrl} 
                            alt={channel.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/40?text=QR'
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{channel.name}</p>
                          <p className="text-xs text-muted-foreground">{channel.code}</p>
                        </div>
                      </div>
                      <Switch
                        checked={channel.isActive}
                        onCheckedChange={() => toggleXenditChannel(channel.code)}
                      />
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Retail */}
          <div>
            <h3 className="font-semibold mb-3">Retail (Minimarket)</h3>
            <div className="grid grid-cols-2 gap-3">
              {xenditChannels
                .filter(ch => ch.type === 'retail')
                .map((channel) => {
                  const logoUrl = getLogoUrl(channel.code)
                  return (
                    <div
                      key={channel.code}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center p-2 shadow-sm">
                          <img 
                            src={logoUrl} 
                            alt={channel.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/40?text=' + channel.code.slice(0,3)
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{channel.name}</p>
                          <p className="text-xs text-muted-foreground">{channel.code}</p>
                        </div>
                      </div>
                      <Switch
                        checked={channel.isActive}
                        onCheckedChange={() => toggleXenditChannel(channel.code)}
                      />
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Cardless Credit / PayLater */}
          <div>
            <h3 className="font-semibold mb-3">Cardless Credit / PayLater</h3>
            <div className="grid grid-cols-2 gap-3">
              {xenditChannels
                .filter(ch => ch.type === 'cardless_credit')
                .map((channel) => {
                  const logoUrl = getLogoUrl(channel.code)
                  return (
                    <div
                      key={channel.code}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center p-2 shadow-sm">
                          <img 
                            src={logoUrl} 
                            alt={channel.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/40?text=' + channel.code.slice(0,3)
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{channel.name}</p>
                          <p className="text-xs text-muted-foreground">{channel.code}</p>
                        </div>
                      </div>
                      <Switch
                        checked={channel.isActive}
                        onCheckedChange={() => toggleXenditChannel(channel.code)}
                      />
                    </div>
                  )
                })}
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Logo Management Tab */}
        <TabsContent value="logos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo Management
              </CardTitle>
              <CardDescription>
                Upload dan kelola logo untuk setiap payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Bank Transfer Logos */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bank Transfer / Virtual Account
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {xenditChannels
                      .filter(ch => ch.type === 'bank_transfer')
                      .map((channel) => {
                        const logoUrl = channel.customLogoUrl || getLogoUrl(channel.code)
                        const isUploading = uploadingLogo === channel.code
                        
                        return (
                          <div key={channel.code} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{channel.name}</h4>
                              <Badge variant="outline" className="text-xs">{channel.code}</Badge>
                            </div>
                            
                            {/* Logo Preview */}
                            <div className="w-full h-24 bg-gray-50 rounded border flex items-center justify-center">
                              <img 
                                src={logoUrl} 
                                alt={channel.name}
                                className="max-w-full max-h-full object-contain p-2"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = 'https://via.placeholder.com/100?text=' + channel.code
                                }}
                              />
                            </div>
                            
                            {/* Upload Actions */}
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/svg+xml,image/png,image/jpeg,image/webp"
                                className="hidden"
                                id={`logo-upload-${channel.code}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLogoUpload(channel.code, file)
                                }}
                                disabled={isUploading}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => document.getElementById(`logo-upload-${channel.code}`)?.click()}
                                disabled={isUploading}
                              >
                                {isUploading ? 'Uploading...' : 'Upload'}
                              </Button>
                              {channel.customLogoUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => resetLogo(channel.code)}
                                  disabled={isUploading}
                                >
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* E-Wallet Logos */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    E-Wallet
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {xenditChannels
                      .filter(ch => ch.type === 'ewallet')
                      .map((channel) => {
                        const logoUrl = channel.customLogoUrl || getLogoUrl(channel.code)
                        const isUploading = uploadingLogo === channel.code
                        
                        return (
                          <div key={channel.code} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{channel.name}</h4>
                              <Badge variant="outline" className="text-xs">{channel.code}</Badge>
                            </div>
                            
                            <div className="w-full h-24 bg-gray-50 rounded border flex items-center justify-center">
                              <img 
                                src={logoUrl} 
                                alt={channel.name}
                                className="max-w-full max-h-full object-contain p-2"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/svg+xml,image/png,image/jpeg,image/webp"
                                className="hidden"
                                id={`logo-upload-${channel.code}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLogoUpload(channel.code, file)
                                }}
                                disabled={isUploading}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => document.getElementById(`logo-upload-${channel.code}`)?.click()}
                                disabled={isUploading}
                              >
                                {isUploading ? 'Uploading...' : 'Upload'}
                              </Button>
                              {channel.customLogoUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => resetLogo(channel.code)}
                                  disabled={isUploading}
                                >
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Other Payment Methods */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Metode Pembayaran Lainnya
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {xenditChannels
                      .filter(ch => ch.type !== 'bank_transfer' && ch.type !== 'ewallet')
                      .map((channel) => {
                        const logoUrl = channel.customLogoUrl || getLogoUrl(channel.code)
                        const isUploading = uploadingLogo === channel.code
                        
                        return (
                          <div key={channel.code} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{channel.name}</h4>
                              <Badge variant="outline" className="text-xs">{channel.code}</Badge>
                            </div>
                            
                            <div className="w-full h-24 bg-gray-50 rounded border flex items-center justify-center">
                              <img 
                                src={logoUrl} 
                                alt={channel.name}
                                className="max-w-full max-h-full object-contain p-2"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/svg+xml,image/png,image/jpeg,image/webp"
                                className="hidden"
                                id={`logo-upload-${channel.code}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLogoUpload(channel.code, file)
                                }}
                                disabled={isUploading}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => document.getElementById(`logo-upload-${channel.code}`)?.click()}
                                disabled={isUploading}
                              >
                                {isUploading ? 'Uploading...' : 'Upload'}
                              </Button>
                              {channel.customLogoUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => resetLogo(channel.code)}
                                  disabled={isUploading}
                                >
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bank Account Dialog */}
      <BankAccountDialog
        open={bankDialogOpen}
        onClose={() => setBankDialogOpen(false)}
        bank={editingBank}
        onSave={saveBankAccount}
      />
      </div>
    </ResponsivePageWrapper>
  )
}

// Bank Account Dialog Component
function BankAccountDialog({
  open,
  onClose,
  bank,
  onSave
}: {
  open: boolean
  onClose: () => void
  bank: BankAccount | null
  onSave: (bank: BankAccount) => void
}) {
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
    branch: '',
    isActive: true,
    order: 0
  })

  useEffect(() => {
    if (bank) {
      setFormData(bank)
    } else {
      setFormData({
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
        branch: '',
        isActive: true,
        order: 0
      })
    }
  }, [bank, open])

  const handleSave = () => {
    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      toast.error('Mohon lengkapi semua field yang wajib diisi')
      return
    }

    onSave({
      ...formData,
      id: bank?.id || Date.now().toString()
    } as BankAccount)
  }

  const bankOptions = [
    { value: 'BCA', label: 'Bank Central Asia', code: 'BCA', color: 'bg-blue-500' },
    { value: 'MANDIRI', label: 'Bank Mandiri', code: 'MANDIRI', color: 'bg-yellow-500' },
    { value: 'BNI', label: 'Bank Negara Indonesia', code: 'BNI', color: 'bg-orange-500' },
    { value: 'BRI', label: 'Bank Rakyat Indonesia', code: 'BRI', color: 'bg-blue-600' },
    { value: 'BSI', label: 'Bank Syariah Indonesia', code: 'BSI', color: 'bg-green-600' },
    { value: 'JAGO', label: 'Bank Jago', code: 'JAGO', color: 'bg-indigo-500' },
    { value: 'CIMB', label: 'CIMB Niaga', code: 'CIMB', color: 'bg-red-600' },
    { value: 'PERMATA', label: 'Bank Permata', code: 'PERMATA', color: 'bg-green-500' },
    { value: 'BTN', label: 'Bank BTN', code: 'BTN', color: 'bg-blue-700' },
    { value: 'DANAMON', label: 'Bank Danamon', code: 'DANAMON', color: 'bg-blue-600' },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="space-y-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{bank ? 'Edit' : 'Tambah'} Rekening Bank</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {bank ? 'Perbarui informasi rekening bank' : 'Tambahkan rekening bank untuk pembayaran manual transfer'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Bank Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nama Bank <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.bankName}
              onValueChange={(value) => setFormData({ ...formData, bankName: value, bankCode: value })}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Pilih bank yang akan digunakan" />
              </SelectTrigger>
              <SelectContent>
                {bankOptions.map((bank) => (
                  <SelectItem key={bank.value} value={bank.value} className="py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md ${bank.color} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                        {bank.code.substring(0, 2)}
                      </div>
                      <span className="font-medium">{bank.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pilih bank sesuai dengan rekening yang akan digunakan
            </p>
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Nomor Rekening <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
              placeholder="Contoh: 1234567890"
              className="h-12 text-base font-mono"
              type="text"
              inputMode="numeric"
            />
            <p className="text-xs text-muted-foreground">
              Masukkan nomor rekening tanpa spasi atau tanda baca
            </p>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Nama Pemilik Rekening <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="Contoh: PT Ekspor Yuk Indonesia"
              className="h-12 text-base"
            />
            <p className="text-xs text-muted-foreground">
              Nama harus sesuai dengan buku rekening
            </p>
          </div>

          {/* Branch (Optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Cabang <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
            </Label>
            <Input
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="Contoh: Jakarta Pusat"
              className="h-12 text-base"
            />
            <p className="text-xs text-muted-foreground">
              Informasi cabang bank (jika diperlukan)
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Status Rekening</Label>
              <p className="text-xs text-muted-foreground">
                {formData.isActive ? 'Rekening aktif dan dapat dipilih customer' : 'Rekening tidak aktif dan tidak ditampilkan'}
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="h-11">
            Batal
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6"
          >
            <Check className="h-4 w-4 mr-2" />
            {bank ? 'Simpan Perubahan' : 'Tambah Rekening'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
