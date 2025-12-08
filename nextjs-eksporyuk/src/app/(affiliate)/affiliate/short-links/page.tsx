'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import FeatureLock from '@/components/affiliate/FeatureLock'

interface Domain {
  id: string
  domain: string
  displayName: string
  isDefault: boolean
}

interface ShortLink {
  id: string
  username: string
  slug?: string
  fullShortUrl: string
  targetType: string
  targetId?: string
  targetUrl?: string
  clicks: number
  conversions: number
  isActive: boolean
  createdAt: string
  domain: Domain
}

export default function AffiliateShortLinksPage() {
  const { data: session } = useSession()
  const [domains, setDomains] = useState<Domain[]>([])
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedLink, setSelectedLink] = useState<ShortLink | null>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [loadingQR, setLoadingQR] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  
  const [formData, setFormData] = useState({
    domainId: '',
    username: '',
    slug: '',
    targetType: 'membership',
    targetId: '',
    targetUrl: '',
    couponCode: '',
    expiresAt: ''
  })

  useEffect(() => {
    fetchDomains()
    fetchShortLinks()
  }, [])

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/affiliate/short-links/domains')
      const data = await res.json()
      setDomains(data.domains || [])
      
      // Set default domain
      const defaultDomain = data.domains?.find((d: Domain) => d.isDefault)
      if (defaultDomain && !formData.domainId) {
        setFormData(prev => ({ ...prev, domainId: defaultDomain.id }))
      }
    } catch (error) {
      console.error('Error fetching domains:', error)
    }
  }

  const fetchShortLinks = async () => {
    try {
      const res = await fetch('/api/affiliate/short-links')
      const data = await res.json()
      setShortLinks(data.shortLinks || [])
    } catch (error) {
      console.error('Error fetching short links:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUsername = async (username: string) => {
    if (!username || !formData.domainId) return
    
    setCheckingUsername(true)
    try {
      const res = await fetch(
        `/api/affiliate/short-links/check-username?username=${username}&domainId=${formData.domainId}&slug=${formData.slug}`
      )
      const data = await res.json()
      setUsernameAvailable(data.available)
    } catch (error) {
      console.error('Error checking username:', error)
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData({ ...formData, username: cleaned })
    setUsernameAvailable(null)
    
    if (cleaned.length >= 3) {
      const timer = setTimeout(() => checkUsername(cleaned), 500)
      return () => clearTimeout(timer)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!usernameAvailable) {
      toast.error('Please choose an available username')
      return
    }
    
    try {
      const res = await fetch('/api/affiliate/short-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        await fetchShortLinks()
        setShowModal(false)
        resetForm()
        toast.success('Short link created successfully!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create short link')
      }
    } catch (error) {
      console.error('Error creating short link:', error)
      toast.error('Failed to create short link')
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  const showQR = async (link: ShortLink) => {
    setSelectedLink(link)
    setShowQRModal(true)
    setLoadingQR(true)
    
    try {
      const res = await fetch(`/api/affiliate/short-links/${link.id}/qrcode`)
      const data = await res.json()
      setQrCode(data.qrCode)
    } catch (error) {
      console.error('Error fetching QR code:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setLoadingQR(false)
    }
  }

  const downloadQR = () => {
    if (!qrCode || !selectedLink) return
    
    const link = document.createElement('a')
    link.download = `qr-${selectedLink.username}.png`
    link.href = qrCode
    link.click()
  }

  const resetForm = () => {
    const defaultDomain = domains.find(d => d.isDefault)
    setFormData({
      domainId: defaultDomain?.id || '',
      username: '',
      slug: '',
      targetType: 'membership',
      targetId: '',
      targetUrl: '',
      couponCode: '',
      expiresAt: ''
    })
    setUsernameAvailable(null)
  }

  const getPreviewUrl = () => {
    const domain = domains.find(d => d.id === formData.domainId)
    if (!domain || !formData.username) return ''
    
    const slugPart = formData.slug ? `/${formData.slug}` : ''
    return `https://${domain.domain}/${formData.username}${slugPart}`
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <FeatureLock feature="short-links">
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Short Links</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your affiliate short links
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          disabled={domains.length === 0}
        >
          + Create Short Link
        </button>
      </div>

      {domains.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            No domains available yet. Please contact admin to set up short link domains.
          </p>
        </div>
      )}

      {shortLinks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🔗</div>
          <p className="text-gray-500 mb-4">No short links created yet.</p>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="text-blue-600 hover:underline"
            disabled={domains.length === 0}
          >
            Create your first short link
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {shortLinks.map((link) => (
            <div key={link.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold font-mono flex-1">{link.fullShortUrl}</h3>
                    {link.isActive ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                    {link.expiresAt && new Date(link.expiresAt) < new Date() && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                        ⏰ Expired
                      </span>
                    )}
                    {link.expiresAt && new Date(link.expiresAt) >= new Date() && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        📅 Expires {new Date(link.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold">Target:</span>{' '}
                    {link.targetType === 'custom' ? link.targetUrl : `${link.targetType} (ID: ${link.targetId})`}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Clicks</p>
                      <p className="text-2xl font-bold text-blue-600">{link.clicks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conversions</p>
                      <p className="text-2xl font-bold text-green-600">{link.conversions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conversion Rate</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-4">
                    Created: {new Date(link.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => window.location.href = `/affiliate/short-links/${link.id}/stats`}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    📊 View Stats
                  </button>
                  <button
                    onClick={() => copyToClipboard(link.fullShortUrl)}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => showQR(link)}
                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 flex items-center gap-2"
                  >
                    📱 QR
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Create New Short Link</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Domain *
                  </label>
                  <select
                    value={formData.domainId}
                    onChange={(e) => {
                      setFormData({ ...formData, domainId: e.target.value })
                      if (formData.username) checkUsername(formData.username)
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Choose a domain...</option>
                    {domains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.displayName} ({domain.domain})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Username * (alphanumeric and hyphens only)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="dinda"
                      className="w-full px-4 py-2 border rounded-lg pr-24"
                      required
                      minLength={3}
                    />
                    {checkingUsername && (
                      <span className="absolute right-3 top-3 text-gray-400">Checking...</span>
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <span className="absolute right-3 top-3 text-green-600">✓ Available</span>
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <span className="absolute right-3 top-3 text-red-600">✗ Taken</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum 3 characters. This will be your short link identifier.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Path (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, '')
                      setFormData({ ...formData, slug: cleaned })
                    }}
                    placeholder="paket-premium"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Add an additional path for specific products/offers
                  </p>
                </div>

                {/* Preview */}
                {getPreviewUrl() && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-1">Preview:</p>
                    <p className="font-mono text-blue-700 break-all">{getPreviewUrl()}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Link Target Type *
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value, targetId: '', targetUrl: '' })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="membership">Membership</option>
                    <option value="product">Product</option>
                    <option value="course">Course</option>
                    <option value="custom">Custom URL</option>
                  </select>
                </div>

                {formData.targetType === 'custom' ? (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom URL *
                    </label>
                    <input
                      type="url"
                      value={formData.targetUrl}
                      onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                      placeholder="https://example.com/page"
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Target {formData.targetType} ID *
                    </label>
                    <input
                      type="text"
                      value={formData.targetId}
                      onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                      placeholder="Enter ID"
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Get the ID from the {formData.targetType} list
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Auto-apply Coupon Code (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                    placeholder="DISCOUNT20"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Expiration Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty for permanent link
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  disabled={!usernameAvailable || checkingUsername}
                >
                  Create Short Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">QR Code</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Short Link:</p>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                {selectedLink.fullShortUrl}
              </p>
            </div>

            <div className="flex justify-center mb-6">
              {loadingQR ? (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                  <p className="text-gray-500">Generating QR Code...</p>
                </div>
              ) : qrCode ? (
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                  <p className="text-gray-500">Failed to generate</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadQR}
                disabled={!qrCode || loadingQR}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download QR Code
              </button>
              <button
                onClick={() => {
                  setShowQRModal(false)
                  setSelectedLink(null)
                  setQrCode(null)
                }}
                className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FeatureLock>
  )
}
