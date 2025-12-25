'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  AlertCircle,
  CheckCircle2,
  Settings,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ExternalLink,
  Zap,
  Mail,
  MessageSquare,
  Bell,
  Loader2,
  Chrome,
  Facebook,
} from 'lucide-react'

interface IntegrationConfig {
  name: string
  description: string
  icon: React.ReactNode
  website?: string
  env_vars: {
    key: string
    label: string
    required: boolean
    masked?: boolean
    type?: 'text' | 'select'
    options?: { label: string; value: string }[]
  }[]
}

const integrations: Record<string, IntegrationConfig> = {
  giphy: {
    name: 'Giphy',
    description: 'GIF Search & Integration untuk Post di Komunitas Grup',
    icon: <MessageSquare className="h-6 w-6" />,
    website: 'https://developers.giphy.com',
    env_vars: [
      {
        key: 'GIPHY_API_KEY',
        label: 'API Key',
        required: true,
        masked: true,
      },
    ],
  },
  xendit: {
    name: 'Xendit',
    description: 'Payment Gateway untuk Membership, Produk, dan Kelas',
    icon: <Zap className="h-6 w-6" />,
    website: 'https://dashboard.xendit.co',
    env_vars: [
      {
        key: 'XENDIT_SECRET_KEY',
        label: 'Secret Key',
        required: true,
        masked: true,
      },
      {
        key: 'XENDIT_WEBHOOK_TOKEN',
        label: 'Webhook Token',
        required: true,
        masked: true,
      },
      {
        key: 'XENDIT_ENVIRONMENT',
        label: 'Environment',
        required: true,
        type: 'select',
        options: [
          { label: 'Development (Testing)', value: 'development' },
          { label: 'Production (Live)', value: 'production' },
        ],
      },
      {
        key: 'XENDIT_VA_COMPANY_CODE',
        label: 'VA Company Code (Optional)',
        required: false,
      },
    ],
  },
  mailketing: {
    name: 'Mailketing',
    description: 'Email Marketing & Automation Service',
    icon: <Mail className="h-6 w-6" />,
    website: 'https://mailketing.co.id',
    env_vars: [
      {
        key: 'MAILKETING_API_KEY',
        label: 'API Key',
        required: false,
        masked: true,
      },
      {
        key: 'MAILKETING_SENDER_EMAIL',
        label: 'Email Pengirim (From)',
        required: false,
      },
      {
        key: 'MAILKETING_SENDER_NAME',
        label: 'Nama Pengirim (From Name)',
        required: false,
      },
      {
        key: 'MAILKETING_REPLY_TO_EMAIL',
        label: 'Reply-To Email (Alamat Balasan)',
        required: false,
      },
      {
        key: 'MAILKETING_FORWARD_EMAIL',
        label: 'Forward Email (CC/BCC ke Admin)',
        required: false,
      },
    ],
  },
  starsender: {
    name: 'StarSender',
    description: 'WhatsApp & SMS Gateway - Tampilan API saja',
    icon: <MessageSquare className="h-6 w-6" />,
    website: 'https://starsender.com',
    env_vars: [
      {
        key: 'STARSENDER_API_KEY',
        label: 'API Key',
        required: true,
        masked: true,
      },
      {
        key: 'STARSENDER_DEVICE_ID',
        label: 'Device ID',
        required: true,
      },
    ],
  },
  onesignal: {
    name: 'OneSignal',
    description: 'Push Notifications & Messaging',
    icon: <Bell className="h-6 w-6" />,
    website: 'https://onesignal.com',
    env_vars: [
      {
        key: 'ONESIGNAL_APP_ID',
        label: 'App ID',
        required: true,
        masked: true,
      },
      {
        key: 'ONESIGNAL_API_KEY',
        label: 'REST API Key',
        required: true,
        masked: true,
      },
    ],
  },
  pusher: {
    name: 'Pusher',
    description: 'Real-time Features & Live Updates',
    icon: <Settings className="h-6 w-6" />,
    website: 'https://pusher.com',
    env_vars: [
      {
        key: 'PUSHER_APP_ID',
        label: 'App ID',
        required: false,
      },
      {
        key: 'PUSHER_KEY',
        label: 'Key',
        required: false,
      },
      {
        key: 'PUSHER_SECRET',
        label: 'Secret',
        required: false,
        masked: true,
      },
      {
        key: 'PUSHER_CLUSTER',
        label: 'Cluster',
        required: false,
      },
    ],
  },
  google: {
    name: 'Google OAuth',
    description: 'Google Login Integration untuk User Authentication',
    icon: <Chrome className="h-6 w-6" />,
    website: 'https://console.cloud.google.com',
    env_vars: [
      {
        key: 'GOOGLE_CLIENT_ID',
        label: 'Client ID',
        required: true,
        masked: false,
      },
      {
        key: 'GOOGLE_CLIENT_SECRET',
        label: 'Client Secret',
        required: true,
        masked: true,
      },
      {
        key: 'GOOGLE_CALLBACK_URL',
        label: 'Callback URL (Authorized Redirect URIs)',
        required: true,
        masked: false,
      },
    ],
  },
  facebook: {
    name: 'Facebook OAuth',
    description: 'Facebook Login Integration untuk User Authentication',
    icon: <Facebook className="h-6 w-6" />,
    website: 'https://developers.facebook.com',
    env_vars: [
      {
        key: 'FACEBOOK_CLIENT_ID',
        label: 'App ID',
        required: true,
        masked: false,
      },
      {
        key: 'FACEBOOK_CLIENT_SECRET',
        label: 'App Secret',
        required: true,
        masked: true,
      },
    ],
  },
}

