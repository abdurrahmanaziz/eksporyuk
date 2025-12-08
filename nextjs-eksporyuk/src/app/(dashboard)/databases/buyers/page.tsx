'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Search, Globe, Mail, Phone, Star, CheckCircle, XCircle, TrendingUp, AlertCircle, Heart, Eye } from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { SearchableSelect } from '@/components/ui/searchable-select'

type Buyer = {
  id: string
  // Product Request
  productName?: string
  productSpecs?: string
  quantity?: string
  shippingTerms?: string
  destinationPort?: string
  paymentTerms?: string
  // Company
  companyName: string
  country: string
  city?: string
  address?: string
  // Contact
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  // Business
  businessType?: string
  productsInterest?: string
  annualImport?: string
  // Meta
  notes?: string
  logo?: string
  isVerified: boolean
  rating: number
  totalDeals: number
  viewCount: number
  likeCount: number
}

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',
  'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad',
  'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius',
  'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama', 'Papua New Guinea',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste',
  'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'UAE', 'Uganda', 'UK',
  'Ukraine', 'Uruguay', 'USA', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]

const PRODUCT_CATEGORIES = [
  'Agriculture', 'Food & Beverage', 'Textiles & Apparel', 'Furniture & Handicraft',
  'Electronics', 'Automotive', 'Machinery', 'Chemical', 'Pharmaceutical',
  'Cosmetics', 'Jewelry', 'Leather & Footwear', 'Paper & Printing', 'Other'
]

const BUSINESS_SCALES = [
  { value: 'SMALL', label: 'Small (< $1M)' },
  { value: 'MEDIUM', label: 'Medium ($1M - $10M)' },
  { value: 'LARGE', label: 'Large ($10M - $100M)' },
  { value: 'ENTERPRISE', label: 'Enterprise (> $100M)' }
]

export default function BuyersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterScale, setFilterScale] = useState('all')
  const [filterProduct, setFilterProduct] = useState('all')
  const [quota, setQuota] = useState({ used: 0, total: 5, remaining: 5 })
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchBuyers()
    }
  }, [status, router, page])

  useEffect(() => {
    if (status === 'authenticated') {
      const debounce = setTimeout(() => {
        setPage(1)
        fetchBuyers()
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [searchTerm, filterCountry, filterCategory, filterScale, filterProduct, status])

  const fetchBuyers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterCountry && filterCountry !== 'all') params.append('country', filterCountry)
      if (filterCategory && filterCategory !== 'all') params.append('productCategory', filterCategory)
      if (filterScale && filterScale !== 'all') params.append('businessScale', filterScale)
      if (filterProduct && filterProduct !== 'all') params.append('productName', filterProduct)
      params.append('page', page.toString())
      params.append('limit', '12')

      const res = await fetch(`/api/databases/buyers?${params}`)
      const data = await res.json()
      
      setBuyers(data.buyers || [])
      setPagination(data.pagination || { total: 0, totalPages: 0 })
      setQuota(data.quota || { used: 0, total: 5, remaining: 5 })
    } catch (error) {
      console.error('Error fetching buyers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getQuotaColor = () => {
    const percentage = (quota.remaining / quota.total) * 100
    if (percentage <= 20) return 'text-red-600'
    if (percentage <= 50) return 'text-orange-600'
    return 'text-green-600'
  }

  if (loading && buyers.length === 0) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <div className="text-center">Loading...</div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Database Buyer Internasional</h1>
        <p className="text-gray-600 mt-2">Direktori buyer dan importir dari berbagai negara</p>
      </div>

      {/* Quota Banner - Hide for Admin */}
      {session?.user?.role !== 'ADMIN' && (
      <Card className="mb-6 border-l-4 border-l-blue-600">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Quota Viewing Bulan Ini</div>
                <div className="text-sm text-gray-600">
                  Anda telah melihat <span className="font-semibold">{quota.used}</span> dari <span className="font-semibold">{quota.total === 999999 ? 'Unlimited' : quota.total}</span> buyer detail
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getQuotaColor()}`}>
                {quota.total === 999999 ? '∞' : quota.remaining}
              </div>
              <div className="text-xs text-gray-500">Tersisa</div>
            </div>
          </div>
          {quota.remaining <= 5 && quota.total !== 999999 && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-orange-900">Quota hampir habis!</div>
                <div className="text-orange-700 mt-1">
                  Upgrade membership Anda untuk akses unlimited ke database buyer.{' '}
                  <Link href="/dashboard/upgrade" className="underline font-semibold">
                    Upgrade Sekarang
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search buyers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <SearchableSelect
              options={COUNTRIES.map(c => ({ value: c, label: c }))}
              value={filterCountry === 'all' ? '' : filterCountry}
              onValueChange={(val) => setFilterCountry(val || 'all')}
              placeholder="All Countries"
              searchPlaceholder="Search country..."
            />
            <Input
              placeholder="Filter by product..."
              value={filterProduct === 'all' ? '' : filterProduct}
              onChange={(e) => setFilterProduct(e.target.value || 'all')}
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRODUCT_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterScale} onValueChange={setFilterScale}>
              <SelectTrigger>
                <SelectValue placeholder="Scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scales</SelectItem>
                {BUSINESS_SCALES.map(scale => (
                  <SelectItem key={scale.value} value={scale.value}>{scale.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Verified Buyers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Countries Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(buyers.map(b => b.country)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {PRODUCT_CATEGORIES.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buyer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {buyers.map((buyer) => (
          <Card key={buyer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                {buyer.logo ? (
                  <img src={buyer.logo} alt={buyer.companyName} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {buyer.productName && (
                    <div className="text-sm font-semibold text-blue-600 truncate mb-1">
                      WANTED: {buyer.productName}
                    </div>
                  )}
                  <CardTitle className="text-base truncate">{buyer.companyName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Globe className="w-4 h-4 mr-2" />
                {buyer.country} {buyer.city && `• ${buyer.city}`}
              </div>

              {/* Product Specs */}
              {buyer.productSpecs && (
                <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                  <div className="font-semibold text-gray-700 mb-1">Specifications:</div>
                  <p className="line-clamp-2">{buyer.productSpecs}</p>
                </div>
              )}

              {/* Quantity & Terms */}
              <div className="flex flex-wrap gap-1">
                {buyer.quantity && (
                  <Badge variant="outline" className="text-xs">Qty: {buyer.quantity}</Badge>
                )}
                {buyer.shippingTerms && (
                  <Badge variant="outline" className="text-xs">{buyer.shippingTerms}</Badge>
                )}
                {buyer.paymentTerms && (
                  <Badge variant="outline" className="text-xs">{buyer.paymentTerms}</Badge>
                )}
              </div>

              {buyer.businessType && (
                <div className="text-xs text-gray-500">
                  Business Type: {buyer.businessType}
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {buyer.viewCount || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {buyer.likeCount || 0}
                </div>
              </div>

              {buyer.notes && (
                <p className="text-sm text-gray-600 line-clamp-2">{buyer.notes}</p>
              )}

              <Link href={`/databases/buyers/${buyer.id}`}>
                <Button className="w-full mt-2">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center px-4 text-sm text-gray-600">
            Page {page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page === pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {buyers.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No buyers found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setFilterCountry('all')
              setFilterCategory('all')
              setFilterScale('all')
              setFilterProduct('all')
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
