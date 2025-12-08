'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  Settings, 
  Users, 
  Share2, 
  MessageSquare, 
  Bell, 
  GraduationCap,
  Truck,
  ShoppingCart,
  Crown,
  User,
  BookOpen,
  Loader2,
  Save,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface PlatformSettings {
  // Global Features
  featureGroupEnabled: boolean
  featureFeedEnabled: boolean
  featureCommentEnabled: boolean
  featureLikeEnabled: boolean
  featureShareEnabled: boolean
  featureChatEnabled: boolean
  featureNotificationEnabled: boolean
  
  // Affiliate Features
  featureAffiliateEnabled: boolean
  featureAffiliateShortLink: boolean
  featureAffiliateLeaderboard: boolean
  featureAffiliateChallenge: boolean
  featureAffiliateTraining: boolean
  featureAffiliateReward: boolean
  featureAffiliateWithdraw: boolean
  featureAffiliateStatistics: boolean
  featureAffiliateMarketingKit: boolean
  
  // Course Features
  featureCourseEnabled: boolean
  featureCourseEnrollment: boolean
  featureCourseCertificate: boolean
  featureCourseProgress: boolean
  featureCourseQuiz: boolean
  
  // Supplier Features
  featureSupplierEnabled: boolean
  featureSupplierCatalog: boolean
  featureSupplierSampleRequest: boolean
  featureSupplierDirectOrder: boolean
  
  // Transaction Features
  featureCheckoutEnabled: boolean
  featureCouponEnabled: boolean
  featureFlashSaleEnabled: boolean
  
  // Member Premium Features
  featureMemberPremiumClass: boolean
  featureMemberPremiumGroup: boolean
  featureMemberPremiumSupplier: boolean
  featureMemberPremiumDownload: boolean
  featureMemberPremiumCertificate: boolean
  
  // Member Free Features
  featureMemberFreeClass: boolean
  featureMemberFreeGroup: boolean
  featureMemberFreeCatalog: boolean
  
  // Mentor Features
  featureMentorCreateCourse: boolean
  featureMentorCreateMaterial: boolean
  featureMentorCreateGroup: boolean
  featureMentorEditCourse: boolean
  featureMentorAnalytics: boolean
  featureMentorManageStudents: boolean
  
  // Notification Channels
  notificationEmailEnabled: boolean
  notificationWhatsappEnabled: boolean
  notificationPushEnabled: boolean
  notificationInAppEnabled: boolean
}

// Default settings
const defaultSettings: PlatformSettings = {
  featureGroupEnabled: true,
  featureFeedEnabled: true,
  featureCommentEnabled: true,
  featureLikeEnabled: true,
  featureShareEnabled: true,
  featureChatEnabled: true,
  featureNotificationEnabled: true,
  featureAffiliateEnabled: true,
  featureAffiliateShortLink: true,
  featureAffiliateLeaderboard: true,
  featureAffiliateChallenge: true,
  featureAffiliateTraining: true,
  featureAffiliateReward: true,
  featureAffiliateWithdraw: true,
  featureAffiliateStatistics: true,
  featureAffiliateMarketingKit: true,
  featureCourseEnabled: true,
  featureCourseEnrollment: true,
  featureCourseCertificate: true,
  featureCourseProgress: true,
  featureCourseQuiz: true,
  featureSupplierEnabled: true,
  featureSupplierCatalog: true,
  featureSupplierSampleRequest: true,
  featureSupplierDirectOrder: true,
  featureCheckoutEnabled: true,
  featureCouponEnabled: true,
  featureFlashSaleEnabled: true,
  featureMemberPremiumClass: true,
  featureMemberPremiumGroup: true,
  featureMemberPremiumSupplier: true,
  featureMemberPremiumDownload: true,
  featureMemberPremiumCertificate: true,
  featureMemberFreeClass: true,
  featureMemberFreeGroup: true,
  featureMemberFreeCatalog: true,
  featureMentorCreateCourse: true,
  featureMentorCreateMaterial: true,
  featureMentorCreateGroup: true,
  featureMentorEditCourse: true,
  featureMentorAnalytics: true,
  featureMentorManageStudents: true,
  notificationEmailEnabled: true,
  notificationWhatsappEnabled: true,
  notificationPushEnabled: true,
  notificationInAppEnabled: true,
}