interface IntegrationState {
  [key: string]: {
    [varKey: string]: string
  }
}

interface ServiceStatus {
  [key: string]: 'connected' | 'not-configured' | 'error'
}

export default function IntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<string>('giphy')
  const [values, setValues] = useState<IntegrationState>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testMode, setTestMode] = useState<'demo' | 'xendit'>('demo')
  const [affiliateCode, setAffiliateCode] = useState('')
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({})
  const [testingConnection, setTestingConnection] = useState(false)
  const [mailketingLists, setMailketingLists] = useState<any[]>([])
  const [loadingLists, setLoadingLists] = useState(false)

  // Load all services status on mount
  useEffect(() => {
    const loadAllStatuses = async () => {
      try {
        console.log('[INTEGRATION_PAGE] Loading all service statuses...')
        const response = await fetch('/api/admin/integrations')
        const data = await response.json()

        if (response.ok) {
          const statuses: ServiceStatus = {}
          Object.entries(data).forEach(([service, info]: [string, any]) => {
            statuses[service] = info.configured ? 'connected' : 'not-configured'
          })
          setServiceStatus(statuses)
          console.log('[INTEGRATION_PAGE] Service statuses loaded:', statuses)
        }
      } catch (error) {
        console.error('[INTEGRATION_PAGE] Error loading statuses:', error)
      }
    }

    loadAllStatuses()
  }, [])

  // Load existing configuration when selected integration changes
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/integrations?service=${selectedIntegration}`)
        const data = await response.json()

        if (data.configured && data.config) {
          setValues(prev => ({
            ...prev,
            [selectedIntegration]: data.config,
          }))
          
          // Update status based on configuration
          setServiceStatus(prev => ({
            ...prev,
            [selectedIntegration]: data.isActive ? 'connected' : 'not-configured'
          }))
        } else {
          setServiceStatus(prev => ({
            ...prev,
            [selectedIntegration]: 'not-configured'
          }))
        }
      } catch (error) {
        console.warn('⚠️ Failed to load config:', error)
        setServiceStatus(prev => ({
          ...prev,
          [selectedIntegration]: 'error'
        }))
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [selectedIntegration])

  // Load Mailketing lists when Mailketing is selected
  useEffect(() => {
    const loadMailketingLists = async () => {
      if (selectedIntegration !== 'mailketing') return
      
      try {
        setLoadingLists(true)
        const response = await fetch('/api/admin/mailketing/lists')
        const data = await response.json()
        
        if (data.success && data.lists) {
          setMailketingLists(data.lists)
        } else {
          console.log('ℹ️  Mailketing lists not available:', data.message)
          setMailketingLists([])
        }
      } catch (error) {
        console.warn('⚠️ Failed to load Mailketing lists:', error)
        setMailketingLists([])
      } finally {
        setLoadingLists(false)
      }
    }

    loadMailketingLists()
  }, [selectedIntegration])

  const current = integrations[selectedIntegration]
  if (!current) return null

  const handleValueChange = (varKey: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [selectedIntegration]: {
        ...prev[selectedIntegration],
        [varKey]: value,
      },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      const formData = new FormData()
      formData.append('service', selectedIntegration)
      formData.append('config', JSON.stringify(values[selectedIntegration] || {}))

      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: `${current.name} berhasil dikonfigurasi` })
        // Update status to connected after successful save
        setServiceStatus(prev => ({
          ...prev,
          [selectedIntegration]: 'connected'
        }))
        
        // Reload all service statuses to sync with database
        try {
          const statusResponse = await fetch('/api/admin/integrations')
          const statusData = await statusResponse.json()
          
          if (statusResponse.ok) {
            const newStatuses: ServiceStatus = {}
            Object.entries(statusData).forEach(([service, info]: [string, any]) => {
              if (service !== 'integrations') { // Skip the integrations array in response
                newStatuses[service] = info.configured ? 'connected' : 'not-configured'
              }
            })
            setServiceStatus(newStatuses)
            console.log('[INTEGRATION_PAGE] Service statuses updated:', newStatuses)
          }
        } catch (statusErr) {
          console.warn('Failed to reload statuses:', statusErr)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan konfigurasi' })
        setServiceStatus(prev => ({
          ...prev,
          [selectedIntegration]: 'error'
        }))
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
      setServiceStatus(prev => ({
        ...prev,
        [selectedIntegration]: 'error'
      }))
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true)
      setMessage(null)

      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: selectedIntegration })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${data.message}` 
        })
        setServiceStatus(prev => ({
          ...prev,
          [selectedIntegration]: 'connected'
        }))
      } else {
        setMessage({ 
          type: 'error', 
          text: `❌ ${data.message || 'Test koneksi gagal'}` 
        })
        setServiceStatus(prev => ({
          ...prev,
          [selectedIntegration]: 'error'
        }))
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `❌ Gagal test koneksi: ${error instanceof Error ? error.message : 'Network error'}` 
      })
      setServiceStatus(prev => ({
        ...prev,
        [selectedIntegration]: 'error'
      }))
    } finally {
      setTestingConnection(false)
    }
  }

  const handleTest = async (type: string) => {
    try {
      setTesting(type)
      setMessage(null)

      const response = await fetch('/api/admin/test-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type,
          mode: testMode,
          affiliateCode: affiliateCode || undefined
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Check if DEMO mode
        if (data.demoMode) {
          setMessage({
            type: 'success',
            text: data.message,
          })
        } else if (data.paymentUrl) {
          // Real Xendit payment flow
          window.open(data.paymentUrl, '_blank')
          setMessage({
            type: 'success',
            text: `Test transaction dibuat! Payment URL dibuka di tab baru.`,
          })
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal membuat test transaction' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat membuat test transaction' })
    } finally {
      setTesting(null)
    }
  }

  const currentConfig = values[selectedIntegration] || {}

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan Integrasi</h1>
          <p className="text-gray-600 mt-2">
            Kelola koneksi dengan layanan eksternal untuk payment, email, SMS, notifikasi, dan fitur real-time
          </p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Service List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Layanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(integrations).map(([key, config]) => {
                  const status = serviceStatus[key] || 'not-configured'
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedIntegration(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        selectedIntegration === key
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{config.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{config.name}</div>
                        <div className="text-xs text-gray-500">
                          <Badge
                            variant="outline"
                            className={
                              status === 'connected'
                                ? 'bg-green-50 text-green-700 border-green-300'
                                : status === 'error'
                                ? 'bg-red-50 text-red-700 border-red-300'
                                : 'bg-gray-50 text-gray-700'
                            }
                          >
                            {status === 'connected'
                              ? '✓ Connected'
                              : status === 'error'
                              ? '✗ Error'
                              : 'Tidak Diatur'}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{current.icon}</span>
                  <div>
                    <CardTitle>{current.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{current.description}</p>
                  </div>
                </div>
                {current.website && (
                  <a
                    href={current.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Kunjungi Dashboard
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </CardHeader>

              <Separator />

              <CardContent className="pt-6 space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading configuration...</span>
                  </div>
                ) : (
                  <>
                    {/* Info Box untuk Giphy */}
                    {selectedIntegration === 'giphy' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                        <div className="font-semibold text-purple-900 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Panduan Setup Giphy API
                        </div>
                        <div className="text-sm text-purple-800 space-y-1">
                          <p>1. Buka <a href="https://developers.giphy.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Giphy Developers</a></p>
                          <p>2. Buat akun atau login dengan akun existing</p>
                          <p>3. Create New App → Pilih "SDK" → Isi nama aplikasi</p>
                          <p>4. Copy <strong>API Key</strong> dari dashboard aplikasi</p>
                          <p className="font-semibold mt-2 flex items-center gap-1">
                            🎯 API Key ini digunakan untuk search dan embed GIF di post komunitas
                          </p>
                          <p className="text-sm text-purple-700 mt-2">
                            💡 <strong>Free tier</strong>: 1000 requests/hari. <strong>Production</strong>: Contact Giphy untuk rate limit lebih tinggi
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Info Box untuk Mailketing */}
                    {selectedIntegration === 'mailketing' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                        <div className="font-semibold text-blue-900 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Panduan Setup Mailketing
                        </div>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>1. Buka <a href="https://be.mailketing.co.id" target="_blank" rel="noopener noreferrer" className="underline font-semibold">dashboard Mailketing</a></p>
                          <p>2. Buat <strong>List</strong> untuk mengelompokkan subscriber (e.g., "Premium Members", "Newsletter")</p>
                          <p>3. Tambahkan <strong>Sender Email</strong> yang sudah diverifikasi di Mailketing</p>
                          <p>4. Copy <strong>API Key</strong> dari Settings → API</p>
                          <p className="font-semibold mt-2 flex items-center gap-1">
                            💡 Sender Email harus sudah diverifikasi di Mailketing sebelum bisa digunakan
                          </p>
                        </div>
                        {mailketingLists.length > 0 && (
                          <div className="pt-2 border-t border-blue-200">
                            <p className="text-sm text-blue-800 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-semibold">{mailketingLists.length} list</span> tersedia untuk auto-assignment
                            </p>
                            <a 
                              href="/admin/mailketing/lists" 
                              className="text-sm text-blue-700 underline hover:text-blue-900 mt-1 inline-block"
                            >
                              Kelola Lists & Assignment →
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info Box untuk Xendit */}
                    {selectedIntegration === 'xendit' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="font-semibold text-blue-900 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Panduan Setup Xendit
                    </div>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Development Mode (Testing):</strong></p>
                      <p>1. Login ke <a href="https://dashboard.xendit.co" target="_blank" className="underline">dashboard.xendit.co</a></p>
                      <p>2. Pilih "Test" mode di dropdown (kiri atas)</p>
                      <p>3. Settings → Developers → API Keys → Copy <strong>Secret Key</strong> (xnd_development_...)</p>
                      <p>4. Settings → Webhooks → Generate Verification Token</p>
                      <p>5. Set Environment = "development" dan VA Company Code = "88088"</p>
                      <p className="font-semibold mt-2 pt-2 border-t border-blue-300">
                        <strong>Production Mode (Live):</strong>
                      </p>
                      <p>1. Aktifkan Live Mode di Xendit Dashboard</p>
                      <p>2. Copy <strong>Secret Key Production</strong> (xnd_production_...)</p>
                      <p>3. <strong>Aktivasi Virtual Account untuk bank yang diinginkan</strong> (contact Xendit support untuk BCA)</p>
                      <p>4. Set Webhook URL production: https://yourdomain.com/api/webhooks/xendit</p>
                      <p className="font-semibold mt-2 flex items-center gap-1">
                        💡 Dev Mode: Test tanpa biaya | Production: Biaya transaksi real
                      </p>
                    </div>
                  </div>
                )}

                {/* Environment Variables */}
                <div className="space-y-4">
                  {current.env_vars.map(variable => {
                    const isRequired = variable.required
                    const isMasked = variable.masked && !showSecrets[variable.key]
                    const value = currentConfig[variable.key] || ''

                    return (
                      <div key={variable.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {variable.label}
                          {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {variable.type === 'select' ? (
                          <select
                            value={value}
                            onChange={e => handleValueChange(variable.key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Pilih {variable.label}</option>
                            {variable.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="relative">
                            <Input
                              type={isMasked ? 'password' : 'text'}
                              value={value}
                              onChange={e => handleValueChange(variable.key, e.target.value)}
                              placeholder={`Masukkan ${variable.label.toLowerCase()}`}
                              className="pr-10"
                            />
                            {variable.masked && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowSecrets(prev => ({
                                    ...prev,
                                    [variable.key]: !prev[variable.key],
                                  }))
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showSecrets[variable.key] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        {variable.key === 'XENDIT_ENVIRONMENT' && value === 'development' && (
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Mode Development: Testing tanpa biaya sebenarnya
                          </p>
                        )}
                        {variable.key === 'XENDIT_ENVIRONMENT' && value === 'production' && (
                          <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Mode Production: Transaksi REAL dengan biaya aktual. Pastikan Virtual Account sudah diaktivasi!
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving || testingConnection} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setValues(prev => ({
                          ...prev,
                          [selectedIntegration]: {}
                        }))
                        setMessage(null)
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                  
                  {/* Test Connection Button */}
                  <Button 
                    variant="secondary" 
                    onClick={handleTestConnection}
                    disabled={testingConnection || saving}
                    className="w-full"
                  >
                    {testingConnection ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Testing Section */}
            {selectedIntegration === 'xendit' && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Test Transaksi & Affiliate</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Test pembelian membership, produk, dan kelas. Mode DEMO langsung sukses, mode Xendit buat invoice real.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Test Mode Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mode Test</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={testMode === 'demo' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTestMode('demo')}
                      >
                        🎮 Demo (Instant)
                      </Button>
                      <Button
                        type="button"
                        variant={testMode === 'xendit' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTestMode('xendit')}
                      >
                        💳 Xendit (Real Invoice)
                      </Button>
                    </div>
                    {testMode === 'demo' && (
                      <p className="text-xs text-gray-500">
                        ✅ Mode DEMO: Transaction langsung SUCCESS tanpa payment gateway
                      </p>
                    )}
                    {testMode === 'xendit' && (
                      <p className="text-xs text-gray-500">
                        💳 Mode XENDIT: Buat invoice real di Xendit Sandbox. Test card: 4111111111111111
                      </p>
                    )}
                  </div>

                  {/* Affiliate Code Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Kode Affiliate (Opsional)
                    </label>
                    <Input
                      type="text"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                      placeholder="Email affiliate untuk test komisi"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500">
                      Masukkan email user affiliate untuk test tracking komisi 10%
                    </p>
                  </div>

                  {/* Test Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => handleTest('membership')}
                      disabled={testing !== null}
                    >
                      {testing === 'membership' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {testing === 'membership' ? 'Creating...' : 'Test Membership'}
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => handleTest('product')}
                      disabled={testing !== null}
                    >
                      {testing === 'product' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {testing === 'product' ? 'Creating...' : 'Test Produk'}
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => handleTest('course')}
                      disabled={testing !== null}
                    >
                      {testing === 'course' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {testing === 'course' ? 'Creating...' : 'Test Kelas'}
                    </Button>
                  </div>

                  {/* Test Card Info for Xendit Mode */}
                  {testMode === 'xendit' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-900 font-semibold mb-2">💳 Test Card Details:</p>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Card Number: <code className="bg-blue-100 px-2 py-1 rounded">4111111111111111</code></p>
                      <p>• CVV: <code className="bg-blue-100 px-2 py-1 rounded">123</code></p>
                      <p>• Expiry: Any future date (e.g., 12/25)</p>
                      <p>• Name: Any name</p>
                    </div>
                  </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
