'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Share2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Gift,
  Users,
  AlertTriangle,
} from 'lucide-react'

type ApplicationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

type AffiliateData = {
  affiliateMenuEnabled: boolean
  hasAffiliateProfile: boolean
  applicationStatus: ApplicationStatus | null
  affiliateCode: string | null
}

export default function ApplyAffiliatePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    whatsapp: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    motivation: '',
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch affiliate status
  const fetchAffiliateStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/user/affiliate-status')
      if (res.ok) {
        const data = await res.json()
        setAffiliateData(data)
        
        // If already approved, redirect to affiliate dashboard (except ADMIN)
        if (data.applicationStatus === 'APPROVED' && session?.user?.role !== 'ADMIN') {
          router.push('/affiliate/dashboard')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchAffiliateStatus()
      // Pre-fill whatsapp from session if available
      if (session.user.whatsapp) {
        setFormData(prev => ({ ...prev, whatsapp: session.user.whatsapp || '' }))
      }
    }
  }, [session])

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    // Validation
    if (!formData.whatsapp || !formData.bankName || !formData.bankAccountName || !formData.bankAccountNumber) {
      setError('Semua field wajib diisi')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengajukan aplikasi')
      }

      setSuccess('Aplikasi affiliate berhasil diajukan! Admin akan segera mereview.')
      fetchAffiliateStatus()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  // Check if user has permission to see this page (except ADMIN)
  if (!affiliateData?.affiliateMenuEnabled && session?.user?.role !== 'AFFILIATE' && session?.user?.role !== 'ADMIN') {
    return (
      <ResponsivePageWrapper>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Akses Terbatas</h2>
            <p className="text-yellow-700">
              Fitur affiliate belum diaktifkan untuk akun Anda. 
              Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Admin Badge */}
        {session?.user?.role === 'ADMIN' && (
          <div className="mb-4 bg-purple-100 border border-purple-300 rounded-lg p-3 text-center">
            <span className="text-purple-800 font-semibold">👑 ADMIN MODE - Anda dapat melihat halaman ini untuk testing</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Program Affiliate</h1>
          <p className="text-gray-600">Dapatkan komisi hingga 30% dari setiap penjualan!</p>
        </div>

        {/* Status Card - Show if already applied */}
        {affiliateData?.hasAffiliateProfile && (
          <div className={`mb-8 rounded-lg p-6 ${
            affiliateData.applicationStatus === 'PENDING' 
              ? 'bg-yellow-50 border border-yellow-200'
              : affiliateData.applicationStatus === 'REJECTED'
              ? 'bg-red-50 border border-red-200'
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-4">
              {affiliateData.applicationStatus === 'PENDING' && (
                <>
                  <Clock className="w-10 h-10 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Menunggu Persetujuan</h3>
                    <p className="text-yellow-700">
                      Aplikasi Anda sedang direview oleh admin. Anda akan menerima notifikasi setelah disetujui.
                    </p>
                  </div>
                </>
              )}
              {affiliateData.applicationStatus === 'REJECTED' && (
                <>
                  <XCircle className="w-10 h-10 text-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-800">Aplikasi Ditolak</h3>
                    <p className="text-red-700">
                      Maaf, aplikasi Anda tidak disetujui. Silakan hubungi admin untuk informasi lebih lanjut.
                    </p>
                  </div>
                </>
              )}
              {affiliateData.applicationStatus === 'APPROVED' && (
                <>
                  <CheckCircle className="w-10 h-10 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-green-800">Aplikasi Disetujui!</h3>
                    <p className="text-green-700">
                      Selamat! Anda sudah gabung Rich Affiliate. Kode: <span className="font-mono font-bold">{affiliateData.affiliateCode}</span>
                    </p>
                    <button
                      onClick={() => router.push('/affiliate/dashboard')}
                      className="mt-2 text-green-600 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      Buka Dashboard Affiliate <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Benefits Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Keuntungan Gabung Rich Affiliate</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Komisi Hingga 30%</h3>
                  <p className="text-sm text-gray-600">Dapatkan komisi dari setiap penjualan melalui link Anda</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tracking Real-time</h3>
                  <p className="text-sm text-gray-600">Pantau performa, klik, dan konversi secara real-time</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bonus & Challenge</h3>
                  <p className="text-sm text-gray-600">Ikuti challenge dan dapatkan bonus tambahan</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Marketing Kit</h3>
                  <p className="text-sm text-gray-600">Akses banner, copywriting, dan materi promosi siap pakai</p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          {!affiliateData?.hasAffiliateProfile && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Pendaftaran Affiliate</h2>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{typeof error === 'string' ? error : String(error)}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Untuk komunikasi dan notifikasi penjualan</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Bank <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih Bank</option>
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="BSI">BSI</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                    <option value="Permata">Permata</option>
                    <option value="Danamon">Danamon</option>
                    <option value="OCBC NISP">OCBC NISP</option>
                    <option value="Maybank">Maybank</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pemilik Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountName}
                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                    placeholder="Sesuai buku tabungan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivasi (Opsional)
                  </label>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    placeholder="Ceritakan mengapa Anda ingin gabung Rich Affiliate..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5" />
                      Ajukan Sebagai Affiliate
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Dengan mengajukan, Anda setuju dengan syarat dan ketentuan program affiliate.
                </p>
              </form>
            </div>
          )}

          {/* Show info if already applied but pending/rejected */}
          {affiliateData?.hasAffiliateProfile && affiliateData.applicationStatus !== 'APPROVED' && (
            <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
              <p className="text-gray-600 text-center">
                {affiliateData.applicationStatus === 'PENDING' 
                  ? 'Aplikasi Anda sedang dalam proses review. Mohon tunggu konfirmasi dari admin.'
                  : 'Anda dapat menghubungi admin untuk mengajukan kembali.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
