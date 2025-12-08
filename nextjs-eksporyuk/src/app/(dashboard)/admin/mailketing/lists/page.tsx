'use client'

import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Calendar, Copy, Check, Package, BookOpen, Crown, Settings, ChevronDown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface ListUsage {
  memberships: number
  products: number
  courses: number
  total: number
}

interface MailketingList {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at?: string
  usage?: ListUsage
}

export default function MailketingListsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [lists, setLists] = useState<MailketingList[]>([])
  const [filteredLists, setFilteredLists] = useState<MailketingList[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Search and pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Form state
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Quick assign state
  const [showAssignDropdown, setShowAssignDropdown] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<'membership' | 'product' | 'course' | null>(null)
  const [targetItems, setTargetItems] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadLists()
    }
  }, [status, session])

  // Filter lists based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLists(lists)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = lists.filter(list => 
        list.name.toLowerCase().includes(query) ||
        list.id.toLowerCase().includes(query) ||
        (list.description && list.description.toLowerCase().includes(query))
      )
      setFilteredLists(filtered)
    }
    setCurrentPage(1) // Reset to first page when search changes
  }, [searchQuery, lists])

  // Auto dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showAssignDropdown && !target.closest('.assign-dropdown-container')) {
        setShowAssignDropdown(null)
        setAssignTarget(null)
        setTargetItems([])
      }
    }

    if (showAssignDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAssignDropdown])

  const loadLists = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/admin/mailketing/lists')
      const data = await response.json()

      console.log('📋 Mailketing Lists Response:', data)

      if (data.success) {
        setLists(data.lists || [])
        console.log('✅ Loaded', data.lists?.length || 0, 'lists')
      } else {
        // Handle API endpoint not available (expected condition)
        if (data.error === 'API_ENDPOINT_NOT_AVAILABLE') {
          console.log('ℹ️  Mailketing API endpoint belum tersedia, gunakan manual input')
          setError(data.message)
          setLists([]) // Empty lists, akan show empty state dengan instruksi
        } else {
          // Actual error
          const errorMsg = data.message || 'Gagal memuat lists'
          setError(errorMsg)
          console.warn('⚠️ Mailketing API Error:', errorMsg)
          
          // Show helpful message if API not configured
          if (errorMsg.includes('API key') || errorMsg.includes('dikonfigurasi')) {
            setError('Mailketing API belum dikonfigurasi. Silakan atur di halaman Integrasi terlebih dahulu.')
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading lists:', error)
      setError('Terjadi kesalahan saat memuat lists. Pastikan Mailketing API sudah dikonfigurasi.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setSuccess('')
    setError('')
    await loadLists()
    setRefreshing(false)
  }

  const copyToClipboard = async (text: string, listId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(listId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newListName.trim()) {
      setError('Nama list wajib diisi')
      return
    }

    try {
      setCreating(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/mailketing/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDescription.trim() || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('List berhasil dibuat!')
        setNewListName('')
        setNewListDescription('')
        setShowCreateModal(false)
        
        // Reload lists after short delay
        setTimeout(() => loadLists(), 500)
      } else {
        setError(data.message || 'Gagal membuat list')
      }
    } catch (error: any) {
      console.error('Error creating list:', error)
      setError('Terjadi kesalahan saat membuat list')
    } finally {
      setCreating(false)
    }
  }

  // Load target items (memberships/products/courses)
  const loadTargetItems = async (type: 'membership' | 'product' | 'course', listId: string) => {
    try {
      setLoadingItems(true)
      setError('') // Clear any previous errors
      
      let endpoint = ''
      if (type === 'membership') {
        endpoint = '/api/admin/membership-plans'
      } else if (type === 'product') {
        endpoint = '/api/admin/products'
      } else if (type === 'course') {
        endpoint = '/api/courses'
      }
      
      console.log(`📡 Loading ${type} items from ${endpoint}`)
      
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      console.log(`📥 Response for ${type}:`, data)
      
      // Handle different response formats
      let items: any[] = []
      if (type === 'membership') {
        items = data.memberships || data.data || data.plans || []
      } else if (type === 'product') {
        items = data.products || data.data || []
      } else if (type === 'course') {
        items = data.courses || data.data || []
      }
      
      // If still empty but success flag exists, try to extract from nested structure
      if (items.length === 0 && data.success && data.data) {
        items = Array.isArray(data.data) ? data.data : []
      }
      
      console.log(`✅ Loaded ${items.length} ${type} items`)
      
      setTargetItems(items)
      setAssignTarget(type)
      setShowAssignDropdown(listId)
      
      if (items.length === 0) {
        const typeName = type === 'membership' ? 'membership plan' : type === 'product' ? 'product' : 'course'
        console.warn(`⚠️ No ${typeName}s found`)
        // Don't set error here, just show "Tidak ada data" in UI
      }
    } catch (error: any) {
      console.error(`❌ Error loading ${type} items:`, error)
      setError(`Gagal memuat data ${type}. ${error.message || 'Pastikan endpoint API tersedia.'}`)
      setTargetItems([])
      setAssignTarget(type)
      setShowAssignDropdown(listId)
    } finally {
      setLoadingItems(false)
    }
  }

  // Assign list to item
  const assignListToItem = async (listId: string, listName: string, itemId: string) => {
    if (!assignTarget) return
    
    try {
      setAssigning(true)
      setError('')
      
      let endpoint = ''
      if (assignTarget === 'membership') {
        endpoint = `/api/admin/membership-plans/${itemId}`
      } else if (assignTarget === 'product') {
        endpoint = `/api/admin/products/${itemId}`
      } else if (assignTarget === 'course') {
        endpoint = `/api/courses/${itemId}`
      }
      
      const method = assignTarget === 'course' ? 'PATCH' : 'PUT'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mailketingListId: listId,
          mailketingListName: listName,
          autoAddToList: true
        })
      })
      
      const data = await response.json()
      
      if (data.success || data.membership || data.product || data.course) {
        setSuccess(`List berhasil di-assign ke ${assignTarget}!`)
        setShowAssignDropdown(null)
        setAssignTarget(null)
        setTargetItems([])
        
        // Reload lists to update usage count
        setTimeout(() => loadLists(), 500)
      } else {
        setError(data.message || 'Gagal assign list')
      }
    } catch (error) {
      console.error('Error assigning list:', error)
      setError('Gagal assign list')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mailketing Lists</h1>
            <p className="text-gray-600 mt-1">
              Kelola email lists untuk segmentasi pengguna berdasarkan pembelian
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Buat List Baru
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                🚀 Cara Menggunakan Mailketing Lists
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">1.</span>
                  <span>
                    <strong>Buat list di dashboard Mailketing:</strong>{' '}
                    <a 
                      href="https://be.mailketing.co.id" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-600 font-medium"
                    >
                      https://be.mailketing.co.id
                    </a>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">2.</span>
                  <span>
                    <strong>Klik tombol "Refresh"</strong> di atas untuk sync list dari Mailketing ke sistem kita
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[20px]">3.</span>
                  <span>
                    <strong>Assign list</strong> ke Membership/Product/Course dengan klik tombol "Assign ke..." pada setiap list card
                  </span>
                </div>
                <div className="bg-blue-100 rounded px-3 py-2 mt-3">
                  <p className="font-medium">💡 Tips:</p>
                  <p className="mt-1">
                    <strong>Cara melihat jumlah subscriber:</strong> Login ke dashboard Mailketing di{' '}
                    <a 
                      href="https://be.mailketing.co.id" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-600 font-medium"
                    >
                      be.mailketing.co.id
                    </a>
                    , pilih menu "Lists", dan klik list yang ingin dilihat untuk melihat detail subscriber.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg">
          <div className="px-4 py-3 flex items-start justify-between">
            <div className="flex-1">
              <p className="text-red-800">{error}</p>
              {error.includes('belum dikonfigurasi') && (
                <Link 
                  href="/admin/integrations"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Atur Mailketing API Key →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Search Bar */}
      {!loading && lists.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari list berdasarkan nama, ID, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredLists.length} dari {lists.length} list
            </div>
          </div>
        </div>
      )}

      {/* Lists Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat lists...</p>
        </div>
      ) : filteredLists.length === 0 && searchQuery ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tidak ada hasil
          </h3>
          <p className="text-gray-600">
            Tidak ditemukan list yang cocok dengan pencarian "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Hapus filter pencarian
          </button>
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Belum ada list dari Mailketing
          </h3>
          <div className="text-gray-600 mb-6 max-w-2xl mx-auto">
            <p className="mb-3">
              List belum tersedia. Silakan ikuti langkah berikut:
            </p>
            <ol className="text-left space-y-2 inline-block">
              <li className="flex items-start gap-2">
                <span className="font-semibold">1.</span>
                <span>
                  Buat list di dashboard Mailketing:{' '}
                  <a 
                    href="https://be.mailketing.co.id" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline hover:text-indigo-700"
                  >
                    be.mailketing.co.id
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">2.</span>
                <span>Klik tombol "Refresh Lists" di atas untuk sync</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">3.</span>
                <span>Jika masih tidak muncul, gunakan list ID manual di form Membership/Product/Course</span>
              </li>
            </ol>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Lists
            </button>
            <a
              href="https://be.mailketing.co.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <ExternalLink className="w-5 h-5" />
              Buka Dashboard Mailketing
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 grid grid-cols-11 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-3">List Name</div>
            <div className="col-span-4 text-center">Digunakan Di</div>
            <div className="col-span-2">List ID</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {(() => {
              const startIndex = (currentPage - 1) * itemsPerPage
              const endIndex = startIndex + itemsPerPage
              const paginatedLists = filteredLists.slice(startIndex, endIndex)
              
              return paginatedLists.map((list) => (
                <div
                  key={list.id}
                  className="px-4 py-3 grid grid-cols-11 gap-4 items-center hover:bg-gray-50 transition-colors"
                >
                {/* List Name */}
                <div className="col-span-3">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {list.name}
                  </h3>
                  {list.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{list.description}</p>
                  )}
                </div>

                {/* Usage */}
                <div className="col-span-4">
                  {list.usage && list.usage.total > 0 ? (
                    <div className="flex items-center justify-center gap-2">
                      {list.usage.memberships > 0 && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs">
                          <Crown className="w-3 h-3" />
                          <span>{list.usage.memberships}</span>
                        </div>
                      )}
                      {list.usage.products > 0 && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          <Package className="w-3 h-3" />
                          <span>{list.usage.products}</span>
                        </div>
                      )}
                      {list.usage.courses > 0 && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                          <BookOpen className="w-3 h-3" />
                          <span>{list.usage.courses}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-400">-</div>
                  )}
                </div>

                {/* List ID with Copy */}
                <div className="col-span-2">
                  <button
                    onClick={() => copyToClipboard(list.id, list.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-mono group w-full"
                    title="Click to copy"
                  >
                    <span className="truncate">{list.id}</span>
                    {copiedId === list.id ? (
                      <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end">
                  <div className="relative assign-dropdown-container">
                    {showAssignDropdown === list.id ? (
                      <div className="absolute right-0 top-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]">
                        {!assignTarget ? (
                          <div className="space-y-1">
                            <button
                              onClick={() => loadTargetItems('membership', list.id)}
                              disabled={loadingItems}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                            >
                              <Crown className="w-3.5 h-3.5 text-yellow-600" />
                              <span>Membership</span>
                            </button>
                            <button
                              onClick={() => loadTargetItems('product', list.id)}
                              disabled={loadingItems}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                            >
                              <Package className="w-3.5 h-3.5 text-blue-600" />
                              <span>Product</span>
                            </button>
                            <button
                              onClick={() => loadTargetItems('course', list.id)}
                              disabled={loadingItems}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-green-600" />
                              <span>Course</span>
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => {
                                setShowAssignDropdown(null)
                                setAssignTarget(null)
                                setTargetItems([])
                              }}
                              className="w-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                              <p className="text-xs font-medium text-gray-700">
                                Pilih {assignTarget}
                              </p>
                              <button
                                onClick={() => {
                                  setAssignTarget(null)
                                  setTargetItems([])
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                ← Back
                              </button>
                            </div>
                            
                            {loadingItems ? (
                              <div className="text-center py-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto"></div>
                              </div>
                            ) : targetItems.length === 0 ? (
                              <p className="text-xs text-gray-500 py-2 text-center">
                                {error || 'Tidak ada data'}
                              </p>
                            ) : (
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {targetItems.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => assignListToItem(list.id, list.name, item.id)}
                                    disabled={assigning}
                                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                                  >
                                    {item.name || item.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAssignDropdown(list.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))})()}
          </div>

          {/* Pagination */}
          {(() => {
            const totalPages = Math.ceil(filteredLists.length / itemsPerPage)
            if (totalPages <= 1) return null
            
            return (
              <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredLists.length)} dari {filteredLists.length} list)
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Sebelumnya
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 text-sm border rounded ${
                            currentPage === pageNum
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Buat List Baru
            </h2>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama List <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Contoh: Member Premium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Deskripsi list ini..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewListName('')
                    setNewListDescription('')
                    setError('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={creating}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating || !newListName.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Membuat...' : 'Buat List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
