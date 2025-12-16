'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import {
  User,
  Mail,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Building2,
  CreditCard,
  Save,
  TrendingUp,
  ExternalLink,
  Globe,
  QrCode,
  Info,
} from 'lucide-react'

interface ProfileData {
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
    username: string | null
  }
  affiliate: {
    affiliateCode: string
    bioPageUrl: string
    referralUrl: string
    tier: number
    commissionRate: number
    totalClicks: number
    totalConversions: number
    totalEarnings: number
    isActive: boolean
  }
  bankAccount: {
    bankName: string
    accountName: string
    accountNumber: string
  } | null
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copiedBio, setCopiedBio] = useState(false)
  const [copiedReferral, setCopiedReferral] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [formData, setFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
  })

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/affiliate/profile')
      const result = await response.json()
      if (response.ok) {
        setData(result)
        if (result.bankAccount) {
          setFormData(result.bankAccount)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bankName || !formData.accountName || !formData.accountNumber) {
      alert('Semua field wajib diisi')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/affiliate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccount: formData,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('Profil berhasil disimpan!')
        fetchProfile()
      } else {
        alert(result.error || 'Gagal menyimpan profil')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyBio = () => {
    if (data?.affiliate.bioPageUrl) {
      navigator.clipboard.writeText(data.affiliate.bioPageUrl)
      setCopiedBio(true)
      setTimeout(() => setCopiedBio(false), 2000)
    }
  }

  const handleCopyReferral = () => {
    if (data?.affiliate.referralUrl) {
      navigator.clipboard.writeText(data.affiliate.referralUrl)
      setCopiedReferral(true)
      setTimeout(() => setCopiedReferral(false), 2000)
    }
  }

  const handleCopyCode = () => {
    if (data?.affiliate.affiliateCode) {
      navigator.clipboard.writeText(data.affiliate.affiliateCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div 
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${theme.primary}15` }}
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.primary }} />
        </div>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Profil Affiliate</h1>
          <p className="text-xs sm:text-sm text-gray-600">Kelola informasi dan pengaturan akun affiliate</p>
        </div>
      </div>

      {data && (
        <>
          {/* User Info */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Informasi Akun</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                {data.user.avatar ? (
                  <img 
                    src={data.user.avatar} 
                    alt={data.user.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {data.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm sm:text-lg font-bold text-gray-900">{data.user.name}</p>
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[180px] sm:max-w-none">{data.user.email}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Affiliate Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white rounded-lg sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Klik</p>
              <p className="text-xl sm:text-3xl font-bold text-blue-600">{data.affiliate.totalClicks}</p>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Konversi</p>
              <p className="text-xl sm:text-3xl font-bold text-purple-600">{data.affiliate.totalConversions}</p>
            </div>
            
            <div className="col-span-2 md:col-span-2 bg-white rounded-lg sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Penghasilan</p>
              <p className="text-lg sm:text-xl font-bold text-green-600">
                <span className="hidden sm:inline">{formatCurrency(data.affiliate.totalEarnings)}</span>
                <span className="sm:hidden">{data.affiliate.totalEarnings >= 1000000 ? `${(data.affiliate.totalEarnings / 1000000).toFixed(1)}jt` : formatCurrency(data.affiliate.totalEarnings)}</span>
              </p>
            </div>
          </div>

          {/* Affiliate Links */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: theme.primary }} />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Link Affiliate Anda</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
              Berikut adalah berbagai link yang bisa Anda gunakan untuk promosi
            </p>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Bio Page Link */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border border-purple-100">
                <div className="flex items-start gap-2 sm:gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">Link Bio Page</h3>
                      <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-purple-100 text-purple-700 rounded-full">Landing Page</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">
                      Halaman profil personal Anda seperti Linktree. Pengunjung bisa melihat bio dan memilih produk yang ingin dilihat.
                    </p>
                    <p className="text-xs text-gray-600 mt-1 sm:hidden">
                      Halaman profil seperti Linktree
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={data.affiliate.bioPageUrl || '-'}
                    readOnly
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-purple-200 rounded-lg text-purple-700 font-mono text-xs sm:text-sm truncate"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyBio}
                      disabled={!data.affiliate.bioPageUrl}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                      {copiedBio ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      {copiedBio ? 'Tersalin' : 'Salin'}
                    </button>
                    <a
                      href={data.affiliate.bioPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Referral Link */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl border border-blue-100">
                <div className="flex items-start gap-2 sm:gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">Link Referral Default</h3>
                      <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-blue-100 text-blue-700 rounded-full">Homepage + Kode</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">
                      Link ke halaman utama dengan kode referral Anda. Untuk link ke produk spesifik, buat di menu <strong>Link Pendek</strong>.
                    </p>
                    <p className="text-xs text-gray-600 mt-1 sm:hidden">
                      Link homepage dengan kode Anda
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={data.affiliate.referralUrl || '-'}
                    readOnly
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-blue-200 rounded-lg text-blue-700 font-mono text-xs sm:text-sm truncate"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyReferral}
                      disabled={!data.affiliate.referralUrl}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                      {copiedReferral ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      {copiedReferral ? 'Tersalin' : 'Salin'}
                    </button>
                    <a
                      href={data.affiliate.referralUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Affiliate Code */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-100">
                <div className="flex items-start gap-2 sm:gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">Kode Affiliate</h3>
                      <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-green-100 text-green-700 rounded-full">Tracking ID</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">
                      Kode unik untuk identifikasi referral Anda. Bisa ditambahkan ke URL apapun dengan parameter <code className="bg-gray-100 px-1 rounded">?ref=KODE</code>
                    </p>
                    <p className="text-xs text-gray-600 mt-1 sm:hidden">
                      Kode unik ID referral Anda
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.affiliate.affiliateCode}
                    readOnly
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-green-200 rounded-lg text-green-700 font-mono text-xs sm:text-sm font-bold tracking-wider"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    {copiedCode ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    {copiedCode ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-3 sm:p-4 bg-amber-50 rounded-lg sm:rounded-xl border border-amber-200 flex items-start gap-2 sm:gap-3">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-800">
                  <p className="font-medium mb-1">Tips Penggunaan:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li><strong>Bio Page</strong> - Cocok untuk link di bio IG/TikTok</li>
                    <li><strong>Link Referral</strong> - Link homepage dengan kode Anda</li>
                    <li><strong>Kode Affiliate</strong> - Tambahkan <code className="bg-amber-100 px-0.5 sm:px-1 rounded text-[10px] sm:text-xs">?ref=KODE</code> ke URL</li>
                    <li><strong>Link Pendek</strong> - Buat link produk spesifik</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Account */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Informasi Rekening Bank</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              Informasi ini digunakan untuk transfer komisi affiliate
            </p>

            <form onSubmit={handleSave} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Nama Bank <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                  required
                >
                  <option value="">Pilih Bank</option>
                  <option value="BCA">Bank Central Asia (BCA)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                  <option value="BNI">Bank Negara Indonesia (BNI)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Bank Permata</option>
                  <option value="Danamon">Bank Danamon</option>
                  <option value="BTN">Bank Tabungan Negara (BTN)</option>
                  <option value="OCBC NISP">OCBC NISP</option>
                  <option value="Maybank">Maybank Indonesia</option>
                  <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Nama Pemilik Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                  placeholder="Nama sesuai rekening bank"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Nomor Rekening <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 sm:left-4 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                    placeholder="1234567890"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>

          {/* Account Status */}
          <div className={`rounded-lg sm:rounded-2xl p-4 sm:p-6 ${
            data.affiliate.isActive 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 sm:gap-3">
              {data.affiliate.isActive ? (
                <>
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-green-900">Akun Affiliate Aktif</h3>
                    <p className="text-xs sm:text-sm text-green-700">
                      Anda dapat membuat link affiliate dan menerima komisi
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-red-900">Akun Affiliate Nonaktif</h3>
                    <p className="text-xs sm:text-sm text-red-700">
                      Silakan hubungi admin untuk mengaktifkan kembali akun Anda
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
