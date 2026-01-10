'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, RefreshCw, Plus, Trash2, Settings, Check, X, 
  Crown, Briefcase, UserPlus, Star, User, ChevronRight,
  AlertCircle, ExternalLink, Loader2, Shield
} from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface RoleMapping {
  id: string
  role: string
  mailketingListId: string
  mailketingListName: string
  isActive: boolean
  autoAddOnRegister: boolean
  autoAddOnUpgrade: boolean
  description?: string
  createdAt: string
}

interface RoleGroup {
  role: string
  userCount: number
  lists: RoleMapping[]
}

interface MailketingList {
  id: string
  name: string
}

const ROLE_INFO: Record<string, { label: string; icon: any; color: string; bgColor: string; description: string }> = {
  ADMIN: { 
    label: 'Admin', 
    icon: Shield, 
    color: 'text-red-700', 
    bgColor: 'bg-red-50 border-red-200',
    description: 'Administrator sistem dengan akses penuh'
  },
  MENTOR: { 
    label: 'Mentor', 
    icon: Briefcase, 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Pengajar dan pembuat konten kursus'
  },
  AFFILIATE: { 
    label: 'Affiliate', 
    icon: UserPlus, 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Partner afiliasi yang mempromosikan produk'
  },
  MEMBER_PREMIUM: { 
    label: 'Member Premium', 
    icon: Crown, 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'Member berbayar dengan akses premium'
  },
  MEMBER_FREE: { 
    label: 'Member Free', 
    icon: User, 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-50 border-gray-200',
    description: 'Member gratis dengan akses terbatas'
  }
}

