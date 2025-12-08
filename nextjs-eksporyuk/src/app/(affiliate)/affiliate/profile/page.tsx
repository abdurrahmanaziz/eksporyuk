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
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${theme.primary}15` }}
        >
          <User className="w-6 h-6" style={{ color: theme.primary }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Affiliate</h1>
          <p className="text-gray-600">Kelola informasi dan pengaturan akun affiliate</p>
        </div>
      </div>

      {data && (
        <>
          {/* User Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Akun</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {data.user.avatar ? (
                  <img 
                    src={data.user.avatar} 
                    alt={data.user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {data.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-gray-900">{data.user.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {data.user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Affiliate Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Total Klik</p>
              <p className="text-3xl font-bold text-blue-600">{data.affiliate.totalClicks}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Total Konversi</p>
              <p className="text-3xl font-bold text-purple-600">{data.affiliate.totalConversions}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Total Penghasilan</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(data.affiliate.totalEarnings)}</p>
            </div>
          </div>

          {/* Affiliate Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-5 h-5" style={{ color: theme.primary }} />
              <h2 className="text-lg font-bold text-gray-900">Link Affiliate Anda</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Berikut adalah berbagai link yang bisa Anda gunakan untuk promosi
            </p>
            
            <div className="space-y-6">
              {/* Bio Page Link */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Link Bio Page</h3>
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Landing Page</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Halaman profil personal Anda seperti Linktree. Pengunjung bisa melihat bio dan memilih produk yang ingin dilihat.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.affiliate.bioPageUrl || '-'}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-white border border-purple-200 rounded-lg text-purple-700 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyBio}
                    disabled={!data.affiliate.bioPageUrl}
                    className="px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copiedBio ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedBio ? 'Tersalin' : 'Salin'}
                  </button>
                  <a
                    href={data.affiliate.bioPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Referral Link */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <LinkIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Link Referral Default</h3>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Homepage + Kode</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Link ke halaman utama dengan kode referral Anda. Untuk link ke produk spesifik, buat di menu <strong>Link Pendek</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.affiliate.referralUrl || '-'}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-white border border-blue-200 rounded-lg text-blue-700 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyReferral}
                    disabled={!data.affiliate.referralUrl}
                    className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copiedReferral ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedReferral ? 'Tersalin' : 'Salin'}
                  </button>
                  <a
                    href={data.affiliate.referralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Affiliate Code */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Kode Affiliate</h3>
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Tracking ID</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Kode unik untuk identifikasi referral Anda. Bisa ditambahkan ke URL apapun dengan parameter <code className="bg-gray-100 px-1 rounded">?ref=KODE</code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.affiliate.affiliateCode}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-white border border-green-200 rounded-lg text-green-700 font-mono text-sm font-bold tracking-wider"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    {copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedCode ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Tips Penggunaan:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li><strong>Bio Page</strong> - Cocok untuk link di bio Instagram/TikTok</li>
                    <li><strong>Link Referral Default</strong> - Link ke homepage dengan kode Anda</li>
                    <li><strong>Kode Affiliate</strong> - Tambahkan <code className="bg-amber-100 px-1 rounded">?ref=KODE</code> ke URL apapun</li>
                    <li><strong>Link Pendek</strong> - Buat link ke produk spesifik di menu <em>Link Pendek</em></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Account */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Informasi Rekening Bank</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Informasi ini digunakan untuk transfer komisi affiliate
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Bank <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Pemilik Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nama sesuai rekening bank"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Rekening <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="1234567890"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>

          {/* Account Status */}
          <div className={`rounded-2xl p-6 ${
            data.affiliate.isActive 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {data.affiliate.isActive ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-green-900">Akun Affiliate Aktif</h3>
                    <p className="text-sm text-green-700">
                      Anda dapat membuat link affiliate dan menerima komisi
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-900">Akun Affiliate Nonaktif</h3>
                    <p className="text-sm text-red-700">
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
