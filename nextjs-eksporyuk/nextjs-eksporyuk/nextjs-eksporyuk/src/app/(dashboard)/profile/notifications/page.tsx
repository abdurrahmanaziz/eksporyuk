'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  ArrowLeft,
  Shield,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

declare global {
  interface Window {
    OneSignal?: any
  }
}

interface NotificationPreferences {
  // Channels
  emailEnabled: boolean
  pushEnabled: boolean
  whatsappEnabled: boolean
  inAppEnabled: boolean
  
  // Notification Types
  chatMessages: boolean
  transactionUpdates: boolean
  courseUpdates: boolean
  communityActivity: boolean
  affiliateUpdates: boolean
  promotions: boolean
  systemAnnouncements: boolean
  
  // Timing
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  
  // OneSignal status
  oneSignalSubscribed: boolean
}

export default function NotificationPreferencesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [oneSignalStatus, setOneSignalStatus] = useState<'checking' | 'subscribed' | 'not-subscribed' | 'blocked'>('checking')

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    whatsappEnabled: false,
    inAppEnabled: true,
    
    chatMessages: true,
    transactionUpdates: true,
    courseUpdates: true,
    communityActivity: true,
    affiliateUpdates: true,
    promotions: false,
    systemAnnouncements: true,
    
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    
    oneSignalSubscribed: false
  })

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission)
    }

    // Check OneSignal subscription status
    const checkOneSignal = async () => {
      if (window.OneSignal) {
        try {
          const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn
          setOneSignalStatus(isSubscribed ? 'subscribed' : 'not-subscribed')
          setPreferences(prev => ({ ...prev, oneSignalSubscribed: isSubscribed }))
        } catch {
          setOneSignalStatus('not-subscribed')
        }
      } else {
        // Wait for OneSignal to load
        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          if (window.OneSignal) {
            clearInterval(interval)
            try {
              const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn
              setOneSignalStatus(isSubscribed ? 'subscribed' : 'not-subscribed')
              setPreferences(prev => ({ ...prev, oneSignalSubscribed: isSubscribed }))
            } catch {
              setOneSignalStatus('not-subscribed')
            }
          } else if (attempts >= 10) {
            clearInterval(interval)
            setOneSignalStatus('not-subscribed')
          }
        }, 500)
      }
    }

    checkOneSignal()
  }, [])

  // Fetch preferences
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }

    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/users/notification-preferences')
        if (res.ok) {
          const data = await res.json()
          if (data.preferences) {
            setPreferences(prev => ({ ...prev, ...data.preferences }))
          }
        }
      } catch (error) {
        console.error('Error fetching preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [session, status, router])

  const handleSubscribePush = async () => {
    if (!window.OneSignal) {
      toast.error('Push notification tidak tersedia')
      return
    }

    try {
      const permission = await window.OneSignal.Notifications.requestPermission()
      if (permission) {
        setOneSignalStatus('subscribed')
        setPreferences(prev => ({ ...prev, oneSignalSubscribed: true, pushEnabled: true }))
        setPushPermission('granted')
        toast.success('Push notification berhasil diaktifkan!')
      } else {
        setPushPermission('denied')
        toast.error('Izin push notification ditolak')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      toast.error('Gagal mengaktifkan push notification')
    }
  }

  const handleUnsubscribePush = async () => {
    if (!window.OneSignal) return

    try {
      await window.OneSignal.User.PushSubscription.optOut()
      setOneSignalStatus('not-subscribed')
      setPreferences(prev => ({ ...prev, oneSignalSubscribed: false, pushEnabled: false }))
      toast.success('Push notification dinonaktifkan')
    } catch (error) {
      console.error('Error unsubscribing:', error)
      toast.error('Gagal menonaktifkan push notification')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save notification preferences
      const prefRes = await fetch('/api/users/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      })

      if (!prefRes.ok) {
        throw new Error('Failed to save preferences')
      }

      // Save GDPR consent
      const consentRes = await fetch('/api/users/notification-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentGiven: preferences.emailEnabled || preferences.pushEnabled || preferences.whatsappEnabled,
          channels: {
            email: preferences.emailEnabled,
            push: preferences.pushEnabled,
            sms: preferences.whatsappEnabled,
            inapp: preferences.inAppEnabled
          },
          purpose: 'marketing'
        })
      })

      if (!consentRes.ok) {
        console.warn('Warning: Consent tracking failed, but preferences saved')
      }

      toast.success('Preferensi notifikasi berhasil disimpan')
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Gagal menyimpan preferensi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="w-full py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Pengaturan Notifikasi
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola cara Anda menerima notifikasi
          </p>
        </div>
      </div>

      {/* Push Notification Status Card */}
      <Card className={pushPermission === 'denied' ? 'border-destructive' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push Notification
              </CardTitle>
              <CardDescription>
                Terima notifikasi langsung ke perangkat Anda
              </CardDescription>
            </div>
            {oneSignalStatus === 'subscribed' ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Aktif
              </Badge>
            ) : pushPermission === 'denied' ? (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Diblokir
              </Badge>
            ) : (
              <Badge variant="secondary">Tidak Aktif</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pushPermission === 'denied' ? (
            <div className="text-sm text-muted-foreground">
              <p className="text-destructive mb-2">
                Push notification diblokir di browser Anda.
              </p>
              <p>
                Untuk mengaktifkan kembali, buka pengaturan browser dan izinkan
                notifikasi untuk website ini.
              </p>
            </div>
          ) : oneSignalStatus === 'subscribed' ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Anda akan menerima notifikasi meskipun tidak sedang membuka website.
              </p>
              <Button variant="outline" size="sm" onClick={handleUnsubscribePush}>
                <VolumeX className="h-4 w-4 mr-2" />
                Nonaktifkan
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Aktifkan untuk menerima notifikasi penting secara real-time.
              </p>
              <Button size="sm" onClick={handleSubscribePush}>
                <Volume2 className="h-4 w-4 mr-2" />
                Aktifkan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Channel Notifikasi</CardTitle>
          <CardDescription>
            Pilih channel mana yang ingin Anda gunakan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <Label className="font-medium">In-App Notification</Label>
                <p className="text-xs text-muted-foreground">
                  Notifikasi saat Anda membuka website (Pusher)
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.inAppEnabled}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, inAppEnabled: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Bell className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <Label className="font-medium">Push Notification</Label>
                <p className="text-xs text-muted-foreground">
                  Notifikasi browser (OneSignal)
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.pushEnabled && oneSignalStatus === 'subscribed'}
              disabled={oneSignalStatus !== 'subscribed'}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, pushEnabled: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Mail className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <Label className="font-medium">Email</Label>
                <p className="text-xs text-muted-foreground">
                  Notifikasi via email
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, emailEnabled: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <Label className="font-medium">WhatsApp</Label>
                <p className="text-xs text-muted-foreground">
                  Notifikasi via WhatsApp
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.whatsappEnabled}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, whatsappEnabled: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jenis Notifikasi</CardTitle>
          <CardDescription>
            Pilih notifikasi apa yang ingin Anda terima
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Pesan Chat</Label>
              <p className="text-xs text-muted-foreground">
                Pesan baru dari user lain
              </p>
            </div>
            <Switch
              checked={preferences.chatMessages}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, chatMessages: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Update Transaksi</Label>
              <p className="text-xs text-muted-foreground">
                Status pembayaran, invoice, dll
              </p>
            </div>
            <Switch
              checked={preferences.transactionUpdates}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, transactionUpdates: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Update Kursus</Label>
              <p className="text-xs text-muted-foreground">
                Materi baru, pengumuman kelas
              </p>
            </div>
            <Switch
              checked={preferences.courseUpdates}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, courseUpdates: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Aktivitas Komunitas</Label>
              <p className="text-xs text-muted-foreground">
                Post baru, komentar, likes
              </p>
            </div>
            <Switch
              checked={preferences.communityActivity}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, communityActivity: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Update Affiliate</Label>
              <p className="text-xs text-muted-foreground">
                Komisi baru, performa link
              </p>
            </div>
            <Switch
              checked={preferences.affiliateUpdates}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, affiliateUpdates: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Promosi & Penawaran</Label>
              <p className="text-xs text-muted-foreground">
                Diskon, event spesial
              </p>
            </div>
            <Switch
              checked={preferences.promotions}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, promotions: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Pengumuman Sistem</Label>
              <p className="text-xs text-muted-foreground">
                Update penting dari admin
              </p>
            </div>
            <Switch
              checked={preferences.systemAnnouncements}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, systemAnnouncements: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jam Tenang</CardTitle>
          <CardDescription>
            Nonaktifkan notifikasi pada waktu tertentu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Aktifkan Jam Tenang</Label>
              <p className="text-xs text-muted-foreground">
                Tidak ada notifikasi pada jam yang ditentukan
              </p>
            </div>
            <Switch
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, quietHoursEnabled: checked }))
              }
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="flex gap-4 pt-2">
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground mb-2 block">Mulai</Label>
                <Select
                  value={preferences.quietHoursStart}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, quietHoursStart: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                        {`${i.toString().padStart(2, '0')}:00`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground mb-2 block">Selesai</Label>
                <Select
                  value={preferences.quietHoursEnd}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, quietHoursEnd: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                        {`${i.toString().padStart(2, '0')}:00`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GDPR Compliance Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Privasi & Kepatuhan GDPR
          </CardTitle>
          <CardDescription>
            Kami menghormati privasi Anda dan mematuhi regulasi perlindungan data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-3">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Data Terenkripsi</p>
                <p className="text-muted-foreground">Semua data notifikasi dienkripsi dan disimpan dengan aman</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Penghapusan Otomatis</p>
                <p className="text-muted-foreground">Riwayat notifikasi dihapus secara otomatis setelah 90 hari</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Hak Anda</p>
                <p className="text-muted-foreground">Anda bisa mengubah preferensi kapan saja atau menghapus data Anda</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 text-sm border border-blue-200 dark:border-blue-800">
            <p className="text-muted-foreground">
              Dengan menyimpan preferensi ini, Anda setuju kami menggunakan data notifikasi Anda sesuai dengan Kebijakan Privasi kami. 
              <a href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium ml-1">
                Pelajari lebih lanjut →
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Simpan Preferensi
            </>
          )}
        </Button>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
