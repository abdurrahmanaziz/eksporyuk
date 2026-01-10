'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft, User, Mail, Phone, Crown, UserCog, Share2, Shield, Save, Loader2,
  CheckCircle, XCircle, Wallet, Users, AlertTriangle, ToggleLeft, ToggleRight,
  Key, Lock, Ban, RefreshCw, Copy, Eye, EyeOff, Plus, Minus, AlertCircle,
  Package, ArrowUpRight, Settings, UserCheck, Layers
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
  const [activeTab, setActiveTab] = useState('basic')
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('User berhasil diperbarui!')
      fetchUser()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal menyimpan data')
    } finally { setSaving(false) }
  }

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    setNewPassword(password)
  }

  const handlePasswordAction = async () => {
    if (passwordAction === 'set' && !newPassword) { setError('Password harus diisi'); return }
    setPasswordLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/set-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordAction === 'reset' ? null : newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(data.message)
      setShowPasswordModal(false); setNewPassword(''); setGeneratedPassword('')
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
      const errorMsg = error instanceof Error ? error.message : 
        roleAction === 'add' ? 'Gagal menambah role' : 'Gagal menghapus role'
      setError(errorMsg)
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
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
                    <span className="px-3 py-1.5 text-sm font-mono font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg">
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
            </CardContent>
          </Card>

          {/* Alerts */}
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
                  <Button 
                    onClick={() => handleSuspend('unsuspend')} 
                    disabled={suspendLoading}
                    className="mt-3"
                    variant="outline"
                  >
                    {suspendLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Aktifkan Kembali
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content with Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-blue-600" />
                    Kelola User
                  </CardTitle>
                  <CardDescription>
                    Gunakan tab di bawah untuk mengelola informasi user dengan aman
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                      <TabsTrigger value="basic" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Info Dasar</span>
                      </TabsTrigger>
                      <TabsTrigger value="roles" className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span className="hidden sm:inline">Role</span>
                      </TabsTrigger>
                      <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="hidden sm:inline">Keamanan</span>
                      </TabsTrigger>
                      <TabsTrigger value="advanced" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Lanjutan</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Basic Information */}
                    <TabsContent value="basic">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Nama *</Label>
                            <Input 
                              id="name"
                              type="text" 
                              value={formData.name} 
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required 
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input 
                              id="email"
                              type="email" 
                              value={formData.email} 
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              required 
                            />
                            {user && formData.email !== user.email && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Email akan direset ke unverified. Verifikasi ulang diperlukan.
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="phone">No. Telepon</Label>
                            <Input 
                              id="phone"
                              type="text" 
                              value={formData.phone} 
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+62..." 
                            />
                          </div>
                          <div>
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input 
                              id="whatsapp"
                              type="text" 
                              value={formData.whatsapp} 
                              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                              placeholder="+62..." 
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <Button onClick={() => handleSubmit()} disabled={saving} className="flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab 2: Role Management */}
                    <TabsContent value="roles">
                      <div className="space-y-6">
                        {/* Primary Role */}
                        <div>
                          <Label className="text-base font-medium">Role Utama</Label>
                          <p className="text-sm text-gray-600 mb-3">Role utama menentukan akses dasar user di platform</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {ROLES.map((role) => {
                              const Icon = role.icon
                              const isSelected = formData.role === role.value
                              return (
                                <button 
                                  key={role.value} 
                                  type="button" 
                                  onClick={() => setFormData({ ...formData, role: role.value })}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${ 
                                    isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : role.color}`} />
                                  <span className="text-sm font-medium">{role.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Additional Roles */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <Label className="text-base font-medium flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-600" />
                                Role Tambahan
                              </Label>
                              <p className="text-sm text-gray-600">Tambah role untuk memberikan akses multi-dashboard</p>
                            </div>
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => { setRoleAction('add'); setShowRoleModal(true) }}
                              className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                              <Plus className="w-4 h-4" />
                              Tambah Role
                            </Button>
                          </div>
                          
                          {user.userRoles && user.userRoles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {user.userRoles.map((role) => {
                                const roleConfig = ROLES.find(r => r.value === role.role)
                                const Icon = roleConfig?.icon || User
                                return (
                                  <div key={role.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${roleConfig?.bgColor || 'bg-gray-50'}`}>
                                    <Icon className={`w-4 h-4 ${roleConfig?.color || 'text-gray-600'}`} />
                                    <span className="font-medium text-gray-900 flex-1">{roleConfig?.label || role.role}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(role.createdAt).toLocaleDateString('id-ID')}
                                    </span>
                                    <button 
                                      onClick={() => { setSelectedRole(role.role); setRoleAction('remove'); setShowRoleModal(true) }}
                                      className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                              <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm mb-2">Belum ada role tambahan</p>
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => { setRoleAction('add'); setShowRoleModal(true) }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Role Pertama
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Save Role Settings */}
                        <div className="pt-4 border-t">
                          <Button onClick={() => handleSubmit()} disabled={saving} className="flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Menyimpan...' : 'Simpan Role'}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab 3: Security */}
                    <TabsContent value="security">
                      <div className="space-y-6">
                        {/* Account Status */}
                        <div>
                          <Label className="text-base font-medium">Status Akun</Label>
                          <div className="space-y-3 mt-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <UserCheck className="w-5 h-5 text-gray-600" />
                                <div>
                                  <p className="font-medium text-gray-900">Status Aktif</p>
                                  <p className="text-sm text-gray-500">User dapat login ke sistem</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                className="flex items-center"
                              >
                                {formData.isActive ? (
                                  <ToggleRight className="w-8 h-8 text-green-600" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Password Management */}
                        <div>
                          <Label className="text-base font-medium">Manajemen Password</Label>
                          <div className="space-y-3 mt-3">
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={() => { setPasswordAction('reset'); setShowPasswordModal(true) }}
                              className="w-full justify-start"
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </Button>
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={() => { setPasswordAction('set'); setShowPasswordModal(true) }}
                              className="w-full justify-start"
                            >
                              <Lock className="w-4 h-4 mr-2" />
                              Set Password Baru
                            </Button>
                          </div>
                        </div>

                        {/* Suspend User */}
                        {!user.isSuspended && (
                          <div>
                            <Label className="text-base font-medium text-red-600">Suspend User</Label>
                            <p className="text-sm text-gray-600 mb-3">Nonaktifkan sementara akses user</p>
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={() => setShowSuspendModal(true)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend User
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Tab 4: Advanced Settings */}
                    <TabsContent value="advanced">
                      <div className="space-y-6">
                        {/* Special Privileges */}
                        <div>
                          <Label className="text-base font-medium">Privilege Khusus</Label>
                          <div className="space-y-3 mt-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <Crown className="w-5 h-5 text-yellow-600" />
                                <div>
                                  <p className="font-medium text-gray-900">Status Founder</p>
                                  <p className="text-sm text-gray-500">Revenue share 60%</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isFounder: !formData.isFounder })}
                                className="flex items-center"
                              >
                                {formData.isFounder ? (
                                  <ToggleRight className="w-8 h-8 text-green-600" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                                )}
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <UserCog className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-gray-900">Status Co-Founder</p>
                                  <p className="text-sm text-gray-500">Revenue share 40%</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isCoFounder: !formData.isCoFounder })}
                                className="flex items-center"
                              >
                                {formData.isCoFounder ? (
                                  <ToggleRight className="w-8 h-8 text-green-600" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Affiliate Settings */}
                        <div>
                          <Label className="text-base font-medium">Pengaturan Affiliate</Label>
                          <div className="space-y-3 mt-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                <Share2 className="w-5 h-5 text-green-600" />
                                <div>
                                  <p className="font-medium text-gray-900">Menu Affiliate</p>
                                  <p className="text-sm text-gray-500">Akses dashboard affiliate untuk user non-affiliate</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={toggleAffiliateMenu}
                                className="flex items-center"
                              >
                                {formData.affiliateMenuEnabled ? (
                                  <ToggleRight className="w-8 h-8 text-green-600" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Save Settings */}
                        <div className="pt-4 border-t">
                          <Button onClick={() => handleSubmit()} disabled={saving} className="flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - User Stats */}
            <div className="space-y-6">
              {/* User Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Statistik User
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-900">Transaksi</span>
                      </div>
                      <span className="font-bold text-blue-900">{user._count?.transactions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-900">Kursus</span>
                      </div>
                      <span className="font-bold text-green-900">{user._count?.courseEnrollments || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-900">Membership</span>
                      </div>
                      <span className="font-bold text-yellow-900">{user._count?.userMemberships || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Info */}
              {user.wallet && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-600" />
                      Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Saldo:</span>
                        <span className="font-semibold">Rp {Number(user.wallet.balance).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Earning:</span>
                        <span className="font-semibold">Rp {Number(user.wallet.totalEarnings).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Payout:</span>
                        <span className="font-semibold">Rp {Number(user.wallet.totalPayout).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Affiliate Profile */}
              {user.affiliateProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-green-600" />
                      Affiliate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Code:</span>
                        <span className="font-mono font-semibold">{user.affiliateProfile.affiliateCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tier:</span>
                        <span className="font-semibold">{user.affiliateProfile.tier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Rate:</span>
                        <span className="font-semibold">{user.affiliateProfile.commissionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Konversi:</span>
                        <span className="font-semibold">{user.affiliateProfile.totalConversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.affiliateProfile.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.affiliateProfile.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Modals */}
          {/* Password Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  {passwordAction === 'reset' ? 'Reset Password' : 'Set Password Baru'}
                </h3>
                <div className="space-y-4">
                  {passwordAction === 'set' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                        <div className="flex gap-2">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Masukkan password baru"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={generatePassword} className="flex-1">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Generate
                        </Button>
                        {generatedPassword && (
                          <Button type="button" variant="outline" onClick={() => copyToClipboard(generatedPassword)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                  {passwordAction === 'reset' && (
                    <p className="text-gray-600">Password akan direset dan user akan menerima email untuk set password baru.</p>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handlePasswordAction} disabled={passwordLoading} className="flex-1">
                      {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                      {passwordLoading ? 'Memproses...' : (passwordAction === 'reset' ? 'Reset' : 'Set Password')}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowPasswordModal(false); setNewPassword(''); setGeneratedPassword('') }}>
                      Batal
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suspend Modal */}
          {showSuspendModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  Suspend User
                </h3>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    User yang disuspend tidak akan bisa login. Masukkan alasan suspend:
                  </p>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Alasan suspend..."
                    required
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleSuspend('suspend')} 
                      disabled={suspendLoading} 
                      variant="destructive"
                      className="flex-1"
                    >
                      {suspendLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                      {suspendLoading ? 'Suspending...' : 'Suspend User'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { setShowSuspendModal(false); setSuspendReason('') }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Role Modal */}
          {showRoleModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-purple-600" />
                  {roleAction === 'add' ? 'Tambah Role' : 'Hapus Role'}
                </h3>
                {roleAction === 'add' ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">Pilih role yang ingin ditambahkan untuk user ini.</p>
                    <div className="space-y-2">
                      {ROLES.map((role) => {
                        const Icon = role.icon
                        const isExisting = user.userRoles?.some(r => r.role === role.value)
                        return (
                          <button 
                            key={role.value} 
                            onClick={() => setSelectedRole(role.value)} 
                            disabled={isExisting}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                              selectedRole === role.value ? 'border-purple-500 bg-purple-50' :
                              isExisting ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${role.color}`} />
                            <span className="font-medium">{role.label}</span>
                            {isExisting && <span className="ml-auto text-xs text-gray-500">Sudah ada</span>}
                          </button>
                        )
                      })}
                    </div>
                    <Button 
                      onClick={handleRoleChange} 
                      disabled={roleLoading || !selectedRole}
                      className="w-full"
                    >
                      {roleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                      {roleLoading ? 'Menambahkan...' : 'Tambah Role'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Apakah Anda yakin ingin menghapus role <strong>{ROLES.find(r => r.value === selectedRole)?.label}</strong> dari user ini?
                    </p>
                    <Button 
                      onClick={handleRoleChange} 
                      disabled={roleLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      {roleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Minus className="w-5 h-5 mr-2" />}
                      {roleLoading ? 'Menghapus...' : 'Hapus Role'}
                    </Button>
                  </div>
                )}
                <Button 
                  variant="outline"
                  onClick={() => { setShowRoleModal(false); setSelectedRole('') }}
                  className="w-full mt-3"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}