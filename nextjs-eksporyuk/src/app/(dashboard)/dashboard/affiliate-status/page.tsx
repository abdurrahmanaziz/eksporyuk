'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Clock,
  CheckCircle,
  XCircle,
  Share2,
  Loader2,
  ArrowRight,
  Bell,
  MessageCircle,
  RefreshCw,
  Info,
  AlertTriangle,
} from 'lucide-react'

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null

interface AffiliateStatusData {
  hasAffiliateProfile: boolean
  applicationStatus: ApplicationStatus
  affiliateCode: string | null
  isAffiliateActive: boolean
  submittedAt?: string
  rejectionNotes?: string
}

export default function AffiliateStatusPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [data, setData] = useState<AffiliateStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchStatus = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const res = await fetch('/api/user/affiliate-status')
      if (res.ok) {
        const result = await res.json()
        setData(result)
        
        // If approved and role is AFFILIATE, redirect to affiliate dashboard (except ADMIN)
        if (result.applicationStatus === 'APPROVED' && session?.user?.role === 'AFFILIATE' && session?.user?.role !== 'ADMIN') {
          router.push('/affiliate/dashboard')
        }
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchStatus()
    }
  }, [session])

  // Auto refresh every 30 seconds for pending status
  useEffect(() => {
    if (data?.applicationStatus === 'PENDING') {
      const interval = setInterval(() => {
        fetchStatus(true)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [data?.applicationStatus])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Memuat status...</p>
        </div>
      </div>
    )
  }

  // If no affiliate profile, redirect to apply page (except ADMIN)
  if (!data?.hasAffiliateProfile && session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Belum Terdaftar</h1>
            <p className="text-gray-600 mb-6">
              Anda belum mendaftar sebagai affiliate. Daftar sekarang untuk mulai mendapatkan komisi!
            </p>
            <Link
              href="/daftar-affiliate"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-medium"
            >
              Daftar Affiliate
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Admin Badge */}
        {session?.user?.role === 'ADMIN' && (
          <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 text-center">
            <span className="text-purple-800 font-semibold">👑 ADMIN MODE - Anda dapat melihat halaman ini untuk testing</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Status Aplikasi Affiliate</h1>
            <p className="text-gray-600">Pantau status pendaftaran affiliate Anda</p>
          </div>
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden ${
          data.applicationStatus === 'PENDING' 
            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
            : data.applicationStatus === 'REJECTED'
            ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
        }`}>
          <div className="p-8">
            {/* PENDING Status */}
            {data.applicationStatus === 'PENDING' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Clock className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-yellow-800 mb-2">Menunggu Persetujuan</h2>
                <p className="text-yellow-700 mb-6 max-w-md mx-auto">
                  Aplikasi affiliate Anda sedang direview oleh tim kami. 
                  Proses ini biasanya memakan waktu 1-2 hari kerja.
                </p>
                
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">Pendaftaran</span>
                  </div>
                  <div className="w-12 h-1 bg-yellow-300 rounded"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">Review</span>
                  </div>
                  <div className="w-12 h-1 bg-gray-200 rounded"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-400">Aktif</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 text-left">
                      Anda akan menerima <strong>notifikasi email</strong> dan <strong>notifikasi di aplikasi</strong> 
                      begitu aplikasi Anda disetujui atau jika ada informasi tambahan yang diperlukan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* REJECTED Status */}
            {data.applicationStatus === 'REJECTED' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-800 mb-2">Aplikasi Ditolak</h2>
                <p className="text-red-700 mb-6 max-w-md mx-auto">
                  Maaf, aplikasi affiliate Anda tidak dapat disetujui saat ini.
                </p>

                {data.rejectionNotes && (
                  <div className="bg-white rounded-xl p-4 max-w-md mx-auto mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 mb-1">Alasan:</p>
                        <p className="text-sm text-gray-600">{data.rejectionNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/contact"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Hubungi Admin
                  </Link>
                  <Link
                    href="/daftar-affiliate"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-medium"
                  >
                    Ajukan Ulang
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* APPROVED Status */}
            {data.applicationStatus === 'APPROVED' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 Selamat!</h2>
                <p className="text-green-700 mb-4">
                  Aplikasi affiliate Anda telah disetujui!
                </p>
                
                {data.affiliateCode && (
                  <div className="bg-white rounded-xl p-4 max-w-sm mx-auto mb-6">
                    <p className="text-sm text-gray-600 mb-2">Kode Affiliate Anda:</p>
                    <p className="text-2xl font-mono font-bold text-green-600">{data.affiliateCode}</p>
                  </div>
                )}

                <Link
                  href="/affiliate/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition font-medium"
                >
                  Buka Dashboard Affiliate
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards for PENDING */}
        {data.applicationStatus === 'PENDING' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Apa yang terjadi selanjutnya?</h3>
                  <p className="text-sm text-gray-600">
                    Tim kami akan mereview aplikasi Anda. Jika disetujui, Anda akan mendapatkan akses penuh 
                    ke dashboard affiliate, link promosi, dan marketing kit.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Butuh bantuan?</h3>
                  <p className="text-sm text-gray-600">
                    Jika Anda memiliki pertanyaan atau ingin mempercepat proses review, 
                    silakan hubungi tim support kami.
                  </p>
                  <Link href="/contact" className="text-sm text-purple-600 hover:underline mt-2 inline-block">
                    Hubungi Support →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What you can do while waiting */}
        {data.applicationStatus === 'PENDING' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">💡 Sambil menunggu, Anda bisa:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/courses" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group">
                <p className="font-medium text-gray-900 group-hover:text-orange-600">Pelajari Produk</p>
                <p className="text-sm text-gray-500">Kenali produk yang akan Anda promosikan</p>
              </Link>
              <Link href="/blog" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group">
                <p className="font-medium text-gray-900 group-hover:text-orange-600">Baca Tips Marketing</p>
                <p className="text-sm text-gray-500">Pelajari strategi promosi efektif</p>
              </Link>
              <Link href="/dashboard" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group">
                <p className="font-medium text-gray-900 group-hover:text-orange-600">Kembali ke Dashboard</p>
                <p className="text-sm text-gray-500">Lanjutkan aktivitas lain</p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
