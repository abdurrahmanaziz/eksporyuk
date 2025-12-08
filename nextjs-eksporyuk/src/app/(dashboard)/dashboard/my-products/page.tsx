'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package, 
  Calendar, 
  Download, 
  ExternalLink, 
  FileText, 
  Video, 
  Users, 
  GraduationCap,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UserProduct {
  id: string
  userId: string
  productId: string
  transactionId: string
  purchaseDate: string
  price: number
  product: {
    id: string
    name: string
    slug: string
    description: string
    shortDescription: string
    thumbnail: string
    type: 'DIGITAL' | 'PHYSICAL' | 'EVENT' | 'COURSE_ACCESS' | 'GROUP_ACCESS'
    price: number
    
    // Event fields
    eventDate?: string
    eventTime?: string
    eventLocation?: string
    eventVisibility?: string
    
    // Content access
    targetCourses?: { id: string; title: string }[]
    targetGroups?: { id: string; name: string }[]
    
    // Files
    downloadableFiles?: any[]
  }
}

export default function MyProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userProducts, setUserProducts] = useState<UserProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/my-products')
      return
    }

    if (status === 'authenticated') {
      fetchUserProducts()
    }
  }, [status, router])

  const fetchUserProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/products')
      
      if (response.ok) {
        const data = await response.json()
        setUserProducts(data.products || [])
      } else {
        toast.error('Gagal memuat produk Anda')
      }
    } catch (error) {
      console.error('Error fetching user products:', error)
      toast.error('Terjadi kesalahan saat memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = (type?: string) => {
    if (!type || type === 'all') return userProducts
    return userProducts.filter(up => up.product.type === type)
  }

  const upcomingEvents = userProducts.filter(up => {
    if (up.product.type !== 'EVENT' || !up.product.eventDate) return false
    return new Date(up.product.eventDate) > new Date()
  })

  const pastEvents = userProducts.filter(up => {
    if (up.product.type !== 'EVENT' || !up.product.eventDate) return false
    return new Date(up.product.eventDate) <= new Date()
  })

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      toast.info('Mengunduh file...')
      window.open(fileUrl, '_blank')
    } catch (error) {
      toast.error('Gagal mengunduh file')
    }
  }

  const handleAccessCourse = (courseId: string) => {
    router.push(`/learn/${courseId}`)
  }

  const handleAccessGroup = (groupSlug: string) => {
    router.push(`/community/groups/${groupSlug}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-gray-600">Memuat produk Anda...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Produk Saya</h1>
        <p className="text-gray-600">Kelola dan akses semua produk yang Anda miliki</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Produk</p>
                <p className="text-2xl font-bold">{userProducts.length}</p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Event Mendatang</p>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kelas Akses</p>
                <p className="text-2xl font-bold">
                  {userProducts.filter(up => up.product.type === 'COURSE_ACCESS').length}
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Grup Akses</p>
                <p className="text-2xl font-bold">
                  {userProducts.filter(up => up.product.type === 'GROUP_ACCESS').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Semua ({userProducts.length})</TabsTrigger>
          <TabsTrigger value="DIGITAL">Digital ({filterProducts('DIGITAL').length})</TabsTrigger>
          <TabsTrigger value="EVENT">Event ({filterProducts('EVENT').length})</TabsTrigger>
          <TabsTrigger value="COURSE_ACCESS">Kelas ({filterProducts('COURSE_ACCESS').length})</TabsTrigger>
          <TabsTrigger value="GROUP_ACCESS">Grup ({filterProducts('GROUP_ACCESS').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {userProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Produk</h3>
                <p className="text-gray-600 mb-4">Anda belum memiliki produk apapun</p>
                <Button onClick={() => router.push('/products')}>
                  Jelajahi Produk
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProducts.map((up) => (
                <ProductCard key={up.id} userProduct={up} onAction={{
                  download: handleDownload,
                  accessCourse: handleAccessCourse,
                  accessGroup: handleAccessGroup
                }} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Other Tabs */}
        {['DIGITAL', 'EVENT', 'COURSE_ACCESS', 'GROUP_ACCESS'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterProducts(type).map((up) => (
                <ProductCard key={up.id} userProduct={up} onAction={{
                  download: handleDownload,
                  accessCourse: handleAccessCourse,
                  accessGroup: handleAccessGroup
                }} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
    </ResponsivePageWrapper>
  )
}

// Product Card Component
function ProductCard({ userProduct, onAction }: { 
  userProduct: UserProduct
  onAction: {
    download: (url: string, name: string) => void
    accessCourse: (id: string) => void
    accessGroup: (slug: string) => void
  }
}) {
  const { product } = userProduct
  
  const getTypeIcon = () => {
    switch (product.type) {
      case 'DIGITAL': return <FileText className="w-5 h-5" />
      case 'EVENT': return <Calendar className="w-5 h-5" />
      case 'COURSE_ACCESS': return <GraduationCap className="w-5 h-5" />
      case 'GROUP_ACCESS': return <Users className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  const getTypeBadge = () => {
    const types = {
      'DIGITAL': { label: 'Digital', color: 'bg-blue-100 text-blue-700' },
      'EVENT': { label: 'Event', color: 'bg-green-100 text-green-700' },
      'COURSE_ACCESS': { label: 'Kelas', color: 'bg-purple-100 text-purple-700' },
      'GROUP_ACCESS': { label: 'Grup', color: 'bg-orange-100 text-orange-700' },
      'PHYSICAL': { label: 'Fisik', color: 'bg-gray-100 text-gray-700' }
    }
    const type = types[product.type] || types.DIGITAL
    return <Badge className={type.color}>{type.label}</Badge>
  }

  const isUpcomingEvent = product.type === 'EVENT' && product.eventDate && 
    new Date(product.eventDate) > new Date()

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      {product.thumbnail && (
        <div className="relative h-48 bg-gray-200">
          <img 
            src={product.thumbnail} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            {getTypeBadge()}
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2">
          {getTypeIcon()}
          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {product.shortDescription || product.description}
        </p>

        {/* Event Details */}
        {product.type === 'EVENT' && product.eventDate && (
          <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{new Date(product.eventDate).toLocaleDateString('id-ID')}</span>
            </div>
            {product.eventTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{product.eventTime}</span>
              </div>
            )}
            {product.eventLocation && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="line-clamp-1">{product.eventLocation}</span>
              </div>
            )}
            {isUpcomingEvent && (
              <Badge className="bg-green-100 text-green-700 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Terdaftar
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Digital Downloads */}
          {product.type === 'DIGITAL' && product.downloadableFiles && product.downloadableFiles.length > 0 && (
            <Button 
              className="w-full" 
              size="sm"
              onClick={() => onAction.download(product.downloadableFiles[0].url, product.downloadableFiles[0].name)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          )}

          {/* Course Access */}
          {product.type === 'COURSE_ACCESS' && product.targetCourses && product.targetCourses.length > 0 && (
            <div className="space-y-1">
              {product.targetCourses.map((course) => (
                <Button 
                  key={course.id}
                  className="w-full" 
                  size="sm"
                  variant="outline"
                  onClick={() => onAction.accessCourse(course.id)}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  {course.title}
                </Button>
              ))}
            </div>
          )}

          {/* Group Access */}
          {product.type === 'GROUP_ACCESS' && product.targetGroups && product.targetGroups.length > 0 && (
            <div className="space-y-1">
              {product.targetGroups.map((group) => (
                <Button 
                  key={group.id}
                  className="w-full" 
                  size="sm"
                  variant="outline"
                  onClick={() => onAction.accessGroup(group.id)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {group.name}
                </Button>
              ))}
            </div>
          )}

          {/* View Details */}
          <Button 
            className="w-full" 
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/product/${product.slug}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Lihat Detail
          </Button>
        </div>

        {/* Purchase Info */}
        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          Dibeli pada {new Date(userProduct.purchaseDate).toLocaleDateString('id-ID')}
        </div>
      </CardContent>
    </Card>
  )
}