export default function RoleListSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([])
  const [availableLists, setAvailableLists] = useState<MailketingList[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Add mapping modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [selectedListId, setSelectedListId] = useState('')
  const [selectedListName, setSelectedListName] = useState('')
  const [autoRegister, setAutoRegister] = useState(true)
  const [autoUpgrade, setAutoUpgrade] = useState(true)
  const [mappingDescription, setMappingDescription] = useState('')
  const [adding, setAdding] = useState(false)

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Load data
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadData()
    }
  }, [status, session])

  // Auto dismiss messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load role mappings
      const mappingsRes = await fetch('/api/admin/mailketing/role-lists')
      const mappingsData = await mappingsRes.json()

      if (mappingsData.success) {
        setRoleGroups(mappingsData.mappings || [])
      } else {
        setError(mappingsData.error || 'Gagal memuat data')
      }

      // Load available lists from Mailketing
      const listsRes = await fetch('/api/admin/mailketing/lists')
      const listsData = await listsRes.json()

      if (listsData.success) {
        setAvailableLists(listsData.lists || [])
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMapping = async () => {
    if (!selectedRole || !selectedListId) {
      setError('Pilih role dan list terlebih dahulu')
      return
    }

    try {
      setAdding(true)
      setError('')

      const res = await fetch('/api/admin/mailketing/role-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          mailketingListId: selectedListId,
          mailketingListName: selectedListName || selectedListId,
          autoAddOnRegister: autoRegister,
          autoAddOnUpgrade: autoUpgrade,
          description: mappingDescription || undefined
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('Mapping berhasil ditambahkan!')
        setShowAddModal(false)
        resetForm()
        loadData()
      } else {
        setError(data.error || 'Gagal menambahkan mapping')
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Yakin ingin menghapus mapping ini?')) return

    try {
      const res = await fetch(`/api/admin/mailketing/role-lists?id=${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('Mapping berhasil dihapus')
        loadData()
      } else {
        setError(data.error || 'Gagal menghapus mapping')
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
  }

  const handleToggleActive = async (mapping: RoleMapping) => {
    try {
      const res = await fetch('/api/admin/mailketing/role-lists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mapping.id,
          isActive: !mapping.isActive
        })
      })

      const data = await res.json()

      if (data.success) {
        loadData()
      } else {
        setError(data.error || 'Gagal mengubah status')
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
  }

  const handleSyncUsers = async (role?: string) => {
    try {
      setSyncing(true)
      setError('')

      const body = role 
        ? { action: 'sync-role', role }
        : { action: 'sync-all' }

      const res = await fetch('/api/admin/mailketing/sync-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(data.message)
      } else {
        setError(data.error || 'Gagal sync users')
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setSyncing(false)
    }
  }

  const resetForm = () => {
    setSelectedRole(null)
    setSelectedListId('')
    setSelectedListName('')
    setAutoRegister(true)
    setAutoUpgrade(true)
    setMappingDescription('')
  }

  const openAddModal = (role: string) => {
    setSelectedRole(role)
    setShowAddModal(true)
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/admin/mailketing" className="hover:text-indigo-600">
                  Mailketing
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/admin/mailketing/lists" className="hover:text-indigo-600">
                  Lists
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">Role Settings</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Role List Settings</h1>
              <p className="text-gray-600 mt-1">
                Atur list Mailketing untuk setiap role user
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSyncUsers()}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                Sync Semua User
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Cara Kerja</h3>
                <ul className="mt-2 text-sm text-blue-800 space-y-1">
                  <li>• Setiap role dapat memiliki satu atau lebih Mailketing list</li>
                  <li>• User akan otomatis ditambahkan ke list saat registrasi atau upgrade</li>
                  <li>• Gunakan tombol "Sync" untuk menambahkan user existing ke list</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Role Cards */}
          <div className="space-y-4">
            {roleGroups.map((group) => {
              const roleInfo = ROLE_INFO[group.role] || ROLE_INFO.MEMBER_FREE
              const Icon = roleInfo.icon

              return (
                <div 
                  key={group.role}
                  className={`bg-white border rounded-lg overflow-hidden ${roleInfo.bgColor}`}
                >
                  {/* Role Header */}
                  <div className="px-6 py-4 border-b bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${roleInfo.bgColor}`}>
                          <Icon className={`w-5 h-5 ${roleInfo.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{roleInfo.label}</h3>
                          <p className="text-sm text-gray-500">{roleInfo.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{group.userCount}</div>
                          <div className="text-xs text-gray-500">users</div>
                        </div>
                        <button
                          onClick={() => openAddModal(group.role)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah List
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lists */}
                  <div className="divide-y divide-gray-100">
                    {group.lists.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Belum ada list yang di-assign ke role ini</p>
                        <button
                          onClick={() => openAddModal(group.role)}
                          className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          + Tambah List
                        </button>
                      </div>
                    ) : (
                      group.lists.map((mapping) => (
                        <div 
                          key={mapping.id}
                          className={`px-6 py-4 flex items-center justify-between ${!mapping.isActive ? 'opacity-50 bg-gray-50' : ''}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{mapping.mailketingListName}</h4>
                              {!mapping.isActive && (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                ID: {mapping.mailketingListId}
                              </span>
                              {mapping.autoAddOnRegister && (
                                <span className="text-green-600">✓ Auto Register</span>
                              )}
                              {mapping.autoAddOnUpgrade && (
                                <span className="text-blue-600">✓ Auto Upgrade</span>
                              )}
                            </div>
                            {mapping.description && (
                              <p className="text-sm text-gray-500 mt-1">{mapping.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(mapping)}
                              className={`p-2 rounded-lg transition-colors ${
                                mapping.isActive 
                                  ? 'text-green-600 hover:bg-green-50' 
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={mapping.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {mapping.isActive ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteMapping(mapping.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Role Footer with Sync */}
                  {group.lists.length > 0 && (
                    <div className="px-6 py-3 bg-gray-50 border-t flex justify-end">
                      <button
                        onClick={() => handleSyncUsers(group.role)}
                        disabled={syncing}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                      >
                        {syncing ? 'Syncing...' : `Sync ${group.userCount} ${roleInfo.label} ke lists`}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Available Lists Info */}
          {availableLists.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Lists Tersedia di Mailketing ({availableLists.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableLists.map(list => (
                  <span 
                    key={list.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {list.name}
                  </span>
                ))}
              </div>
              <a
                href="https://be.mailketing.co.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Buka Dashboard Mailketing <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Add Mapping Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Tambah List ke {selectedRole && ROLE_INFO[selectedRole]?.label}
            </h2>

            <div className="space-y-4">
              {/* List Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih List <span className="text-red-500">*</span>
                </label>
                {availableLists.length > 0 ? (
                  <select
                    value={selectedListId}
                    onChange={(e) => {
                      setSelectedListId(e.target.value)
                      const list = availableLists.find(l => l.id === e.target.value)
                      setSelectedListName(list?.name || '')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih List --</option>
                    {availableLists.map(list => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Masukkan List ID"
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Nama List"
                      value={selectedListName}
                      onChange={(e) => setSelectedListName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500">
                      Tidak ada list dari API. Masukkan ID list secara manual dari dashboard Mailketing.
                    </p>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRegister}
                    onChange={(e) => setAutoRegister(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Auto tambah saat user registrasi
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoUpgrade}
                    onChange={(e) => setAutoUpgrade(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Auto tambah saat user upgrade ke role ini
                  </span>
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan untuk mapping ini"
                  value={mappingDescription}
                  onChange={(e) => setMappingDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddMapping}
                disabled={adding || !selectedListId}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ResponsivePageWrapper>
  )
}
