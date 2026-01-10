'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Phone,
  User,
  Settings
} from 'lucide-react'

interface ConfigStatus {
  configured: boolean
  mode: 'development' | 'production'
  apiUrl: string
  hasApiKey: boolean
  hasDeviceId: boolean
  status: 'ready' | 'not_configured'
}

export default function StarsenderTestPage() {
  const [config, setConfig] = useState<ConfigStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [testData, setTestData] = useState({
    phone: '',
    name: ''
  })
  const [lastResult, setLastResult] = useState<any>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/integrations/starsender/test')
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Gagal memuat konfigurasi')
    }
  }

  const runTest = async (testType: string) => {
    if ((testType !== 'connection') && !testData.phone) {
      toast.error('Nomor HP wajib diisi')
      return
    }

    if (['welcome', 'membership', 'reminder'].includes(testType) && !testData.name) {
      toast.error('Nama wajib diisi')
      return
    }

    setLoading(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/admin/integrations/starsender/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testType,
          ...testData
        })
      })

      const data = await response.json()
      setLastResult(data)

      if (data.success && data.result?.success) {
        toast.success('Test berhasil! WhatsApp terkirim.')
      } else {
        toast.error(data.result?.error || data.error || 'Test gagal')
      }
    } catch (error: any) {
      console.error('Test error:', error)
      toast.error('Terjadi kesalahan saat testing')
      setLastResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Integrasi Starsender</h1>
          <p className="text-muted-foreground mt-1">
            Testing WhatsApp notifications dengan Starsender API
          </p>
        </div>

        {/* Status Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status Konfigurasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {config ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={config.configured ? "default" : "destructive"} className="text-sm">
                      {config.status === 'ready' ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Siap
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Belum Dikonfigurasi
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Mode</p>
                    <Badge variant="outline" className="text-sm">
                      {config.mode === 'development' ? '🧪 Development' : '🚀 Production'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">API Key</p>
                    <Badge variant={config.hasApiKey ? "default" : "secondary"} className="text-sm">
                      {config.hasApiKey ? '✓ Configured' : '✗ Not Set'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Device ID</p>
                    <Badge variant={config.hasDeviceId ? "default" : "secondary"} className="text-sm">
                      {config.hasDeviceId ? '✓ Configured' : '✗ Not Set'}
                    </Badge>
                  </div>
                </div>

                {config.mode === 'development' && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Mode Development Aktif
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Pesan WhatsApp hanya akan tampil di console log, tidak benar-benar terkirim.
                          Konfigurasi STARSENDER_API_KEY untuk mode production.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Forms */}
        <Tabs defaultValue="simple" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="simple">Simple Test</TabsTrigger>
            <TabsTrigger value="welcome">Welcome</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="reminder">Reminder</TabsTrigger>
          </TabsList>

          {/* Tab 1: Simple Test */}
          <TabsContent value="simple" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Pesan Sederhana</CardTitle>
                <CardDescription>
                  Kirim pesan WhatsApp test sederhana untuk memverifikasi koneksi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor HP *</Label>
                    <div className="flex gap-2">
                      <Phone className="h-5 w-5 text-muted-foreground mt-2" />
                      <Input
                        id="phone"
                        placeholder="08123456789"
                        value={testData.phone}
                        onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: 08xxx atau +628xxx
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nama (opsional)</Label>
                    <div className="flex gap-2">
                      <User className="h-5 w-5 text-muted-foreground mt-2" />
                      <Input
                        id="name"
                        placeholder="Nama penerima"
                        value={testData.name}
                        onChange={(e) => setTestData({ ...testData, name: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => runTest('simple')}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Kirim Pesan Test
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Welcome Message */}
          <TabsContent value="welcome" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Welcome Message</CardTitle>
                <CardDescription>
                  Template pesan selamat datang untuk member baru
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-welcome">Nomor HP *</Label>
                    <Input
                      id="phone-welcome"
                      placeholder="08123456789"
                      value={testData.phone}
                      onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name-welcome">Nama *</Label>
                    <Input
                      id="name-welcome"
                      placeholder="Nama member"
                      value={testData.name}
                      onChange={(e) => setTestData({ ...testData, name: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => runTest('welcome')}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Kirim Welcome Message
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Membership Notification */}
          <TabsContent value="membership" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Membership Purchase</CardTitle>
                <CardDescription>
                  Template notifikasi pembelian membership
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-membership">Nomor HP *</Label>
                    <Input
                      id="phone-membership"
                      placeholder="08123456789"
                      value={testData.phone}
                      onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name-membership">Nama *</Label>
                    <Input
                      id="name-membership"
                      placeholder="Nama pembeli"
                      value={testData.name}
                      onChange={(e) => setTestData({ ...testData, name: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => runTest('membership')}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Kirim Membership Notification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Expiry Reminder */}
          <TabsContent value="reminder" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Expiry Reminder</CardTitle>
                <CardDescription>
                  Template pengingat membership akan expired
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-reminder">Nomor HP *</Label>
                    <Input
                      id="phone-reminder"
                      placeholder="08123456789"
                      value={testData.phone}
                      onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name-reminder">Nama *</Label>
                    <Input
                      id="name-reminder"
                      placeholder="Nama member"
                      value={testData.name}
                      onChange={(e) => setTestData({ ...testData, name: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => runTest('reminder')}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Kirim Expiry Reminder
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Koneksi API</CardTitle>
            <CardDescription>
              Verifikasi koneksi ke Starsender API tanpa mengirim pesan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => runTest('connection')}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Test Koneksi
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Last Result */}
        {lastResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastResult.success && lastResult.result?.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Hasil Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
