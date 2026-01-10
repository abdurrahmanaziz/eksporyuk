'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, Globe, Mail, Phone, MapPin, TrendingUp, Package, 
  CheckCircle, Star, ArrowLeft, ExternalLink, Award, AlertCircle, Heart, Eye 
} from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

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
  tags?: string
  notes?: string
  logo?: string
  isVerified: boolean
  rating: number
  totalDeals: number
  viewCount: number
  likeCount: number
  reviews?: Review[]
}

type Review = {
  id: string
  rating: number
  comment: string
  createdAt: string
  user: {
    name: string
    image?: string
  }
}

export default function BuyerDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quota, setQuota] = useState({ used: 0, total: 5, remaining: 5 })
  const [isLiked, setIsLiked] = useState(false)
  const [likingInProgress, setLikingInProgress] = useState(false)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchBuyer()
      checkIfLiked()
    }
  }, [status, router, params.id])

  const fetchBuyer = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/databases/buyers/${params.id}`)
      
      if (!res.ok) {
        const data = await res.json()
        if (res.status === 403) {
          setError(data.message || 'Quota exceeded')
          setQuota(data.quota || { used: 0, total: 5, remaining: 0 })
          return
        }
        throw new Error('Failed to fetch buyer')
      }

      const data = await res.json()
      setBuyer(data.buyer)
      setQuota(data.quota)
      setIsPremium(data.quota.total === 999999)
    } catch (err) {
      console.error('Error fetching buyer:', err)
      setError('Failed to load buyer details')
    } finally {
      setLoading(false)
    }
  }

  const checkIfLiked = async () => {
    try {
      const res = await fetch(`/api/databases/buyers/${params.id}/like`)
      const data = await res.json()
      setIsLiked(data.liked)
    } catch (error) {
      console.error('Error checking like:', error)
    }
  }

  const toggleLike = async () => {
    if (likingInProgress) return
    
    try {
      setLikingInProgress(true)
      const res = await fetch(`/api/databases/buyers/${params.id}/like`, {
        method: 'POST'
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setIsLiked(data.liked)
        if (buyer) {
          setBuyer({
            ...buyer,
            likeCount: buyer.likeCount + (data.liked ? 1 : -1)
          })
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLikingInProgress(false)
    }
  }

  const shouldBlurContact = !isPremium

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <div className="text-center">Loading...</div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (error) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">{error}</h3>
              {quota.remaining === 0 && (
                <div className="text-red-700 mb-6">
                  <p>Anda telah mencapai limit viewing bulan ini ({quota.used}/{quota.total}).</p>
                  <p className="mt-2">Upgrade membership untuk akses unlimited!</p>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Link href="/databases/buyers">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                  </Button>
                </Link>
                {quota.remaining === 0 && (
                  <Link href="/dashboard/upgrade">
                    <Button>Upgrade Membership</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!buyer) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Buyer not found</h3>
              <Link href="/databases/buyers">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/databases/buyers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Buyers
            </Button>
          </Link>
        </div>

        {/* Quota Info */}
        <Card className="mb-6 border-l-4 border-l-green-600">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                View counted • Quota remaining: <span className="font-semibold">{quota.remaining}</span> of {quota.total === 999999 ? 'Unlimited' : quota.total}
              </div>
              {quota.remaining <= 5 && quota.total !== 999999 && (
                <Link href="/dashboard/upgrade">
                  <Button size="sm" variant="outline">
                    Upgrade for More
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                {buyer.logo ? (
                  <img src={buyer.logo} alt={buyer.companyName} className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{buyer.companyName}</CardTitle>
                      {buyer.contactPerson && (
                        <CardDescription className="text-base mt-1">
                          Contact: {buyer.contactPerson}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="default" className="ml-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center text-sm">
                      <Star className="w-4 h-4 text-yellow-500 mr-1 fill-current" />
                      <span className="font-semibold">{buyer.rating.toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">({buyer.totalDeals} deals)</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="w-4 h-4 mr-1" />
                      {buyer.viewCount || 0}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Heart className="w-4 h-4 mr-1" />
                      {buyer.likeCount || 0}
                    </div>
                  </div>
                </div>
                <Button 
                  variant={isLiked ? "default" : "outline"}
                  onClick={toggleLike}
                  disabled={likingInProgress}
                  className="gap-2"
                  size="sm"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'}
                </Button>
              </div>
            </CardHeader>
            {buyer.notes && (
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{buyer.notes}</p>
              </CardContent>
            )}
          </Card>

          {/* Product Request - NEW SECTION */}
          {buyer.productName && (
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700">
                  <Package className="w-5 h-5 mr-2" />
                  WANTED: {buyer.productName}
                </CardTitle>
                <CardDescription>This buyer is looking for the following product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {buyer.productSpecs && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Specifications:</div>
                    <div className="bg-white p-3 rounded-lg border text-sm whitespace-pre-line">
                      {buyer.productSpecs}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {buyer.quantity && (
                    <div>
                      <div className="text-xs text-gray-500">Quantity Required</div>
                      <div className="font-semibold text-gray-900">{buyer.quantity}</div>
                    </div>
                  )}
                  {buyer.shippingTerms && (
                    <div>
                      <div className="text-xs text-gray-500">Shipping Terms</div>
                      <div className="font-semibold text-gray-900">{buyer.shippingTerms}</div>
                    </div>
                  )}
                  {buyer.destinationPort && (
                    <div>
                      <div className="text-xs text-gray-500">Destination Port</div>
                      <div className="font-semibold text-gray-900">{buyer.destinationPort}</div>
                    </div>
                  )}
                  {buyer.paymentTerms && (
                    <div>
                      <div className="text-xs text-gray-500">Payment Terms</div>
                      <div className="font-semibold text-gray-900">{buyer.paymentTerms}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Interest */}
          {buyer.productsInterest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Other Products Interest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{buyer.productsInterest}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {buyer.tags && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {buyer.tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {buyer.reviews && buyer.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buyer.reviews.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-3">
                      {review.user.image ? (
                        <img src={review.user.image} alt={review.user.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600">
                            {review.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">{review.user.name}</span>
                          <div className="flex items-center text-sm text-gray-500">
                            <Star className="w-3 h-3 text-yellow-500 mr-1 fill-current" />
                            {review.rating.toFixed(1)}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(review.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Contact Information
                {shouldBlurContact && (
                  <Badge variant="outline" className="text-xs">Premium Only</Badge>
                )}
              </CardTitle>
              {shouldBlurContact && (
                <CardDescription className="text-orange-600 text-xs">
                  Upgrade to Premium to view full contact details
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {buyer.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Email</div>
                    <div className={shouldBlurContact ? 'blur-sm select-none' : ''}>
                      <a href={`mailto:${buyer.email}`} className="text-blue-600 hover:underline break-all">
                        {buyer.email}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {buyer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Phone</div>
                    <div className={shouldBlurContact ? 'blur-sm select-none' : ''}>
                      <a href={`tel:${buyer.phone}`} className="text-blue-600 hover:underline">
                        {buyer.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {buyer.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Website</div>
                    <a 
                      href={buyer.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline break-all flex items-center"
                    >
                      {buyer.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
              
              {shouldBlurContact && (
                <div className="pt-3 border-t">
                  <Link href="/dashboard/upgrade">
                    <Button className="w-full" size="sm">
                      Upgrade to View Contact
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">{buyer.country}</div>
                  {buyer.city && <div className="text-sm text-gray-600">{buyer.city}</div>}
                  {buyer.address && <div className="text-sm text-gray-600 mt-1">{buyer.address}</div>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {buyer.businessType && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Business Type</div>
                  <div className="font-semibold text-gray-900">{buyer.businessType}</div>
                </div>
              )}
              
              {buyer.annualImport && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Annual Import Volume</div>
                  <div className="font-semibold text-gray-900">{buyer.annualImport}</div>
                </div>
              )}
              
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Deals</div>
                <div className="font-semibold text-gray-900">{buyer.totalDeals}</div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="py-6 text-center">
              <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Interested in this buyer?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Connect directly and start your export business relationship
              </p>
              {buyer.email && (
                <a href={`mailto:${buyer.email}`}>
                  <Button className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
