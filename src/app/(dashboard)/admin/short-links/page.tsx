'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Shield,
  Link2,
  BarChart3,
  AlertCircle
} from 'lucide-react'

interface ShortLinkDomain {
  id: string
  domain: string
  displayName: string
  isActive: boolean
  isDefault: boolean
  isVerified: boolean
  dnsType?: string
  dnsTarget?: string
  dnsInstructions?: string
  totalLinks: number
  totalClicks: number
  createdAt: string
  _count: {
    shortLinks: number
  }
}

export default function AdminShortLinkDomainsPage() {
  const { data: session } = useSession()
  const [domains, setDomains] = useState<ShortLinkDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDomain, setEditingDomain] = useState<ShortLinkDomain | null>(null)
  const [formData, setFormData] = useState({
    domain: '',
    displayName: '',
    dnsType: 'CNAME',
    dnsTarget: '',
    dnsInstructions: '',
    isActive: true,
    isDefault: false,
    isVerified: false
  })

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchDomains()
    }
  }, [session])

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/admin/short-link-domains')
      const data = await res.json()
      setDomains(data.domains || [])
    } catch (error) {
      console.error('Error fetching domains:', error)
      toast.error('Failed to fetch domains')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingDomain(null)
    setFormData({
      domain: '',
      displayName: '',
      dnsType: 'CNAME',
      dnsTarget: '',
      dnsInstructions: '',
      isActive: true,
      isDefault: false,
      isVerified: false
    })
    setShowModal(true)
  }

  const openEditModal = (domain: ShortLinkDomain) => {
    setEditingDomain(domain)
    setFormData({
      domain: domain.domain,
      displayName: domain.displayName,
      dnsType: domain.dnsType || 'CNAME',
      dnsTarget: domain.dnsTarget || '',
      dnsInstructions: domain.dnsInstructions || '',
      isActive: domain.isActive,
      isDefault: domain.isDefault,
      isVerified: domain.isVerified
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingDomain 
        ? `/api/admin/short-link-domains/${editingDomain.id}`
        : '/api/admin/short-link-domains'
      
      const method = editingDomain ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        await fetchDomains()
        setShowModal(false)
        toast.success(editingDomain ? 'Domain updated!' : 'Domain created!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Error saving domain:', error)
      toast.error('Failed to save domain')
    }
  }

  const handleDelete = async (id: string, domain: string) => {
    if (!confirm(`Delete domain "${domain}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/admin/short-link-domains/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        await fetchDomains()
        toast.success('Domain deleted successfully')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete domain')
      }
    } catch (error) {
      console.error('Error deleting domain:', error)
      toast.error('Failed to delete domain')
    }
  }

  const toggleStatus = async (domain: ShortLinkDomain, field: 'isActive' | 'isVerified' | 'isDefault') => {
    try {
      const res = await fetch(`/api/admin/short-link-domains/${domain.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...domain,
          [field]: !domain[field]
        })
      })
      
      if (res.ok) {
        await fetchDomains()
        toast.success('Status updated')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const verifyDNS = async (domain: ShortLinkDomain) => {
    try {
      const loadingToast = toast.loading('Checking DNS record...')
      
      const res = await fetch(`/api/admin/short-link-domains/${domain.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      })
      
      const data = await res.json()
      toast.dismiss(loadingToast)
      
      if (res.ok && data.verified) {
        await fetchDomains()
        toast.success('✅ DNS verified! Domain is now verified.')
      } else if (res.ok) {
        // DNS check might have failed, show details
        toast.error(`❌ DNS verification failed: ${data.message}`)
      } else {
        toast.error(data.message || 'DNS verification failed')
      }
    } catch (error) {
      console.error('Error verifying DNS:', error)
      toast.error('Failed to verify DNS')
    }
  }

  const forceVerifyDNS = async (domain: ShortLinkDomain) => {
    if (!confirm('Force verify this domain? Make sure you\'ve set up the DNS record in Cloudflare first.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/short-link-domains/${domain.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        await fetchDomains()
        toast.success('✅ Domain marked as verified!')
      } else {
        toast.error(data.message || 'Failed to verify domain')
      }
    } catch (error) {
      console.error('Error force verifying DNS:', error)
      toast.error('Failed to verify domain')
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Admin access required</p>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="w-8 h-8" />
            Short Link Domains
          </h1>
          <p className="text-gray-600 mt-2">
            Manage domains for affiliate short links
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Domains</p>
          <p className="text-2xl font-bold">{domains.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active Domains</p>
          <p className="text-2xl font-bold text-green-600">
            {domains.filter(d => d.isActive).length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Short Links</p>
          <p className="text-2xl font-bold text-blue-600">
            {domains.reduce((sum, d) => sum + d.totalLinks, 0)}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Clicks</p>
          <p className="text-2xl font-bold text-purple-600">
            {domains.reduce((sum, d) => sum + d.totalClicks, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {domains.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No domains configured yet.</p>
          <button
            onClick={openCreateModal}
            className="text-blue-600 hover:underline"
          >
            Add your first domain
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => (
            <div key={domain.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold">{domain.displayName}</h3>
                    
                    {domain.isDefault && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Default
                      </span>
                    )}
                    
                    {domain.isActive ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                    
                    {domain.isVerified ? (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        DNS Verified
                      </span>
                    ) : (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Not Verified
                      </span>
                    )}
                  </div>
                  
                  <p className="font-mono text-lg text-gray-700 mb-4">
                    {domain.domain}
                  </p>
                  
                  {domain.dnsType && (
                    <div className="bg-gray-50 p-3 rounded mb-4">
                      <p className="text-sm font-semibold mb-1">DNS Configuration:</p>
                      <p className="text-sm text-gray-600">
                        <span className="font-mono bg-white px-2 py-1 rounded">{domain.dnsType}</span>
                        {domain.dnsTarget && (
                          <span className="ml-2">→ <span className="font-mono bg-white px-2 py-1 rounded">{domain.dnsTarget}</span></span>
                        )}
                      </p>
                      {domain.dnsInstructions && (
                        <p className="text-xs text-gray-500 mt-2">{domain.dnsInstructions}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Link2 className="w-4 h-4" />
                        Short Links
                      </p>
                      <p className="text-2xl font-bold text-blue-600">{domain._count.shortLinks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        Total Clicks
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {domain.totalClicks.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CTR</p>
                      <p className="text-2xl font-bold text-green-600">
                        {domain._count.shortLinks > 0 
                          ? (domain.totalClicks / domain._count.shortLinks).toFixed(1) 
                          : '0'}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-4">
                    Created: {new Date(domain.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => toggleStatus(domain, 'isActive')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      domain.isActive 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {domain.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {domain.isActive ? 'Active' : 'Inactive'}
                  </button>
                  
                  {!domain.isVerified ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => verifyDNS(domain)}
                        className="px-4 py-2 rounded-lg flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 flex-1"
                        title="Automatically check if DNS is set up correctly"
                      >
                        <Shield className="w-4 h-4" />
                        Verify DNS
                      </button>
                      <button
                        onClick={() => forceVerifyDNS(domain)}
                        className="px-3 py-2 rounded-lg text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                        title="Manually mark as verified if DNS is already configured"
                      >
                        Force
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg flex items-center gap-2 bg-blue-100 text-blue-700"
                    >
                      <Shield className="w-4 h-4" />
                      ✓ Verified
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleStatus(domain, 'isDefault')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      domain.isDefault 
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    {domain.isDefault ? 'Default' : 'Set Default'}
                  </button>
                  
                  <button
                    onClick={() => openEditModal(domain)}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDelete(domain.id, domain.domain)}
                    disabled={domain._count.shortLinks > 0}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={domain._count.shortLinks > 0 ? 'Cannot delete domain with active links' : 'Delete domain'}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingDomain ? 'Edit Domain' : 'Add New Domain'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Domain * (e.g., link.eksporyuk.com)
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
                    placeholder="link.eksporyuk.com"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                    disabled={!!editingDomain}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Link EksporYuk"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    DNS Type
                  </label>
                  <select
                    value={formData.dnsType}
                    onChange={(e) => setFormData({ ...formData, dnsType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="CNAME">CNAME</option>
                    <option value="A">A Record</option>
                    <option value="ALIAS">ALIAS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    DNS Target (e.g., server IP or domain)
                  </label>
                  <input
                    type="text"
                    value={formData.dnsTarget}
                    onChange={(e) => setFormData({ ...formData, dnsTarget: e.target.value })}
                    placeholder="eksporyuk.com or 192.168.1.1"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    DNS Setup Instructions
                  </label>
                  <textarea
                    value={formData.dnsInstructions}
                    onChange={(e) => setFormData({ ...formData, dnsInstructions: e.target.value })}
                    placeholder="Add CNAME record pointing to eksporyuk.com in your DNS provider..."
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isVerified}
                      onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">DNS Verified</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Set as Default</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingDomain ? 'Update Domain' : 'Create Domain'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                >n                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
