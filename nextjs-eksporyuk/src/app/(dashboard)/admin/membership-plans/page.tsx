'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreVertical, Copy, ExternalLink, TrendingUp, ArrowUp, Users as UsersIcon, CreditCard, Package as PackageIcon, GraduationCap, Bell, Send, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type MembershipStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

interface MembershipPlan {
  id: string
  name: string
  slug: string
  description: string | null
  formLogo: string | null
  formBanner: string | null
  prices: any
  isPopular: boolean
  salespage: string | null
  followUpMessages: any
  affiliateCommission: number
  isActive: boolean
  status: MembershipStatus
  _count: {
    userMemberships: number
    membershipGroups: number
    membershipCourses: number
    membershipProducts: number
  }
  createdAt: string
}

interface PriceOption {
  duration: 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'LIFETIME'
  label: string
  price: number
  discount?: number
  pricePerMonth?: number
  benefits: string[]
  badge?: string
  isPopular?: boolean
}

export default function MembershipPlansPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/membership-plans')
      if (response.ok) {
        const data = await response.json()
        const filteredPlans = (data.plans || []).filter((p: any) => p.slug !== 'member-free')
        setPlans(filteredPlans)
        setTotalRevenue(data.totalRevenue || 0)
      } else {
        toast.error('Gagal memuat paket membership')
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Failed to load membership plans')
    } finally {
      setLoading(false)
    }
  }

  const getDurationLabel = (duration: string) => {
    switch(duration) {
      case 'SIX_MONTHS': return '6 Bulan'
      case 'TWELVE_MONTHS': return '1 Tahun'
      case 'LIFETIME': return 'Selamanya'
      default: return duration
    }
  }

  const getDurationIcon = (duration: string) => {
    switch(duration) {
      case 'LIFETIME': return 'all_inclusive'
      case 'TWELVE_MONTHS': return 'calendar_today'
      case 'SIX_MONTHS': return 'calendar_month'
      default: return 'schedule'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast.success(message)
  }

  const handleDelete = async (id: string) => {
    const plan = plans.find(p => p.id === id)
    if (!plan) return

    const warnings: string[] = []
    if (plan._count.userMemberships > 0) {
      warnings.push(`${plan._count.userMemberships} anggota aktif`)
    }
    if (plan._count.membershipGroups > 0) {
      warnings.push(`${plan._count.membershipGroups} grup terkait`)
    }
    if (plan._count.membershipCourses > 0) {
      warnings.push(`${plan._count.membershipCourses} kursus terkait`)
    }

    let confirmMessage = `⚠️ HAPUS PAKET: ${plan.name}\n\n`
    
    if (warnings.length > 0) {
      confirmMessage += `❌ TIDAK BISA DIHAPUS!\n\nPaket ini terhubung dengan:\n${warnings.map(w => `• ${w}`).join('\n')}`
      alert(confirmMessage)
      return
    }

    confirmMessage += `✅ Paket ini aman untuk dihapus.\n\nApakah Anda yakin?`

    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/admin/membership-plans/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Paket membership berhasil dihapus')
        fetchPlans()
      } else {
        toast.error(data.error || 'Gagal menghapus paket membership')
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error('Gagal menghapus paket membership')
    }
  }

  const handleDuplicate = async (id: string) => {
    if (!confirm('Duplikat paket membership ini? Anda akan diarahkan ke halaman edit untuk menyesuaikan detail paket baru.')) return
    
    try {
      const response = await fetch(`/api/admin/membership-plans/${id}/duplicate`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Paket berhasil diduplikasi!')
        // Redirect to edit page
        router.push(`/admin/membership-plans/${data.plan.id}/edit`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menduplikasi paket')
      }
    } catch (error) {
      console.error('Error duplicating plan:', error)
      toast.error('Gagal menduplikasi paket')
    }
  }

  // Calculate stats
  const totalActivePlans = plans.filter(p => p.status === 'PUBLISHED').length
  const totalMembers = plans.reduce((sum, p) => sum + (p._count?.userMemberships || 0), 0)
  // totalRevenue now comes from API (actual transactions)

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari paket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600">
              <span className="text-sm font-medium hidden sm:block">Keluar</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manajemen Paket</h2>
            <p className="text-sm text-gray-500 mt-1">Konfigurasi dan kelola produk membership.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button 
              onClick={() => router.push('/admin/membership-plans/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Paket
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Paket Aktif</h3>
              <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <PackageIcon className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-gray-900">{totalActivePlans}</p>
              <span className="text-xs font-medium text-green-500 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 mb-0.5">
                <TrendingUp className="h-3 w-3" /> 100%
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Total Member</h3>
              <span className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                <UsersIcon className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-gray-900">{totalMembers.toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-400 mb-0.5">user</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">Pendapatan</h3>
              <span className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                <CreditCard className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {totalRevenue >= 1000000000 
                  ? `${(totalRevenue / 1000000000).toFixed(1)}M`
                  : totalRevenue >= 1000000
                  ? `${(totalRevenue / 1000000).toFixed(1)} jt`
                  : `Rp ${totalRevenue.toLocaleString('id-ID')}`
                }
              </p>
              <span className="text-xs font-medium text-green-500 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 mb-0.5">
                <ArrowUp className="h-3 w-3" /> 12%
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="pl-6 pr-4 py-4 w-64">Paket</th>
                  <th className="px-4 py-4">Harga & Durasi</th>
                  <th className="px-4 py-4">Performa</th>
                  <th className="px-4 py-4">Fitur</th>
                  <th className="px-4 py-4 text-center">Link</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="group hover:bg-gray-50">
                    <td className="pl-6 pr-4 py-4 align-top">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-sm">{plan.name}</span>
                        <span className="text-xs text-gray-500 mt-1">Paket Ekspor Yuk</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {Array.isArray(plan.prices) && plan.prices.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-gray-900">
                              {formatCurrency(plan.prices[0].price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="material-icons-round text-sm">
                              {getDurationIcon(plan.prices[0].duration)}
                            </span>
                            <span>{getDurationLabel(plan.prices[0].duration)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-700">
                            {plan._count?.userMemberships || 0}
                          </span>
                          <span className="text-[10px] uppercase text-gray-400 font-medium tracking-wide">Trans.</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-700">
                            {plan._count?.userMemberships || 0}
                          </span>
                          <span className="text-[10px] uppercase text-gray-400 font-medium tracking-wide">Member</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-3">
                        {plan._count?.membershipGroups > 0 && (
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600" title={`${plan._count.membershipGroups} Grup Diskusi`}>
                            <UsersIcon className="h-4 w-4" />
                          </div>
                        )}
                        {plan._count?.membershipCourses > 0 && (
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600" title={`${plan._count.membershipCourses} Kelas Eksklusif`}>
                            <GraduationCap className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/checkout/${plan.slug}`, 'Link berhasil disalin!')}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                          title="Copy Link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.open(`/checkout/${plan.slug}`, '_blank')}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                          title="Buka Halaman Checkout"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => router.push(`/admin/membership-plans/${plan.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(plan.id)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Duplikat Paket"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          disabled={plan._count?.userMemberships > 0}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-gray-900">1-{filteredPlans.length}</span> dari <span className="font-medium text-gray-900">{filteredPlans.length}</span> data
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50" disabled>
                Prev
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50" disabled>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredPlans.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            Tidak ada paket membership ditemukan.
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <button 
        onClick={() => router.push('/admin/membership-plans/create')}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 z-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Material Icons Font */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
    </div>
  )
}
