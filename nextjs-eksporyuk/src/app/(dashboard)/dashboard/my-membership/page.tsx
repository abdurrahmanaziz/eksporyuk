'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { getRoleTheme } from '@/lib/role-themes'
import Link from 'next/link'
import {
  Crown,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users,
  BookOpen,
  Package,
  Gift,
  RefreshCw,
  History,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

type UserMembership = {
  id: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  isActive: boolean
  startDate: string
  endDate: string | null
  price: number
  membership: {
    id: string
    name: string
    slug: string
    checkoutSlug: string
    price: number
    duration: string
    description: string | null
    benefits: string[]
    groups: Array<{
      id: string
      name: string
    }>
    courses: Array<{
      id: string
      title: string
    }>
    products: Array<{
      id: string
      name: string
    }>
  }
  transaction?: {
    id: string
    createdAt: string
    amount: number
    status: string
  }
}

type Transaction = {
  id: string
  type: 'MEMBERSHIP' | 'COURSE' | 'PRODUCT'
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'EXPIRED'
  amount: number
  createdAt: string
  membership?: {
    name: string
  }
}

export default function MyMembershipPage() {
  const { data: session, status } = useSession()
  const [membership, setMembership] = useState<UserMembership | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('MEMBER_FREE')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMembershipData()
    }
  }, [status])

  const fetchMembershipData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current membership
      const membershipRes = await fetch('/api/user/membership')
      const membershipData = await membershipRes.json()

      if (membershipRes.ok && membershipData.membership) {
        setMembership(membershipData.membership)
      } else {
        setMembership(null)
      }

      // Fetch membership transaction history
      const transactionsRes = await fetch('/api/user/membership/transactions')
      const transactionsData = await transactionsRes.json()

      if (transactionsRes.ok && transactionsData.transactions) {
        setTransactions(transactionsData.transactions)
      }
    } catch (err) {
      console.error('Error fetching membership:', err)
      setError('Gagal memuat data membership')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Selamanya'
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'ACTIVE' && isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          Aktif
        </span>
      )
    } else if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
          <XCircle className="w-4 h-4" />
          Expired
        </span>
      )
    } else if (status === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
          <XCircle className="w-4 h-4" />
          Dibatalkan
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
        <AlertCircle className="w-4 h-4" />
        Menunggu
      </span>
    )
  }

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      'ONE_MONTH': '1 Bulan',
      'THREE_MONTHS': '3 Bulan',
      'SIX_MONTHS': '6 Bulan',
      'TWELVE_MONTHS': '12 Bulan',
      'LIFETIME': 'Selamanya',
    }
    return labels[duration] || duration
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat data membership...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{typeof error === 'string' ? error : String(error)}</p>
          <button
            onClick={fetchMembershipData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  // No Active Membership State
  if (!membership) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Membership Saya</h1>
            <p className="text-gray-600 mt-1">Kelola membership dan akses premium Anda</p>
          </div>
        </div>

        {/* No Membership Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-dashed border-gray-300">
          <div className="text-center max-w-md mx-auto">
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: theme.primary + '20' }}
            >
              <Crown className="w-10 h-10" style={{ color: theme.primary }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Membership Aktif</h2>
            <p className="text-gray-600 mb-6">
              Upgrade ke membership premium untuk akses penuh ke semua fitur, kursus, dan benefit eksklusif.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: theme.primary }}
            >
              <Sparkles className="w-5 h-5" />
              Lihat Paket Membership
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h2>
              <History className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {tx.membership?.name || 'Transaksi Membership'}
                    </p>
                    <p className="text-sm text-gray-600">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(tx.amount)}</p>
                    <span className={`text-xs font-medium ${
                      tx.status === 'SUCCESS' ? 'text-green-600' :
                      tx.status === 'PENDING' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Active Membership State
  const daysRemaining = getDaysRemaining(membership.endDate)
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7

  return (
    <ResponsivePageWrapper>
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Membership Saya</h1>
          <p className="text-gray-600 mt-1">Kelola membership dan akses premium Anda</p>
        </div>
      </div>

      {/* Expiry Warning */}
      {isExpiringSoon && daysRemaining !== null && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-yellow-900">Membership Anda akan segera berakhir!</p>
            <p className="text-sm text-yellow-700 mt-1">
              Tersisa {daysRemaining} hari lagi. Perpanjang sekarang untuk tetap menikmati akses premium.
            </p>
          </div>
          <Link
            href={`/checkout/${membership.membership.checkoutSlug}`}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium text-sm whitespace-nowrap"
          >
            Perpanjang
          </Link>
        </div>
      )}

      {/* Main Membership Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div 
          className="relative px-8 pt-8 pb-6"
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
          }}
        >
          <div className="absolute top-0 right-0 opacity-10">
            <Crown className="w-48 h-48 transform rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{membership.membership.name}</h2>
                  <p className="text-white/80 text-sm">{getDurationLabel(membership.membership.duration)}</p>
                </div>
              </div>
              {getStatusBadge(membership.status, membership.isActive)}
            </div>
            <p className="text-white/90 text-sm max-w-xl">
              {membership.membership.description || 'Nikmati akses penuh ke semua fitur premium kami'}
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="px-8 py-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.primary + '10' }}
              >
                <Calendar className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tanggal Mulai</p>
                <p className="font-semibold text-gray-900">{formatDate(membership.startDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.primary + '10' }}
              >
                <Clock className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Berakhir Pada</p>
                <p className="font-semibold text-gray-900">{formatDate(membership.endDate)}</p>
                {daysRemaining !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {daysRemaining > 0 ? `${daysRemaining} hari lagi` : 'Expired'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.primary + '10' }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Harga Membership</p>
                <p className="font-semibold text-gray-900">{formatCurrency(membership.price)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3">
          <Link
            href={`/checkout/${membership.membership.checkoutSlug}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: theme.primary }}
          >
            <RefreshCw className="w-4 h-4" />
            Perpanjang Membership
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade Paket
          </Link>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Groups */}
        {membership.membership.groups && membership.membership.groups.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: theme.primary + '10' }}
              >
                <Users className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              <h3 className="font-bold text-gray-900">Grup Eksklusif</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Akses ke {membership.membership.groups.length} grup premium</p>
            <div className="space-y-2">
              {membership.membership.groups.slice(0, 3).map((group) => (
                <div key={group.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{group.name}</span>
                </div>
              ))}
              {membership.membership.groups.length > 3 && (
                <p className="text-xs text-gray-500">+{membership.membership.groups.length - 3} grup lainnya</p>
              )}
            </div>
          </div>
        )}

        {/* Courses */}
        {membership.membership.courses && membership.membership.courses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: theme.secondary + '10' }}
              >
                <BookOpen className="w-5 h-5" style={{ color: theme.secondary }} />
              </div>
              <h3 className="font-bold text-gray-900">Kursus Premium</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Akses ke {membership.membership.courses.length} kursus</p>
            <div className="space-y-2">
              {membership.membership.courses.slice(0, 3).map((course) => (
                <div key={course.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{course.title}</span>
                </div>
              ))}
              {membership.membership.courses.length > 3 && (
                <p className="text-xs text-gray-500">+{membership.membership.courses.length - 3} kursus lainnya</p>
              )}
            </div>
          </div>
        )}

        {/* Products */}
        {membership.membership.products && membership.membership.products.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: theme.accent + '10' }}
              >
                <Package className="w-5 h-5" style={{ color: theme.accent }} />
              </div>
              <h3 className="font-bold text-gray-900">Produk Digital</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Akses ke {membership.membership.products.length} produk</p>
            <div className="space-y-2">
              {membership.membership.products.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{product.name}</span>
                </div>
              ))}
              {membership.membership.products.length > 3 && (
                <p className="text-xs text-gray-500">+{membership.membership.products.length - 3} produk lainnya</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Additional Benefits */}
      {membership.membership.benefits && membership.membership.benefits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-6 h-6" style={{ color: theme.primary }} />
            <h2 className="text-xl font-bold text-gray-900">Benefit Membership</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {membership.membership.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h2>
            <History className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {tx.membership?.name || 'Transaksi Membership'}
                  </p>
                  <p className="text-sm text-gray-600">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(tx.amount)}</p>
                  <span className={`text-xs font-medium ${
                    tx.status === 'SUCCESS' ? 'text-green-600' :
                    tx.status === 'PENDING' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {transactions.length > 5 && (
            <Link
              href="/dashboard/transactions"
              className="flex items-center justify-center gap-2 mt-4 text-sm font-medium hover:underline"
              style={{ color: theme.primary }}
            >
              Lihat Semua Transaksi
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