// Tab definitions
const tabs = [
  { id: 'global', name: 'Fitur Global', icon: Settings },
  { id: 'affiliate', name: 'Affiliate', icon: Share2 },
  { id: 'member-premium', name: 'Member Premium', icon: Crown },
  { id: 'member-free', name: 'Member Free', icon: User },
  { id: 'mentor', name: 'Mentor', icon: GraduationCap },
  { id: 'course', name: 'Kelas', icon: BookOpen },
  { id: 'supplier', name: 'Supplier', icon: Truck },
  { id: 'transaction', name: 'Transaksi', icon: ShoppingCart },
  { id: 'notification', name: 'Notifikasi', icon: Bell },
]

// Toggle Switch Component
function ToggleSwitch({ 
  enabled, 
  onChange, 
  label,
  description 
}: { 
  enabled: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

// Feature Group Component
function FeatureGroup({ 
  title, 
  icon: Icon,
  children 
}: { 
  title: string
  icon: any
  children: React.ReactNode 
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

export default function PlatformSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('global')
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings>(defaultSettings)

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Load settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings/platform')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
          setOriginalSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
    setHasChanges(changed)
  }, [settings, originalSettings])

  // Update single setting
  const updateSetting = (key: keyof PlatformSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Save settings
  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings/platform', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setOriginalSettings(settings)
        setHasChanges(false)
        toast.success('Pengaturan berhasil disimpan')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(defaultSettings)
    toast.info('Reset ke pengaturan default. Klik Simpan untuk menyimpan.')
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'global':
        return (
          <div className="space-y-6">
            <FeatureGroup title="Fitur Komunitas" icon={MessageSquare}>
              <ToggleSwitch
                enabled={settings.featureGroupEnabled}
                onChange={(v) => updateSetting('featureGroupEnabled', v)}
                label="Grup Komunitas"
                description="Aktifkan fitur grup untuk semua pengguna"
              />
              <ToggleSwitch
                enabled={settings.featureFeedEnabled}
                onChange={(v) => updateSetting('featureFeedEnabled', v)}
                label="Feed & Posting"
                description="Aktifkan fitur posting dan feed"
              />
              <ToggleSwitch
                enabled={settings.featureCommentEnabled}
                onChange={(v) => updateSetting('featureCommentEnabled', v)}
                label="Komentar"
                description="Aktifkan fitur komentar pada postingan"
              />
              <ToggleSwitch
                enabled={settings.featureLikeEnabled}
                onChange={(v) => updateSetting('featureLikeEnabled', v)}
                label="Like / Reaksi"
                description="Aktifkan fitur like dan reaksi"
              />
              <ToggleSwitch
                enabled={settings.featureShareEnabled}
                onChange={(v) => updateSetting('featureShareEnabled', v)}
                label="Share / Bagikan"
                description="Aktifkan fitur berbagi postingan"
              />
            </FeatureGroup>

            <FeatureGroup title="Fitur Komunikasi" icon={MessageSquare}>
              <ToggleSwitch
                enabled={settings.featureChatEnabled}
                onChange={(v) => updateSetting('featureChatEnabled', v)}
                label="Chat & Pesan"
                description="Aktifkan fitur chat antar pengguna"
              />
              <ToggleSwitch
                enabled={settings.featureNotificationEnabled}
                onChange={(v) => updateSetting('featureNotificationEnabled', v)}
                label="Notifikasi"
                description="Aktifkan sistem notifikasi"
              />
            </FeatureGroup>
          </div>
        )

      case 'affiliate':
        return (
          <div className="space-y-6">
            <FeatureGroup title="Fitur Utama Affiliate" icon={Share2}>
              <ToggleSwitch
                enabled={settings.featureAffiliateEnabled}
                onChange={(v) => updateSetting('featureAffiliateEnabled', v)}
                label="Sistem Affiliate"
                description="Aktifkan/nonaktifkan seluruh sistem affiliate"
              />
              <ToggleSwitch
                enabled={settings.featureAffiliateShortLink}
                onChange={(v) => updateSetting('featureAffiliateShortLink', v)}
                label="Short Link Generator"
                description="Affiliate dapat membuat short link"
              />
              <ToggleSwitch
                enabled={settings.featureAffiliateStatistics}
                onChange={(v) => updateSetting('featureAffiliateStatistics', v)}
                label="Statistik & Dashboard"
                description="Affiliate dapat melihat statistik penjualan"
              />
            </FeatureGroup>

            <FeatureGroup title="Gamifikasi Affiliate" icon={Share2}>
              <ToggleSwitch
                enabled={settings.featureAffiliateLeaderboard}
                onChange={(v) => updateSetting('featureAffiliateLeaderboard', v)}
                label="Leaderboard"
                description="Tampilkan peringkat affiliate"
              />
              <ToggleSwitch
                enabled={settings.featureAffiliateChallenge}
                onChange={(v) => updateSetting('featureAffiliateChallenge', v)}
                label="Challenge"
                description="Affiliate dapat mengikuti challenge"
              />
              <ToggleSwitch
                enabled={settings.featureAffiliateReward}
                onChange={(v) => updateSetting('featureAffiliateReward', v)}
                label="Reward System"
                description="Sistem reward untuk affiliate"
              />
            </FeatureGroup>

            <FeatureGroup title="Resource Affiliate" icon={Share2}>
              <ToggleSwitch
                enabled={settings.featureAffiliateTraining}
                onChange={(v) => updateSetting('featureAffiliateTraining', v)}
                label="Training Center"
                description="Akses materi training untuk affiliate"
              />
              <ToggleSwitch
                enabled={settings.featureAffiliateMarketingKit}
                onChange={(v) => updateSetting('featureAffiliateMarketingKit', v)}
                label="Marketing Kit"
                description="Akses marketing kit (banner, copywriting)"
              />
              <ToggleSwitch
                enabled={settings.featureAffiliateWithdraw}
                onChange={(v) => updateSetting('featureAffiliateWithdraw', v)}
                label="Penarikan Komisi"
                description="Affiliate dapat request penarikan"
              />
            </FeatureGroup>
          </div>
        )

      case 'member-premium':
        return (
          <div className="space-y-6">
            <FeatureGroup title="Akses Member Premium" icon={Crown}>
              <ToggleSwitch
                enabled={settings.featureMemberPremiumClass}
                onChange={(v) => updateSetting('featureMemberPremiumClass', v)}
                label="Akses Kelas Premium"
                description="Member premium dapat akses semua kelas"
              />
              <ToggleSwitch
                enabled={settings.featureMemberPremiumGroup}
                onChange={(v) => updateSetting('featureMemberPremiumGroup', v)}
                label="Akses Grup VIP"
                description="Member premium dapat akses grup eksklusif"
              />
              <ToggleSwitch
                enabled={settings.featureMemberPremiumSupplier}
                onChange={(v) => updateSetting('featureMemberPremiumSupplier', v)}
                label="Akses Database Supplier"
                description="Member premium dapat akses database supplier"
              />
              <ToggleSwitch
                enabled={settings.featureMemberPremiumDownload}
                onChange={(v) => updateSetting('featureMemberPremiumDownload', v)}
                label="Download Materi"
                description="Member premium dapat download materi"
              />
              <ToggleSwitch
                enabled={settings.featureMemberPremiumCertificate}
                onChange={(v) => updateSetting('featureMemberPremiumCertificate', v)}
                label="Sertifikat"
                description="Member premium dapat mendapatkan sertifikat"
              />
            </FeatureGroup>
          </div>
        )

      case 'member-free':
        return (
          <div className="space-y-6">
            <FeatureGroup title="Akses Member Free" icon={User}>
              <ToggleSwitch
                enabled={settings.featureMemberFreeClass}
                onChange={(v) => updateSetting('featureMemberFreeClass', v)}
                label="Akses Kelas Gratis"
                description="Member free dapat akses kelas gratis"
              />
              <ToggleSwitch
                enabled={settings.featureMemberFreeGroup}
                onChange={(v) => updateSetting('featureMemberFreeGroup', v)}
                label="Akses Grup Publik"
                description="Member free dapat akses grup publik"
              />
              <ToggleSwitch
                enabled={settings.featureMemberFreeCatalog}
                onChange={(v) => updateSetting('featureMemberFreeCatalog', v)}
                label="Lihat Katalog Supplier"
                description="Member free dapat melihat katalog (tanpa kontak)"
              />
            </FeatureGroup>
          </div>
        )

      case 'mentor':
        return (
          <div className="space-y-6">
            <FeatureGroup title="Kemampuan Mentor" icon={GraduationCap}>
              <ToggleSwitch
                enabled={settings.featureMentorCreateCourse}
                onChange={(v) => updateSetting('featureMentorCreateCourse', v)}
                label="Buat Kelas"
                description="Mentor dapat membuat kelas baru"
              />
              <ToggleSwitch
                enabled={settings.featureMentorCreateMaterial}
                onChange={(v) => updateSetting('featureMentorCreateMaterial', v)}
                label="Buat Materi"
                description="Mentor dapat membuat materi pembelajaran"
              />
              <ToggleSwitch
                enabled={settings.featureMentorCreateGroup}
                onChange={(v) => updateSetting('featureMentorCreateGroup', v)}
                label="Buat Grup"
                description="Mentor dapat membuat grup komunitas"
              />
              <ToggleSwitch
                enabled={settings.featureMentorEditCourse}
                onChange={(v) => updateSetting('featureMentorEditCourse', v)}
                label="Edit Kelas Sendiri"
                description="Mentor dapat mengedit kelas yang dibuatnya"
              />
              <ToggleSwitch
                enabled={settings.featureMentorAnalytics}
                onChange={(v) => updateSetting('featureMentorAnalytics', v)}
                label="Lihat Analitik"
                description="Mentor dapat melihat statistik kelasnya"
              />
              <ToggleSwitch
                enabled={settings.featureMentorManageStudents}
                onChange={(v) => updateSetting('featureMentorManageStudents', v)}
                label="Kelola Siswa"
                description="Mentor dapat mengelola siswa yang terdaftar"
              />
            </FeatureGroup>
          </div>
        )

      case 'course':
        return (
          <div className="space-y-6">
            <FeatureGroup title="Fitur Kelas" icon={BookOpen}>
              <ToggleSwitch
                enabled={settings.featureCourseEnabled}
                onChange={(v) => updateSetting('featureCourseEnabled', v)}
                label="Sistem Kelas"
                description="Aktifkan/nonaktifkan seluruh sistem kelas"
              />
              <ToggleSwitch
                enabled={settings.featureCourseEnrollment}
                onChange={(v) => updateSetting('featureCourseEnrollment', v)}
                label="Pendaftaran Kelas"
                description="Pengguna dapat mendaftar ke kelas"
              />
              <ToggleSwitch
                enabled={settings.featureCourseProgress}
                onChange={(v) => updateSetting('featureCourseProgress', v)}
                label="Progress Tracking"
                description="Lacak progress belajar pengguna"
              />
              <ToggleSwitch
                enabled={settings.featureCourseQuiz}
                onChange={(v) => updateSetting('featureCourseQuiz', v)}
                label="Quiz & Ujian"
                description="Aktifkan fitur quiz di kelas"
              />
              <ToggleSwitch
                enabled={settings.featureCourseCertificate}
                onChange={(v) => updateSetting('featureCourseCertificate', v)}
                label="Sertifikat Kelulusan"
                description="Generate sertifikat setelah menyelesaikan kelas"
              />
            </FeatureGroup>
          </div>
        )

      case 'supplier':
        return (
          <div className="space-y-6">
            <FeatureGroup title="Fitur Supplier" icon={Truck}>
              <ToggleSwitch
                enabled={settings.featureSupplierEnabled}
                onChange={(v) => updateSetting('featureSupplierEnabled', v)}
                label="Sistem Supplier"
                description="Aktifkan/nonaktifkan seluruh sistem supplier"
              />
              <ToggleSwitch
                enabled={settings.featureSupplierCatalog}
                onChange={(v) => updateSetting('featureSupplierCatalog', v)}
                label="Katalog Supplier"
                description="Tampilkan katalog supplier"
              />
              <ToggleSwitch
                enabled={settings.featureSupplierSampleRequest}
                onChange={(v) => updateSetting('featureSupplierSampleRequest', v)}
                label="Request Sample"
                description="Pengguna dapat request sample produk"
              />
              <ToggleSwitch
                enabled={settings.featureSupplierDirectOrder}
                onChange={(v) => updateSetting('featureSupplierDirectOrder', v)}
                label="Direct Order"
                description="Pengguna dapat order langsung dari supplier"
              />
            </FeatureGroup>
          </div>
        )

      case 'transaction':
        return (
          <div className="space-y-6">
            <FeatureGroup title="Fitur Transaksi" icon={ShoppingCart}>
              <ToggleSwitch
                enabled={settings.featureCheckoutEnabled}
                onChange={(v) => updateSetting('featureCheckoutEnabled', v)}
                label="Sistem Checkout"
                description="Aktifkan/nonaktifkan proses checkout"
              />
              <ToggleSwitch
                enabled={settings.featureCouponEnabled}
                onChange={(v) => updateSetting('featureCouponEnabled', v)}
                label="Kupon & Diskon"
                description="Pengguna dapat menggunakan kupon"
              />
              <ToggleSwitch
                enabled={settings.featureFlashSaleEnabled}
                onChange={(v) => updateSetting('featureFlashSaleEnabled', v)}
                label="Flash Sale"
                description="Aktifkan fitur flash sale"
              />
            </FeatureGroup>
          </div>
        )

      case 'notification':
        return (
          <div className="space-y-6">
            <FeatureGroup title="Channel Notifikasi" icon={Bell}>
              <ToggleSwitch
                enabled={settings.notificationEmailEnabled}
                onChange={(v) => updateSetting('notificationEmailEnabled', v)}
                label="Email"
                description="Kirim notifikasi via email"
              />
              <ToggleSwitch
                enabled={settings.notificationWhatsappEnabled}
                onChange={(v) => updateSetting('notificationWhatsappEnabled', v)}
                label="WhatsApp"
                description="Kirim notifikasi via WhatsApp"
              />
              <ToggleSwitch
                enabled={settings.notificationPushEnabled}
                onChange={(v) => updateSetting('notificationPushEnabled', v)}
                label="Push Notification"
                description="Kirim push notification ke browser/mobile"
              />
              <ToggleSwitch
                enabled={settings.notificationInAppEnabled}
                onChange={(v) => updateSetting('notificationInAppEnabled', v)}
                label="In-App Notification"
                description="Tampilkan notifikasi di dalam aplikasi"
              />
            </FeatureGroup>
          </div>
        )

      default:
        return null
    }
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="h-7 w-7 text-blue-600" />
                Pengaturan Platform
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Kontrol fitur-fitur platform untuk setiap role pengguna
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Default
              </button>
              <button
                onClick={saveSettings}
                disabled={saving || !hasChanges}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${
                  hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Pengaturan
              </button>
            </div>
          </div>

          {/* Change indicator */}
          {hasChanges && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <XCircle className="h-4 w-4" />
              Ada perubahan yang belum disimpan
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            ℹ️ Informasi Pengaturan
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Pengaturan ini berlaku untuk seluruh platform</li>
            <li>• Menonaktifkan fitur akan menyembunyikan menu dan akses terkait</li>
            <li>• Perubahan akan langsung berlaku setelah disimpan</li>
            <li>• Gunakan "Reset Default" untuk mengembalikan ke pengaturan awal</li>
          </ul>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
