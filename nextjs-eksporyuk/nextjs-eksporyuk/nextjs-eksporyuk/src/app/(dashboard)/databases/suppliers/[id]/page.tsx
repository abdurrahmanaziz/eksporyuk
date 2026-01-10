'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, Globe, Mail, Phone, MapPin, CheckCircle, Star, ArrowLeft, Factory, Award, Briefcase, MessageCircle } from 'lucide-react'

type Supplier = {
  id: string
  companyName: string
  contactPerson?: string
  email?: string
  phone?: string
  whatsapp?: string
  website?: string
  province: string
  city: string
  address?: string
  businessType?: string
  products: string
  capacity?: string
  certifications?: string
  tags?: string
  notes?: string
  isVerified: boolean
  rating: number
  totalDeals: number
  viewCount: number
  createdAt: string
}

export default function SupplierDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchSupplier()
    }
  }, [params.id])

  const fetchSupplier = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/databases/suppliers/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setSupplier(data)
    } catch (error) {
      console.error('Error:', error)
      router.push('/databases/suppliers')
    } finally {
      setLoading(false)
    }
  }

  const handleContactWhatsApp = () => {
    if (supplier?.whatsapp) {
      const phone = supplier.whatsapp.replace(/\D/g, '')
      window.open(`https://wa.me/${phone}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="p-8">
        <div className="text-center">Supplier not found</div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <Link href="/databases/suppliers">
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Suppliers
        </Button>
      </Link>

      {/* Main Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Factory className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{supplier.companyName}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    {supplier.isVerified && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Supplier
                      </Badge>
                    )}
                    {supplier.businessType && (
                      <Badge variant="outline">{supplier.businessType}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {supplier.city}, {supplier.province}
                </span>
                {supplier.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {supplier.rating.toFixed(1)} ({supplier.totalDeals} deals)
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Company Information
                </h3>
                <div className="space-y-3 text-sm">
                  {supplier.address && (
                    <div>
                      <span className="font-medium text-gray-700">Address:</span>
                      <p className="text-gray-600 mt-1">{supplier.address}</p>
                    </div>
                  )}
                  {supplier.contactPerson && (
                    <div>
                      <span className="font-medium text-gray-700">Contact Person:</span>
                      <p className="text-gray-600">{supplier.contactPerson}</p>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                        {supplier.email}
                      </a>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {supplier.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {supplier.certifications && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                  </h3>
                  <p className="text-sm text-gray-600">{supplier.certifications}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Products & Services</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{supplier.products}</p>
              </div>

              {supplier.capacity && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Production Capacity</h3>
                  <p className="text-sm text-gray-600">{supplier.capacity}</p>
                </div>
              )}

              {supplier.tags && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact CTA */}
          {supplier.whatsapp && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Interested in this supplier?</h3>
                  <p className="text-sm text-gray-600">Contact them directly via WhatsApp</p>
                </div>
                <Button 
                  onClick={handleContactWhatsApp}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-900">{supplier.viewCount}</div>
            <div className="text-sm text-gray-600">Profile Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-900">{supplier.totalDeals}</div>
            <div className="text-sm text-gray-600">Total Deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-900">{supplier.rating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Rating</div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
