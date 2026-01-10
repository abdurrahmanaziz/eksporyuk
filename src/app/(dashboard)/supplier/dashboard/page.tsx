'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import EmailVerificationModal from '@/components/member/EmailVerificationModal'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  Package,
  MessageSquare,
  TrendingUp,
  Award,
  Zap,
  Plus,
  Edit,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SupplierProfile {
  id: string
  companyName: string
  slug: string
  logo?: string
  isVerified: boolean
  viewCount: number
  totalProducts: number
  totalChats: number
  rating?: number
}

interface SupplierMembership {
  id: string
  isActive: boolean
  endDate?: string
  package: {
    name: string
    type: string
    features: any
  }
}

interface QuotaData {
  packageName: string
  packageType: string
  quotas: {
    products: { used: number; max: number; unlimited: boolean; remaining: number | string }
    images: { max: number; perProduct: boolean }
    documents: { max: number; perProduct: boolean }
    chat: { enabled: boolean; usedThisMonth: number; maxPerMonth: number; unlimited: boolean; remaining: number | string }
  }
  features: {
    verifiedBadge: boolean
    customURL: boolean
    customLogo: boolean
    statistics: boolean
    ranking: boolean
    priority: boolean
    catalogDownload: boolean
    multiLanguage: boolean
    featuredListing: boolean
    supportPriority: string
  }
  upgradePrompts: Array<{ feature: string; message: string }>
  endDate: string | null
}

