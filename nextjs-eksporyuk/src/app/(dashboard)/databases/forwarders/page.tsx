'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Truck, Search, MapPin, CheckCircle, Star, Globe, Phone, Mail } from 'lucide-react'

type Forwarder = {
  id: string
  companyName: string
  country: string
  city: string
  serviceType?: string
  routes?: string
  priceRange?: string
  isVerified: boolean
  rating: number
  totalShipments: number
  tags?: string
}

const SERVICE_TYPES = ['Sea Freight', 'Air Freight', 'Land Freight', 'Multimodal', 'Express']

export default function ForwardersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [forwarders, setForwarders] = useState<Forwarder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterService, setFilterService] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchForwarders()
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      const debounce = setTimeout(() => fetchForwarders(), 300)
      return () => clearTimeout(debounce)
    }
  }, [searchTerm, filterService, status])

  const fetchForwarders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterService && filterService !== 'all') params.append('serviceType', filterService)
      params.append('isVerified', 'true')

      const res = await fetch(`/api/databases/forwarders?${params}`)
      const data = await res.json()
      setForwarders(data.forwarders || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && forwarders.length === 0) {
    return <div className="p-8"><div className="text-center">Loading...</div></div>
  }

  return (
    <ResponsivePageWrapper>
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Truck className="h-8 w-8" />
          Database Freight Forwarder
        </h1>
        <p className="text-gray-600 mt-2">Direktori jasa pengiriman barang ekspor-impor</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Cari forwarder..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger><SelectValue placeholder="Semua Layanan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Layanan</SelectItem>
                {SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forwarders.map((fwd) => (
          <Link key={fwd.id} href={`/databases/forwarders/${fwd.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold line-clamp-1">{fwd.companyName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {fwd.isVerified && <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>}
                    {fwd.serviceType && <Badge variant="outline">{fwd.serviceType}</Badge>}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1"><MapPin className="h-4 w-4" />{fwd.city}, {fwd.country}</div>
                  {fwd.routes && <div><span className="font-medium">Routes:</span> <span className="line-clamp-1">{fwd.routes}</span></div>}
                  {fwd.priceRange && <div><span className="font-medium">Price:</span> {fwd.priceRange}</div>}
                  {fwd.rating > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{fwd.rating.toFixed(1)}</span>
                      <span>• {fwd.totalShipments} shipments</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {forwarders.length === 0 && !loading && (
        <Card><CardContent className="py-12 text-center text-gray-500"><Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" /><p>Tidak ada forwarder ditemukan</p></CardContent></Card>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
