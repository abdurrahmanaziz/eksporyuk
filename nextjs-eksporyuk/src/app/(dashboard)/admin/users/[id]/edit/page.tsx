'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  ArrowLeft, User, Mail, Phone, Crown, UserCog, Share2, Shield, Save, Loader2,
  CheckCircle, XCircle, Wallet, Users, AlertTriangle, ToggleLeft, ToggleRight,
  Key, Lock, Ban, RefreshCw, Copy, Eye, EyeOff, Plus, Minus, AlertCircle,
  Package, ArrowUpRight
} from 'lucide-react'

type UserRole = { id: string; role: string; createdAt: string }

type UserDetail = {
  id: string; memberCode: string | null; name: string; email: string; phone: string | null; whatsapp: string | null
  role: string; avatar: string | null; bio: string | null; emailVerified: boolean
  isActive: boolean; isSuspended: boolean; suspendReason: string | null
  suspendedAt: string | null; suspendedBy: string | null; isFounder: boolean
  isCoFounder: boolean; affiliateMenuEnabled: boolean; createdAt: string; updatedAt: string
  affiliateProfile: {
    id: string; affiliateCode: string; tier: number; commissionRate: number
    isActive: boolean; applicationStatus: string; totalEarnings: number; totalConversions: number
  } | null
  wallet: { balance: number; totalEarnings: number; totalPayout: number } | null
  userRoles: UserRole[]
  _count: { transactions: number; courseEnrollments: number; userMemberships: number }
}

