'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, Globe, Mail, Phone, MapPin, CheckCircle, Star, ArrowLeft, MessageCircle, Package } from 'lucide-react'

type Forwarder = {
  id: string
  companyName: string
  contactPerson?: string
  email?: string
  phone?: string
  whatsapp?: string
  website?: string
  country: string
  city: string
  address?: string
  serviceType?: string
  routes?: string
  services?: string
  priceRange?: string
  minShipment?: string
  isVerified: boolean
  rating: number
  totalShipments: number
  viewCount: number
}

export default function ForwarderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [forwarder, setForwarder] = useState<Forwarder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) fetchForwarder()
  }, [params.id])

  const fetchForwarder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/databases/forwarders/${params.id}`)
      if (!response.ok) throw new Error('Failed')
      const data = await response.json()
      setForwarder(data)
    } catch (error) {
      console.error('Error:', error)
      router.push('/databases/forwarders')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8"><div className="text-center">Loading...</div></div>
  if (!forwarder) return <div className="p-8"><div className="text-center">Not found</div></div>

  return (
    <ResponsivePageWrapper>
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/databases/forwarders">
        <Button variant="ghost" className="mb-6 gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{forwarder.companyName}</h1>
              <div className="flex items-center gap-2 mt-2">
                {forwarder.isVerified && <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>}
                {forwarder.serviceType && <Badge variant="outline">{forwarder.serviceType}</Badge>}
                {forwarder.priceRange && <Badge variant="secondary">{forwarder.priceRange} Price</Badge>}
              </div>
              <div className="flex items-center gap-4 text-gray-600 mt-2">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{forwarder.city}, {forwarder.country}</span>
                {forwarder.rating > 0 && <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{forwarder.rating.toFixed(1)} ({forwarder.totalShipments} shipments)</span>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              {forwarder.address && <div><span className="font-medium">Address:</span><p className="text-gray-600 mt-1">{forwarder.address}</p></div>}
              {forwarder.contactPerson && <div><span className="font-medium">Contact:</span> {forwarder.contactPerson}</div>}
              {forwarder.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><a href={`mailto:${forwarder.email}`} className="text-blue-600 hover:underline">{forwarder.email}</a></div>}
              {forwarder.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><a href={`tel:${forwarder.phone}`} className="text-blue-600 hover:underline">{forwarder.phone}</a></div>}
              {forwarder.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4" /><a href={forwarder.website} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{forwarder.website}</a></div>}
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services</h3>
              {forwarder.routes && <div><span className="font-medium">Routes:</span><p className="text-gray-600 mt-1">{forwarder.routes}</p></div>}
              {forwarder.services && <div><span className="font-medium">Services:</span><p className="text-gray-600 mt-1">{forwarder.services}</p></div>}
              {forwarder.minShipment && <div><span className="font-medium">Min Shipment:</span> {forwarder.minShipment}</div>}
            </div>
          </div>

          {forwarder.whatsapp && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg flex items-center justify-between">
              <div><h3 className="font-semibold">Need a quote?</h3><p className="text-sm text-gray-600">Contact via WhatsApp</p></div>
              <Button onClick={() => window.open(`https://wa.me/${forwarder.whatsapp.replace(/\D/g, '')}`, '_blank')} className="bg-green-600 hover:bg-green-700 gap-2"><MessageCircle className="h-4 w-4" />WhatsApp</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{forwarder.viewCount}</div><div className="text-sm text-gray-600">Views</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{forwarder.totalShipments}</div><div className="text-sm text-gray-600">Shipments</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{forwarder.rating.toFixed(1)}</div><div className="text-sm text-gray-600">Rating</div></CardContent></Card>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