export default function SupplierDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<SupplierProfile | null>(null)
  const [membership, setMembership] = useState<SupplierMembership | null>(null)
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [quota, setQuota] = useState<QuotaData | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch profile and quota in parallel
      const [profileRes, quotaRes] = await Promise.all([
        fetch('/api/supplier/profile'),
        fetch('/api/supplier/quota'),
      ])
      
      if (!profileRes.ok) {
        if (profileRes.status === 404) {
          toast.info('Please register as supplier first')
          router.push('/become-supplier')
          return
        }
        throw new Error('Failed to fetch profile')
      }

      const profileData = await profileRes.json()
      setProfile(profileData.data.profile)
      setMembership(profileData.data.membership)

      // Fetch recent products
      if (profileData.data.profile) {
        setRecentProducts(profileData.data.profile.products || [])
      }

      // Set quota data if available
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json()
        setQuota(quotaData.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!profile || !membership) {
    return (
      <ResponsivePageWrapper>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No supplier profile found</p>
          <Button onClick={() => router.push('/become-supplier')}>
            Register as Supplier
          </Button>
        </div>
      </ResponsivePageWrapper>
    )
  }

  const isFree = membership.package.type === 'FREE'
  const features = membership.package.features
  const maxProducts = features.maxProducts === -1 ? 'Unlimited' : features.maxProducts

  // Check profile completion
  const isProfileIncomplete = !profile.logo || profile.totalProducts === 0
  const completionItems = [
    { label: 'Logo perusahaan', completed: !!profile.logo },
    { label: 'Banner perusahaan', completed: !!profile.logo }, // You may need to add banner field
    { label: 'Upload minimal 1 produk', completed: profile.totalProducts > 0 },
  ]
  const completionPercentage = Math.round(
    (completionItems.filter(item => item.completed).length / completionItems.length) * 100
  )

  return (
    <>
      <EmailVerificationModal onComplete={() => window.location.reload()} />
      <ResponsivePageWrapper>
        <EmailVerificationBanner />
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Supplier</h1>
            <p className="text-sm text-gray-500 mt-1">Selamat datang kembali, {profile.companyName}!</p>
          </div>
          <div className="flex items-center gap-2">
            {profile.isVerified && (
              <Badge variant="default" className="bg-green-500">
                <Award className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            <Badge variant={isFree ? 'secondary' : 'default'}>
              {membership.package.name}
            </Badge>
          </div>
        </div>

        {/* Complete Profile Banner */}
        {isProfileIncomplete && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center">
                    <Edit className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-amber-900 mb-2">
                    Lengkapi Profil Supplier Anda
                  </h3>
                  <p className="text-amber-800 text-sm mb-4">
                    Profil yang lengkap akan meningkatkan kepercayaan pembeli dan visibilitas produk Anda
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-amber-900">
                        Progres: {completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 mb-4">
                    {completionItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          item.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {item.completed && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={item.completed ? 'text-green-700 font-medium' : 'text-amber-800'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href="/supplier/profile">
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                        Lengkapi Profil
                      </Button>
                    </Link>
                    {profile.totalProducts === 0 && (
                      <Link href="/supplier/products">
                        <Button size="sm" variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50">
                          Tambah Produk
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Banner for FREE users */}
        {isFree && (
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Upgrade ke Premium</h3>
                    <p className="text-sm opacity-90">
                      Dapatkan produk unlimited, chat, badge terverifikasi, dan fitur lainnya
                    </p>
                  </div>
                </div>
                <Button variant="secondary" asChild>
                  <Link href="/pricing/supplier">Upgrade Sekarang</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Profile Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{profile.viewCount}</p>
                  <p className="text-xs text-gray-500">Total views</p>
                </div>
                <Eye className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{profile.totalProducts}</p>
                  <p className="text-xs text-gray-500">
                    {isFree ? `of ${maxProducts} used` : 'Unlimited'}
                  </p>
                </div>
                <Package className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{profile.totalChats}</p>
                  <p className="text-xs text-gray-500">
                    {features.chatEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{profile.rating?.toFixed(1) || '0.0'}</p>
                  <p className="text-xs text-gray-500">Average rating</p>
                </div>
                <Award className="w-8 h-8 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quota & Limits Card */}
        {quota && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Kuota & Batasan Paket
              </CardTitle>
              <CardDescription>
                Paket {quota.packageName} - Lihat penggunaan dan fitur yang tersedia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Products Quota */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm">Produk</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {quota.quotas.products.unlimited ? (
                      <span className="text-green-600">Unlimited</span>
                    ) : (
                      <>
                        {quota.quotas.products.used}
                        <span className="text-sm text-gray-500 font-normal"> / {quota.quotas.products.max}</span>
                      </>
                    )}
                  </div>
                  {!quota.quotas.products.unlimited && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            quota.quotas.products.remaining === 0 ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, (quota.quotas.products.used / quota.quotas.products.max) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {quota.quotas.products.remaining === 0 ? 'Kuota habis' : `Sisa ${quota.quotas.products.remaining}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Images Limit */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Gambar/Produk</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {quota.quotas.images.max}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Maksimum per produk</p>
                </div>

                {/* Documents Limit */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-sm">Dokumen/Produk</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {quota.quotas.documents.max}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Maksimum per produk</p>
                </div>

                {/* Chat Quota */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Chat</span>
                  </div>
                  {!quota.quotas.chat.enabled ? (
                    <>
                      <div className="text-2xl font-bold text-gray-400">Disabled</div>
                      <p className="text-xs text-gray-500 mt-1">Upgrade untuk mengaktifkan</p>
                    </>
                  ) : quota.quotas.chat.unlimited ? (
                    <>
                      <div className="text-2xl font-bold text-purple-600">Unlimited</div>
                      <p className="text-xs text-gray-500 mt-1">Chat tidak terbatas</p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {quota.quotas.chat.usedThisMonth}
                        <span className="text-sm text-gray-500 font-normal"> / {quota.quotas.chat.maxPerMonth}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Bulan ini, sisa {quota.quotas.chat.remaining}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Feature List */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-3">Fitur Paket Anda</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'verifiedBadge', label: 'Verified Badge', enabled: quota.features.verifiedBadge },
                    { key: 'customURL', label: 'Custom URL', enabled: quota.features.customURL },
                    { key: 'customLogo', label: 'Custom Logo', enabled: quota.features.customLogo },
                    { key: 'statistics', label: 'Statistik', enabled: quota.features.statistics },
                    { key: 'ranking', label: 'Tampil Ranking', enabled: quota.features.ranking },
                    { key: 'priority', label: 'Priority Listing', enabled: quota.features.priority },
                    { key: 'catalogDownload', label: 'Download Katalog', enabled: quota.features.catalogDownload },
                    { key: 'featuredListing', label: 'Featured Listing', enabled: quota.features.featuredListing },
                  ].map((feature) => (
                    <div
                      key={feature.key}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        feature.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {feature.enabled ? (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade Prompts */}
              {quota.upgradePrompts.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Tingkatkan Paket Anda</h4>
                      <ul className="mt-2 space-y-1">
                        {quota.upgradePrompts.map((prompt, index) => (
                          <li key={index} className="text-sm text-blue-800">• {prompt.message}</li>
                        ))}
                      </ul>
                      <Link href="/pricing/supplier">
                        <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                          Lihat Paket Premium
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-6" asChild>
            <Link href="/supplier/products/create">
              <div className="flex flex-col items-center gap-2">
                <Plus className="w-6 h-6" />
                <span>Add Product</span>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-6" asChild>
            <Link href="/supplier/profile">
              <div className="flex flex-col items-center gap-2">
                <Edit className="w-6 h-6" />
                <span>Edit Profile</span>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-6" asChild>
            <Link href={`/supplier/${profile.slug}`}>
              <div className="flex flex-col items-center gap-2">
                <Eye className="w-6 h-6" />
                <span>View Public Page</span>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-6" asChild>
            <Link href="/supplier/statistics">
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                <span>View Statistics</span>
              </div>
            </Link>
          </Button>
        </div>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Products</CardTitle>
                <CardDescription>Your latest product listings</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/supplier/products">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">No products yet</p>
                <Button asChild>
                  <Link href="/supplier/products/create">Add Your First Product</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      {product.images && JSON.parse(product.images)[0] ? (
                        <img
                          src={JSON.parse(product.images)[0]}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{product.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {product.viewCount} views
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/supplier/products/${product.id}`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membership Info */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Information</CardTitle>
            <CardDescription>Your current subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Package</span>
              <Badge variant={isFree ? 'secondary' : 'default'}>
                {membership.package.name}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Status</span>
              <Badge variant={membership.isActive ? 'default' : 'secondary'}>
                {membership.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {membership.endDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Expires</span>
                <span className="text-sm font-medium">
                  {new Date(membership.endDate).toLocaleDateString('id-ID')}
                </span>
              </div>
            )}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Features</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {features.chatEnabled ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span>Chat Enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  {features.verifiedBadge ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span>Verified Badge</span>
                </div>
                <div className="flex items-center gap-2">
                  {features.customURL ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span>Custom URL</span>
                </div>
                <div className="flex items-center gap-2">
                  {features.statistics ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-gray-300">✗</span>
                  )}
                  <span>Statistics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Max Products: {maxProducts}</span>
                </div>
              </div>
            </div>
            {isFree && (
              <div className="pt-4">
                <Button className="w-full" asChild>
                  <Link href="/pricing/supplier">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade ke Premium
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
    </>
  )
}
