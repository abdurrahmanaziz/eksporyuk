'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Crown,
  UserCog,
  Share2,
  Shield,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Wallet,
  Users,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Package,
  ArrowUpRight,
} from 'lucide-react'

type UserDetail = {
  id: string
  name: string
  email: string
  phone: string | null
  whatsapp: string | null
  role: string
  avatar: string | null
  bio: string | null
  emailVerified: boolean
  isActive: boolean
  isFounder: boolean
  isCoFounder: boolean
  affiliateMenuEnabled: boolean
  createdAt: string
  updatedAt: string
  affiliateProfile: {
    id: string
    affiliateCode: string
    tier: number
    commissionRate: number
    isActive: boolean
    applicationStatus: string
    totalEarnings: number
    totalConversions: number
  } | null
  wallet: {
    balance: number
    totalEarnings: number
    totalPayout: number
  } | null
  _count: {
    transactions: number
    courseEnrollments: number
    userMemberships: number
  }
}

const ROLES = [
  { value: 'ADMIN', label: 'Admin', icon: Crown, color: 'text-purple-600' },
  { value: 'MENTOR', label: 'Mentor', icon: UserCog, color: 'text-blue-600' },
  { value: 'AFFILIATE', label: 'Affiliate', icon: Share2, color: 'text-green-600' },
  { value: 'MEMBER_PREMIUM', label: 'Member Premium', icon: Crown, color: 'text-yellow-600' },
  { value: 'MEMBER_FREE', label: 'Member Free', icon: User, color: 'text-gray-600' },
]

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    role: '',
    isActive: true,
    isFounder: false,
    isCoFounder: false,
    affiliateMenuEnabled: false,
  })

  // Redirect non-admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch user detail
  const fetchUser = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/admin/users/${userId}`)
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('User tidak ditemukan')
          return
        }
        throw new Error('Failed to fetch user')
      }

      const data = await res.json()
      setUser(data.user)
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
        phone: data.user.phone || '',
        whatsapp: data.user.whatsapp || '',
        role: data.user.role || 'MEMBER_FREE',
        isActive: data.user.isActive ?? true,
        isFounder: data.user.isFounder ?? false,
        isCoFounder: data.user.isCoFounder ?? false,
        affiliateMenuEnabled: data.user.affiliateMenuEnabled ?? false,
      })
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Gagal memuat data user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUser()
    }
  }, [status, session, userId])

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      setSuccess('User berhasil diupdate!')
      fetchUser()
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Gagal mengupdate user')
    } finally {
      setSaving(false)
    }
  }

  // Toggle affiliate menu
  const toggleAffiliateMenu = async () => {
    const newValue = !formData.affiliateMenuEnabled
    setFormData({ ...formData, affiliateMenuEnabled: newValue })
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, affiliateMenuEnabled: newValue }),
      })

      if (!res.ok) throw new Error('Failed to toggle')
      
      setSuccess(newValue 
        ? 'Menu affiliate diaktifkan! User dapat melihat menu affiliate di dashboard.' 
        : 'Menu affiliate dinonaktifkan.')
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      // Revert on error
      setFormData({ ...formData, affiliateMenuEnabled: !newValue })
      setError('Gagal mengubah status menu affiliate')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <ResponsivePageWrapper>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">{error}</h2>
            <button
              onClick={() => router.push('/admin/users')}
              className="text-red-600 hover:underline"
            >
              Kembali ke daftar user
            </button>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!user) return null

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/users')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Daftar User
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi User</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+62..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+62..."
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ROLES.map((role) => {
                    const Icon = role.icon
                    const isSelected = formData.role === role.value
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role.value })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : role.color}`} />
                        <span className="text-sm font-medium">{role.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Status Toggles */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Status Aktif</p>
                      <p className="text-sm text-gray-500">User dapat login ke sistem</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`p-1 rounded-full transition ${formData.isActive ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {formData.isActive ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">Founder</p>
                      <p className="text-sm text-gray-500">Dapat revenue share 60%</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFounder: !formData.isFounder, isCoFounder: formData.isFounder ? formData.isCoFounder : false })}
                    className={`p-1 rounded-full transition ${formData.isFounder ? 'text-yellow-600' : 'text-gray-400'}`}
                  >
                    {formData.isFounder ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Co-Founder</p>
                      <p className="text-sm text-gray-500">Dapat revenue share 40%</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isCoFounder: !formData.isCoFounder, isFounder: formData.isCoFounder ? formData.isFounder : false })}
                    className={`p-1 rounded-full transition ${formData.isCoFounder ? 'text-purple-600' : 'text-gray-400'}`}
                  >
                    {formData.isCoFounder ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Affiliate Menu Toggle Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow border border-orange-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Menu Affiliate</h3>
                  <p className="text-sm text-gray-600">Akses dashboard affiliate</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                <div>
                  <p className="font-medium text-gray-900">
                    {formData.affiliateMenuEnabled ? 'Aktif' : 'Nonaktif'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.affiliateMenuEnabled 
                      ? 'User dapat melihat menu affiliate' 
                      : 'Menu affiliate tersembunyi'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleAffiliateMenu}
                  className={`p-1 rounded-full transition ${formData.affiliateMenuEnabled ? 'text-orange-600' : 'text-gray-400'}`}
                >
                  {formData.affiliateMenuEnabled ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10" />
                  )}
                </button>
              </div>

              {formData.affiliateMenuEnabled && !user.affiliateProfile && (
                <p className="mt-3 text-xs text-orange-700 bg-orange-200 p-2 rounded">
                  💡 User perlu apply jadi affiliate sebelum bisa menggunakan fitur affiliate.
                </p>
              )}
            </div>

            {/* Affiliate Profile Card */}
            {user.affiliateProfile && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-green-600" />
                  Profil Affiliate
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kode</span>
                    <span className="font-mono text-sm">{user.affiliateProfile.affiliateCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.affiliateProfile.applicationStatus === 'APPROVED' 
                        ? 'bg-green-100 text-green-700'
                        : user.affiliateProfile.applicationStatus === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.affiliateProfile.applicationStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earning</span>
                    <span className="font-semibold text-green-600">
                      Rp {user.affiliateProfile.totalEarnings.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Konversi</span>
                    <span className="font-semibold">{user.affiliateProfile.totalConversions}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Card */}
            {user.wallet && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Wallet
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saldo</span>
                    <span className="font-semibold text-green-600">
                      Rp {user.wallet.balance.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earning</span>
                    <span className="font-semibold">
                      Rp {user.wallet.totalEarnings.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Payout</span>
                    <span className="font-semibold">
                      Rp {user.wallet.totalPayout.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Statistik
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaksi</span>
                  <span className="font-semibold">{user._count.transactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kursus Enrolled</span>
                  <span className="font-semibold">{user._count.courseEnrollments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Membership</span>
                  <span className="font-semibold">{user._count.userMemberships}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bergabung</span>
                  <span className="text-sm">{new Date(user.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Kelola Paket Membership Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow border border-purple-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Kelola Paket</h3>
                  <p className="text-sm text-gray-600">Upgrade atau ganti membership</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-purple-200 p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Membership Aktif</p>
                {user._count.userMemberships > 0 ? (
                  <p className="font-semibold text-purple-700">{user._count.userMemberships} paket aktif</p>
                ) : (
                  <p className="text-gray-500 italic">Belum ada membership</p>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => router.push(`/admin/users/${userId}/memberships`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                <Crown className="w-5 h-5" />
                Kelola Paket Membership
                <ArrowUpRight className="w-4 h-4" />
              </button>
              
              <p className="mt-3 text-xs text-purple-700 text-center">
                Upgrade ke Premium 6 Bulan, 12 Bulan, atau Lifetime
              </p>
            </div>
          </div>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
