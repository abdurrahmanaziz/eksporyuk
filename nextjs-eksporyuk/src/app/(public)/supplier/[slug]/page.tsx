'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  CheckCircle2,
  Package,
  TrendingUp,
  Instagram,
  Facebook,
  Linkedin,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface Supplier {
  id: string
  slug: string
  companyName: string
  bio?: string
  logo?: string
  banner?: string
  address?: string
  city?: string
  province?: string
  phone?: string
  email?: string
  website?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  linkedin?: string
  isVerified: boolean
  viewCount: number
  products: Product[]
  isPremium: boolean
}

interface Product {
  id: string
  slug: string
  title: string
  description?: string
  images?: any
  category?: string
  price?: number
  minOrder?: string
  viewCount: number
  likeCount: number
}

export default function SupplierPublicProfilePage() {
  const params = useParams()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)

  const slug = params?.slug as string

  useEffect(() => {
    if (slug) {
      fetchSupplier()
    }
  }, [slug])

  const fetchSupplier = async () => {
    try {
      const response = await fetch(`/api/supplier/public/${slug}`)
      
      if (response.ok) {
        const data = await response.json()
        setSupplier(data.data)
      } else {
        toast.error('Supplier tidak ditemukan')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleContact = (type: 'whatsapp' | 'email' | 'phone') => {
    if (!supplier) return

    if (type === 'whatsapp' && supplier.whatsapp) {
      window.open(`https://wa.me/${supplier.whatsapp}`, '_blank')
    } else if (type === 'email' && supplier.email) {
      window.location.href = `mailto:${supplier.email}`
    } else if (type === 'phone' && supplier.phone) {
      window.location.href = `tel:${supplier.phone}`
    } else {
      toast.error('Informasi kontak tidak tersedia')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Supplier Tidak Ditemukan</h3>
          <Link href="/suppliers">
            <Button>Kembali ke Direktori</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-blue-700">
        {supplier.banner && (
          <Image
            src={supplier.banner}
            alt={supplier.companyName}
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 mb-8">
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-white shadow-lg border-4 border-white">
                    {supplier.logo ? (
                      <Image
                        src={supplier.logo}
                        alt={supplier.companyName}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Building2 className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{supplier.companyName}</h1>
                        {supplier.isVerified && (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {supplier.isPremium && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                            Premium
                          </Badge>
                        )}
                      </div>

                      {(supplier.city || supplier.province) && (
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <MapPin className="w-5 h-5" />
                          <span>{[supplier.city, supplier.province].filter(Boolean).join(', ')}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{supplier.products.length} Produk</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{supplier.viewCount} Views</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Buttons */}
                    {supplier.isPremium && (
                      <div className="flex flex-wrap gap-2">
                        {supplier.whatsapp && (
                          <Button onClick={() => handleContact('whatsapp')} className="bg-green-600 hover:bg-green-700">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                        )}
                        {supplier.email && (
                          <Button onClick={() => handleContact('email')} variant="outline">
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </Button>
                        )}
                        {supplier.phone && (
                          <Button onClick={() => handleContact('phone')} variant="outline">
                            <Phone className="w-4 h-4 mr-2" />
                            Telepon
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-8 pb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {supplier.bio && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Tentang Perusahaan</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{supplier.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Products */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Produk ({supplier.products.length})</h2>
                
                {supplier.products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada produk</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {supplier.products.map((product) => (
                      <Card key={product.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="aspect-square relative bg-gray-100">
                            {product.images && Array.isArray(product.images) && product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="w-12 h-12 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
                            {product.category && (
                              <Badge variant="outline" className="mb-2">
                                {product.category}
                              </Badge>
                            )}
                            {product.price && (
                              <p className="text-lg font-bold text-blue-600">
                                Rp {product.price.toLocaleString('id-ID')}
                              </p>
                            )}
                            {product.minOrder && (
                              <p className="text-sm text-gray-500 mt-1">Min. Order: {product.minOrder}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">Informasi Kontak</h3>
                <div className="space-y-3">
                  {supplier.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{supplier.address}</p>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <a href={`tel:${supplier.phone}`} className="text-sm text-blue-600 hover:underline">
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${supplier.email}`} className="text-sm text-blue-600 hover:underline">
                        {supplier.email}
                      </a>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            {(supplier.instagram || supplier.facebook || supplier.linkedin) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">Media Sosial</h3>
                  <div className="space-y-2">
                    {supplier.instagram && (
                      <a
                        href={`https://instagram.com/${supplier.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Instagram className="w-5 h-5 text-pink-600" />
                        <span className="text-sm">{supplier.instagram}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                      </a>
                    )}
                    {supplier.facebook && (
                      <a
                        href={supplier.facebook.startsWith('http') ? supplier.facebook : `https://facebook.com/${supplier.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">Facebook</span>
                        <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                      </a>
                    )}
                    {supplier.linkedin && (
                      <a
                        href={supplier.linkedin.startsWith('http') ? supplier.linkedin : `https://linkedin.com/company/${supplier.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Linkedin className="w-5 h-5 text-blue-700" />
                        <span className="text-sm">LinkedIn</span>
                        <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA for non-premium */}
            {!supplier.isPremium && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-blue-900 mb-2">Ingin Upgrade?</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Upgrade ke Premium untuk menampilkan tombol kontak dan fitur lainnya
                  </p>
                  <Link href="/supplier/packages">
                    <Button className="w-full">Lihat Paket</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