const ROLES = [
  { value: 'ADMIN', label: 'Admin', icon: Crown, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { value: 'MENTOR', label: 'Mentor', icon: UserCog, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { value: 'AFFILIATE', label: 'Affiliate', icon: Share2, color: 'text-green-600', bgColor: 'bg-green-50' },
  { value: 'MEMBER_PREMIUM', label: 'Member Premium', icon: Crown, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { value: 'MEMBER_FREE', label: 'Member Free', icon: User, color: 'text-gray-600', bgColor: 'bg-gray-50' }
]

export default function AdminUserEditPage() {
  const params = useParams()
  const userId = params.id as string
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'reset' | 'set'>('reset')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendLoading, setSuspendLoading] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [roleAction, setRoleAction] = useState<'add' | 'remove'>('add')
  const [roleLoading, setRoleLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', whatsapp: '', role: '', isActive: true,
    isFounder: false, isCoFounder: false, affiliateMenuEnabled: false
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/dashboard')
  }, [status, session, router])

  const fetchUser = async () => {
    try {
      setLoading(true); setError('')
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) {
        if (res.status === 404) { setError('User tidak ditemukan'); return }
        throw new Error('Failed to fetch user')
      }
      const data = await res.json()
      setUser(data.user)
      setFormData({
        name: data.user.name || '', email: data.user.email || '',
        phone: data.user.phone || '', whatsapp: data.user.whatsapp || '',
        role: data.user.role || 'MEMBER_FREE', isActive: data.user.isActive ?? true,
        isFounder: data.user.isFounder ?? false, isCoFounder: data.user.isCoFounder ?? false,
        affiliateMenuEnabled: data.user.affiliateMenuEnabled ?? false
      })
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Gagal memuat data user')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') fetchUser()
  }, [status, session, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }
      const data = await res.json()
      
      // Show different message if email was changed
      if (data.emailChanged) {
        setSuccess('User berhasil diupdate! Email verifikasi telah dikirim ke email baru.')
      } else {
        setSuccess('User berhasil diupdate!')
      }
      
      fetchUser()
      setTimeout(() => router.push('/admin/users'), 2500)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Gagal mengupdate user')
    } finally { setSaving(false) }
  }

  const handleResetPassword = async () => {
    setPasswordLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedPassword(data.newPassword)
      setSuccess('Password berhasil direset!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal reset password')
    } finally { setPasswordLoading(false) }
  }

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError('Password minimal 6 karakter'); return }
    setPasswordLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/set-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Password berhasil diubah!')
      setShowPasswordModal(false); setNewPassword('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal mengubah password')
    } finally { setPasswordLoading(false) }
  }

  const handleSuspend = async (action: 'suspend' | 'unsuspend') => {
    if (action === 'suspend' && !suspendReason) { setError('Alasan suspend harus diisi'); return }
    setSuspendLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: suspendReason })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(data.message)
      setShowSuspendModal(false); setSuspendReason(''); fetchUser()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal memproses suspend')
    } finally { setSuspendLoading(false) }
  }

  const handleRoleChange = async () => {
    if (!selectedRole) { setError('Pilih role terlebih dahulu'); return }
    setRoleLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/change-role`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, action: roleAction })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(data.message)
      setShowRoleModal(false); setSelectedRole(''); fetchUser()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal mengubah role')
    } finally { setRoleLoading(false) }
  }

  const toggleAffiliateMenu = async () => {
    const newValue = !formData.affiliateMenuEnabled
    setFormData({ ...formData, affiliateMenuEnabled: newValue })
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, affiliateMenuEnabled: newValue })
      })
      if (!res.ok) throw new Error('Failed to toggle')
      setSuccess(newValue ? 'Menu affiliate diaktifkan!' : 'Menu affiliate dinonaktifkan.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setFormData({ ...formData, affiliateMenuEnabled: !newValue })
      setError('Gagal mengubah status menu affiliate')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Password berhasil disalin!')
    setTimeout(() => setSuccess(''), 2000)
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (error && !user) {
    return (
      <ResponsivePageWrapper>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">{error}</h2>
              <button onClick={() => router.push('/admin/users')} className="text-red-600 hover:underline">
                Kembali ke daftar user
              </button>
            </div>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!user) return null

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <button onClick={() => router.push('/admin/users')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />Kembali ke Daftar User
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">Edit User: {user.name}</h1>
                  <span className="px-3 py-1.5 text-sm font-mono font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg animate-pulse">
                    ID: {user.memberCode || 'NO-CODE'}
                  </span>
                </div>
                <p className="text-gray-500">{user.email}</p>
              </div>
              {user.isSuspended && (
                <div className="px-4 py-2 bg-red-100 text-red-700 rounded-xl flex items-center gap-2">
                  <Ban className="w-5 h-5" /><span className="font-medium">Suspended</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800">{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                <XCircle className="w-5 h-5 text-red-400 hover:text-red-600" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-green-800">{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto">
                <XCircle className="w-5 h-5 text-green-400 hover:text-green-600" />
              </button>
            </div>
          )}

          {user.isSuspended && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">User Disuspend</h3>
                  <p className="text-red-700 mt-1">{user.suspendReason || 'Tidak ada alasan'}</p>
                  <p className="text-sm text-red-600 mt-2">
                    Disuspend pada: {user.suspendedAt ? new Date(user.suspendedAt).toLocaleDateString('id-ID', { 
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    }) : '-'}
                  </p>
                  <button onClick={() => handleSuspend('unsuspend')} disabled={suspendLoading}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                    {suspendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Aktifkan Kembali
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi User</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                    {user && formData.email !== user.email && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Email akan direset ke unverified. Verifikasi ulang diperlukan.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+62..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+62..." />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Utama</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {ROLES.map((role) => {
                      const Icon = role.icon
                      const isSelected = formData.role === role.value
                      return (
                        <button key={role.value} type="button" onClick={() => setFormData({ ...formData, role: role.value })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                            isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : role.color}`} />
                          <span className="text-sm font-medium">{role.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Status Aktif</p>
                        <p className="text-sm text-gray-500">User dapat login ke sistem</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`p-1 rounded-full transition ${formData.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">Founder</p>
                        <p className="text-sm text-gray-500">Dapat revenue share 60%</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setFormData({ ...formData, isFounder: !formData.isFounder, isCoFounder: formData.isFounder ? formData.isCoFounder : false })}
                      className={`p-1 rounded-full transition ${formData.isFounder ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {formData.isFounder ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Co-Founder</p>
                        <p className="text-sm text-gray-500">Dapat revenue share 40%</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setFormData({ ...formData, isCoFounder: !formData.isCoFounder, isFounder: formData.isCoFounder ? formData.isFounder : false })}
                      className={`p-1 rounded-full transition ${formData.isCoFounder ? 'text-purple-600' : 'text-gray-400'}`}>
                      {formData.isCoFounder ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => router.push('/admin/users')}
                    className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition">Batal</button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />Manajemen Password
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => { setPasswordAction('reset'); setShowPasswordModal(true) }}
                    className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Reset Password</p>
                        <p className="text-sm text-gray-500">Generate password baru otomatis</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => { setPasswordAction('set'); setShowPasswordModal(true) }}
                    className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Lock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Set Password Baru</p>
                        <p className="text-sm text-gray-500">Tentukan password manual</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-purple-600" />Role Tambahan
                  </h2>
                  <button onClick={() => { setRoleAction('add'); setShowRoleModal(true) }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition">
                    <Plus className="w-4 h-4" />Tambah Role
                  </button>
                </div>
                {user.userRoles && user.userRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.userRoles.map((role) => {
                      const roleConfig = ROLES.find(r => r.value === role.role)
                      const Icon = roleConfig?.icon || User
                      return (
                        <div key={role.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${roleConfig?.bgColor || 'bg-gray-50'} border border-gray-200`}>
                          <Icon className={`w-4 h-4 ${roleConfig?.color || 'text-gray-600'}`} />
                          <span className="font-medium text-gray-900">{roleConfig?.label || role.role}</span>
                          <button onClick={() => { setSelectedRole(role.role); setRoleAction('remove'); setShowRoleModal(true) }}
                            className="ml-1 p-0.5 hover:bg-gray-200 rounded">
                            <XCircle className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Belum ada role tambahan</p>
                )}
              </div>

              {!user.isSuspended && (
                <div className="bg-white rounded-2xl border border-red-200 p-6">
                  <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <Ban className="w-5 h-5" />Suspend User
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Suspend akan menonaktifkan akun user dan mereka tidak bisa login. User akan melihat pesan suspend dan alasannya.
                  </p>
                  <button onClick={() => setShowSuspendModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2">
                    <Ban className="w-5 h-5" />Suspend User Ini
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Menu Affiliate</h3>
                    <p className="text-sm text-gray-600">Akses dashboard affiliate</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">{formData.affiliateMenuEnabled ? 'Aktif' : 'Nonaktif'}</p>
                    <p className="text-xs text-gray-500">{formData.affiliateMenuEnabled ? 'User dapat melihat menu affiliate' : 'Menu affiliate tersembunyi'}</p>
                  </div>
                  <button type="button" onClick={toggleAffiliateMenu}
                    className={`p-1 rounded-full transition ${formData.affiliateMenuEnabled ? 'text-orange-600' : 'text-gray-400'}`}>
                    {formData.affiliateMenuEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </button>
                </div>
                {formData.affiliateMenuEnabled && !user.affiliateProfile && (
                  <p className="mt-3 text-xs text-orange-700 bg-orange-200 p-2 rounded-xl">
                    💡 User perlu apply jadi affiliate sebelum bisa menggunakan fitur affiliate.
                  </p>
                )}
              </div>

              {user.affiliateProfile && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-green-600" />Profil Affiliate
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-gray-500">Kode</span><span className="font-mono text-sm">{user.affiliateProfile.affiliateCode}</span></div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        user.affiliateProfile.applicationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        user.affiliateProfile.applicationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{user.affiliateProfile.applicationStatus}</span>
                    </div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Earning</span>
                      <span className="font-semibold text-green-600">Rp {user.affiliateProfile.totalEarnings.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Konversi</span><span className="font-semibold">{user.affiliateProfile.totalConversions}</span></div>
                  </div>
                </div>
              )}

              {user.wallet && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-blue-600" />Wallet</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-gray-500">Saldo</span>
                      <span className="font-semibold text-green-600">Rp {user.wallet.balance.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Earning</span>
                      <span className="font-semibold">Rp {user.wallet.totalEarnings.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Payout</span>
                      <span className="font-semibold">Rp {user.wallet.totalPayout.toLocaleString('id-ID')}</span></div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-600" />Statistik</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500">Transaksi</span><span className="font-semibold">{user._count.transactions}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Kursus Enrolled</span><span className="font-semibold">{user._count.courseEnrollments}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Membership</span><span className="font-semibold">{user._count.userMemberships}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Bergabung</span>
                    <span className="text-sm">{new Date(user.createdAt).toLocaleDateString('id-ID')}</span></div>
                </div>
              </div>

              {/* Kelola Paket Membership Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Kelola Paket</h3>
                    <p className="text-sm text-gray-600">Upgrade atau ganti membership</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-purple-200 p-4 mb-4">
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
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

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {passwordAction === 'reset' ? 'Reset Password' : 'Set Password Baru'}
              </h3>
              {passwordAction === 'reset' ? (
                <div>
                  <p className="text-gray-600 mb-4">Klik tombol di bawah untuk generate password baru secara otomatis.</p>
                  {generatedPassword ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                      <p className="text-sm text-green-700 mb-2">Password baru:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white rounded-lg font-mono text-lg">{generatedPassword}</code>
                        <button onClick={() => copyToClipboard(generatedPassword)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-2">Pastikan untuk menyalin password ini dan berikan ke user.</p>
                    </div>
                  ) : (
                    <button onClick={handleResetPassword} disabled={passwordLoading}
                      className="w-full py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                      {passwordLoading ? 'Generating...' : 'Generate Password Baru'}
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">Masukkan password baru untuk user ini. Minimal 6 karakter.</p>
                  <div className="relative mb-4">
                    <input type={showPassword ? 'text' : 'password'} value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)} placeholder="Password baru"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button onClick={handleSetPassword} disabled={passwordLoading || !newPassword}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                    {passwordLoading ? 'Menyimpan...' : 'Set Password'}
                  </button>
                </div>
              )}
              <button onClick={() => { setShowPasswordModal(false); setNewPassword(''); setGeneratedPassword('') }}
                className="w-full mt-3 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50">Tutup</button>
            </div>
          </div>
        )}

        {showSuspendModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                <Ban className="w-5 h-5" />Suspend User
              </h3>
              <p className="text-gray-600 mb-4">User yang disuspend tidak dapat login ke sistem. Alasan suspend akan ditampilkan kepada user.</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Suspend <span className="text-red-500">*</span></label>
                <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={3}
                  placeholder="Contoh: Melanggar ketentuan penggunaan, Aktivitas spam, dll."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
              <button onClick={() => handleSuspend('suspend')} disabled={suspendLoading || !suspendReason}
                className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {suspendLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ban className="w-5 h-5" />}
                {suspendLoading ? 'Memproses...' : 'Suspend User'}
              </button>
              <button onClick={() => { setShowSuspendModal(false); setSuspendReason('') }}
                className="w-full mt-3 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50">Batal</button>
            </div>
          </div>
        )}

        {showRoleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-purple-600" />{roleAction === 'add' ? 'Tambah Role' : 'Hapus Role'}
              </h3>
              {roleAction === 'add' ? (
                <div>
                  <p className="text-gray-600 mb-4">Pilih role yang ingin ditambahkan untuk user ini.</p>
                  <div className="space-y-2 mb-4">
                    {ROLES.map((role) => {
                      const Icon = role.icon
                      const isExisting = user.userRoles?.some(r => r.role === role.value)
                      return (
                        <button key={role.value} onClick={() => setSelectedRole(role.value)} disabled={isExisting}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                            selectedRole === role.value ? 'border-purple-500 bg-purple-50' :
                            isExisting ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <Icon className={`w-5 h-5 ${role.color}`} />
                          <span className="font-medium">{role.label}</span>
                          {isExisting && <span className="ml-auto text-xs text-gray-500">Sudah ada</span>}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={handleRoleChange} disabled={roleLoading || !selectedRole}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {roleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {roleLoading ? 'Menambahkan...' : 'Tambah Role'}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    Apakah Anda yakin ingin menghapus role <strong>{ROLES.find(r => r.value === selectedRole)?.label}</strong> dari user ini?
                  </p>
                  <button onClick={handleRoleChange} disabled={roleLoading}
                    className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {roleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Minus className="w-5 h-5" />}
                    {roleLoading ? 'Menghapus...' : 'Hapus Role'}
                  </button>
                </div>
              )}
              <button onClick={() => { setShowRoleModal(false); setSelectedRole('') }}
                className="w-full mt-3 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50">Batal</button>
            </div>
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
