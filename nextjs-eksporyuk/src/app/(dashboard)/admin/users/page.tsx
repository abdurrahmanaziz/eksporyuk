'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Crown,
  UserCog,
  Share2,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Hash,
} from 'lucide-react'

type User = {
  id: string
  memberCode: string | null
  name: string
  email: string
  role: string
  createdAt: string
  emailVerified: boolean
  membership: {
    name: string
    duration: string
    startDate: string
    endDate: string
    daysRemaining: number
    isExpiringSoon: boolean
  } | null
  wallet: {
    balance: number
  } | null
  stats: {
    transactions: number
  }
}

type Stats = {
  total: number
  byRole: {
    admin: number
    mentor: number
    affiliate: number
    memberPremium: number
    memberFree: number
    supplier: number
  }
  activeMemberships: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [membershipFilter, setMembershipFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [updatingMemberCodes, setUpdatingMemberCodes] = useState(false)
  const [usersWithoutMemberCode, setUsersWithoutMemberCode] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MEMBER_FREE',
    isActive: true,
  })

  // Redirect non-admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Check users without member codes
  const checkMemberCodeStatus = async () => {
    try {
      const res = await fetch('/api/admin/users/update-member-codes')
      if (res.ok) {
        const data = await res.json()
        setUsersWithoutMemberCode(data.usersWithoutMemberCode || 0)
      }
    } catch (error) {
      console.error('Error checking member codes:', error)
    }
  }

  // Update all member codes
  const handleUpdateAllMemberCodes = async () => {
    if (!confirm(`Yakin ingin generate Member ID untuk ${usersWithoutMemberCode} user yang belum punya?`)) {
      return
    }

    try {
      setUpdatingMemberCodes(true)
      const res = await fetch('/api/admin/users/update-member-codes', {
        method: 'POST',
      })

      const data = await res.json()

      if (data.success) {
        alert(`Berhasil! ${data.updated} user telah diberi Member ID baru.`)
        fetchUsers() // Refresh data
        checkMemberCodeStatus() // Update count
      } else {
        alert(data.error || 'Gagal update member codes')
      }
    } catch (error) {
      console.error('Error updating member codes:', error)
      alert('Terjadi kesalahan saat update member codes')
    } finally {
      setUpdatingMemberCodes(false)
    }
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (search) params.append('search', search)
      if (roleFilter !== 'ALL') params.append('role', roleFilter)
      if (membershipFilter !== 'ALL') params.append('membershipStatus', membershipFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) {
        if (res.status === 403) {
          setError('Akses ditolak. Anda harus login sebagai ADMIN.')
          router.push('/dashboard')
          return
        }
        if (res.status === 401) {
          setError('Sesi Anda telah berakhir. Silakan login kembali.')
          router.push('/login')
          return
        }
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setUsers(data.users || [])
      setStats(data.stats || null)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
      const errorMsg = error instanceof Error ? error.message : 'Gagal memuat data'
      setError(errorMsg)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUsers()
      checkMemberCodeStatus() // Check member code status on load
    }
  }, [status, session, page, roleFilter, membershipFilter])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchUsers()
      } else {
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // Delete user
  const handleDelete = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      fetchUsers()
      alert('User berhasil dihapus!')
    } catch (error) {
      console.error('Error:', error)
      alert('Gagal menghapus user')
    }
  }

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email) {
      alert('Nama dan email wajib diisi!')
      return
    }

    try {
      setCreateLoading(true)
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create user')
      }

      const result = await res.json()

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'MEMBER_FREE',
        isActive: true,
      })
      setShowCreateModal(false)
      fetchUsers()
      
      // Show success message with generated password if available
      if (result.generatedPassword) {
        alert(`User berhasil dibuat!\n\nPassword yang digenerate:\n${result.generatedPassword}\n\nSimpan password ini untuk diberikan ke user.`)
      } else {
        alert('User berhasil dibuat!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Gagal membuat user')
    } finally {
      setCreateLoading(false)
    }
  }

  // Role badge
  const getRoleBadge = (role: string) => {
    const badges: any = {
      ADMIN: { icon: Crown, color: 'bg-purple-100 text-purple-700', label: 'Admin' },
      MENTOR: { icon: UserCog, color: 'bg-blue-100 text-blue-700', label: 'Mentor' },
      AFFILIATE: { icon: Share2, color: 'bg-green-100 text-green-700', label: 'Affiliate' },
      MEMBER_PREMIUM: { icon: Crown, color: 'bg-yellow-100 text-yellow-700', label: 'Premium' },
      MEMBER_FREE: { icon: User, color: 'bg-gray-100 text-gray-700', label: 'Free' },
      SUPPLIER: { icon: ShoppingCart, color: 'bg-orange-100 text-orange-700', label: 'Supplier' },
    }

    const badge = badges[role] || badges.MEMBER_FREE
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsivePageWrapper>
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kelola Pengguna</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Manajemen user, role, dan membership</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {usersWithoutMemberCode > 0 && (
              <button
                onClick={handleUpdateAllMemberCodes}
                disabled={updatingMemberCodes}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                title={`${usersWithoutMemberCode} user belum punya Member ID`}
              >
                {updatingMemberCodes ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Hash className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Update Member ID</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
                  {usersWithoutMemberCode}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Tambah User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-gray-800 rounded-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
          </div>

          <div className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-gray-800 rounded-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admin</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.byRole.admin}</p>
            </div>
          </div>

          <div className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-gray-800 rounded-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Premium Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.byRole.memberPremium}</p>
            </div>
          </div>

          <div className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-gray-800 rounded-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Memberships</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeMemberships}</p>
            </div>
          </div>

          <div className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-gray-800 rounded-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suppliers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.byRole.supplier || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg mr-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-800 dark:text-red-300 font-medium">{typeof error === 'string' ? error : String(error)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Semua Role</option>
            <option value="ADMIN">Admin</option>
            <option value="MENTOR">Mentor</option>
            <option value="AFFILIATE">Affiliate</option>
            <option value="MEMBER_PREMIUM">Premium</option>
            <option value="MEMBER_FREE">Free</option>
            <option value="SUPPLIER">Supplier</option>
          </select>

          {/* Membership Filter */}
          <select
            value={membershipFilter}
            onChange={(e) => {
              setMembershipFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
          >
            <option value="ALL">Semua Membership</option>
            <option value="ACTIVE">Punya Membership Aktif</option>
            <option value="NONE">Tanpa Membership</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Member ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Wallet
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Users className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Tidak ada user ditemukan</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user.memberCode ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
                          {user.memberCode}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3.5">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user.membership ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.membership.name}
                          </div>
                          <div className={`text-xs ${user.membership.isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {user.membership.isExpiringSoon && (
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                            )}
                            {user.membership.daysRemaining} hari lagi
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user.wallet ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <Wallet className="w-4 h-4 mr-1 text-green-600" />
                          Rp {user.wallet.balance.toLocaleString('id-ID')}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.emailVerified ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="ml-2 text-sm text-gray-700">
                          {user.emailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}/memberships`)}
                          className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                          title="Kelola Membership"
                        >
                          <Crown className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg">
            Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>

    {/* Create User Modal */}
    {showCreateModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tambah User Baru</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'MEMBER_FREE',
                    isActive: true,
                  })
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                  placeholder="user@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                  placeholder="Kosongkan untuk generate otomatis"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  Kosongkan untuk generate password random
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                >
                  <option value="MEMBER_FREE">Member Free</option>
                  <option value="MEMBER_PREMIUM">Member Premium</option>
                  <option value="AFFILIATE">Affiliate</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="SUPPLIER">Supplier</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Aktifkan user
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      role: 'MEMBER_FREE',
                      isActive: true,
                    })
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={createLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Membuat...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Buat User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    </ResponsivePageWrapper>
  )
}
