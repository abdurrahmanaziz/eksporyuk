'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Heart, Globe, Star, CheckCircle, ArrowLeft } from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

type Buyer = {
  id: string
  companyName: string
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  country: string
  city?: string
  businessType: string
  productsInterest: string
  notes?: string
  logo?: string
  isVerified: boolean
  rating: number
  totalDeals: number
  likeCount: number
}

export default function FavoriteBuyersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchFavorites()
    }
  }, [status, router, page])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/databases/buyers/favorites?page=${page}&limit=12`)
      const data = await res.json()
      
      setBuyers(data.buyers || [])
      setPagination(data.pagination || { total: 0, totalPages: 0 })
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-500 fill-current" />
              My Favorite Buyers
            </h1>
            <p className="text-gray-600 mt-2">Buyers you've marked as favorites</p>
          </div>
          <Link href="/databases/buyers">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Buyers
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Total Favorites: <span className="font-semibold text-gray-900">{pagination.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Grid */}
        {buyers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {buyers.map((buyer) => (
                <Card key={buyer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {buyer.logo ? (
                        <img src={buyer.logo} alt={buyer.companyName} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{buyer.companyName}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" /> Verified
                          </Badge>
                          <div className="flex items-center text-xs text-gray-600">
                            <Star className="w-3 h-3 text-yellow-500 mr-1 fill-current" />
                            {buyer.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <Heart className="w-5 h-5 text-red-500 fill-current flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="w-4 h-4 mr-2" />
                      {buyer.country} {buyer.city && `• ${buyer.city}`}
                    </div>

                    {buyer.productsInterest && (
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-1">Products Interest:</div>
                        <p className="text-sm text-gray-600 line-clamp-2">{buyer.productsInterest}</p>
                      </div>
                    )}

                    {buyer.businessType && (
                      <div className="text-xs text-gray-500">
                        Business Type: {buyer.businessType}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div>{buyer.totalDeals} deals</div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {buyer.likeCount || 0}
                      </div>
                    </div>

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
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">Start exploring and add buyers to your favorites</p>
              <Link href="/databases/buyers">
                <Button>
                  Browse Buyers
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
