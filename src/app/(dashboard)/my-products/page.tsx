'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
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
  Loader2,
  CheckCircle2,
  Crown,
  ArrowRight,
  Search,
  Star,
  Link as LinkIcon,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

interface DownloadFile {
  name: string
  url: string
  size?: string
  type?: string
}

interface TargetMembership {
  id: string
  name: string
  slug: string
  price: number
}

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
    checkoutSlug?: string
    description: string
    shortDescription: string
    thumbnail: string
    productType: 'DIGITAL' | 'PHYSICAL' | 'EVENT' | 'WEBINAR' | 'COURSE'
    price: number
    
    // Event fields
    eventDate?: string
    eventEndDate?: string
    eventUrl?: string
    meetingId?: string
    meetingPassword?: string
    eventVisibility?: string
    
    // Upsell
    targetMembership?: TargetMembership
    upsaleMessage?: string
    upsaleDiscount?: number
    
    // Files
    downloadableFiles?: DownloadFile[]
  }
}

interface UserMembership {
  id: string
  membershipId: string
  membershipName: string
}

export default function MyProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userProducts, setUserProducts] = useState<UserProduct[]>([])
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-products')
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
        setUserMembership(data.userMembership || null)
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
    let filtered = userProducts
    
    if (type && type !== 'all') {
      filtered = filtered.filter(up => up.product.productType === type)
    }
    
    if (searchQuery) {
      filtered = filtered.filter(up => 
        up.product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Berhasil disalin!')
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast.error('Gagal menyalin')
    }
  }

  const digitalProducts = filterProducts('DIGITAL')
  const eventProducts = filterProducts('EVENT').concat(filterProducts('WEBINAR'))

  // Stats
  const totalDownloads = userProducts.filter(up => 
    up.product.productType === 'DIGITAL' && 
    up.product.downloadableFiles && 
    up.product.downloadableFiles.length > 0
  ).length

  const upcomingEvents = userProducts.filter(up => {
    if (!['EVENT', 'WEBINAR'].includes(up.product.productType) || !up.product.eventDate) return false
    return new Date(up.product.eventDate) > new Date()
  }).length

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-gray-600">Memuat produk Anda...</p>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produk Saya</h1>
            <p className="text-gray-600">Download dan akses semua produk yang Anda miliki</p>
          </div>
          
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Upsell Banner - Show if no membership and has products with target membership */}
        {!userMembership && userProducts.some(up => up.product.targetMembership) && (
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Crown className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Upgrade ke Membership Premium!</h3>
                    <p className="text-orange-100">Dapatkan akses unlimited ke semua produk dan kelas eksklusif</p>
                  </div>
                </div>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/pricing">
                    Lihat Paket
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Produk</p>
                  <p className="text-2xl font-bold">{userProducts.length}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">File Download</p>
                  <p className="text-2xl font-bold">{totalDownloads}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Event Mendatang</p>
                  <p className="text-2xl font-bold">{upcomingEvents}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Membership</p>
                  <p className="text-lg font-bold truncate">
                    {userMembership ? userMembership.membershipName : 'Belum Member'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${userMembership ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  <Crown className={`w-6 h-6 ${userMembership ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              Semua ({filterProducts('all').length})
            </TabsTrigger>
            <TabsTrigger value="DIGITAL">
              <Download className="w-4 h-4 mr-1" />
              Digital ({digitalProducts.length})
            </TabsTrigger>
            <TabsTrigger value="EVENT">
              <Calendar className="w-4 h-4 mr-1" />
              Event ({eventProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {filterProducts('all').length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filterProducts('all').map((up) => (
                  <ProductCard 
                    key={up.id} 
                    userProduct={up} 
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    copyToClipboard={copyToClipboard}
                    copiedField={copiedField}
                    userMembership={userMembership}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="DIGITAL" className="mt-6">
            {digitalProducts.length === 0 ? (
              <EmptyState type="digital" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {digitalProducts.map((up) => (
                  <ProductCard 
                    key={up.id} 
                    userProduct={up}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    copyToClipboard={copyToClipboard}
                    copiedField={copiedField}
                    userMembership={userMembership}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="EVENT" className="mt-6">
            {eventProducts.length === 0 ? (
              <EmptyState type="event" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {eventProducts.map((up) => (
                  <ProductCard 
                    key={up.id} 
                    userProduct={up}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    copyToClipboard={copyToClipboard}
                    copiedField={copiedField}
                    userMembership={userMembership}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ResponsivePageWrapper>
  )
}

function EmptyState({ type }: { type?: string }) {
  const router = useRouter()
  
  const messages = {
    digital: {
      title: 'Belum Ada Produk Digital',
      desc: 'Anda belum memiliki produk digital untuk di-download'
    },
    event: {
      title: 'Belum Ada Event',
      desc: 'Anda belum terdaftar di event apapun'
    },
    default: {
      title: 'Belum Ada Produk',
      desc: 'Anda belum memiliki produk apapun'
    }
  }

  const msg = messages[type as keyof typeof messages] || messages.default

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{msg.title}</h3>
        <p className="text-gray-600 mb-4">{msg.desc}</p>
        <Button onClick={() => router.push('/products')}>
          Jelajahi Produk
        </Button>
      </CardContent>
    </Card>
  )
}

function ProductCard({ 
  userProduct, 
  showPassword, 
  setShowPassword,
  copyToClipboard,
  copiedField,
  userMembership
}: { 
  userProduct: UserProduct
  showPassword: { [key: string]: boolean }
  setShowPassword: (v: { [key: string]: boolean }) => void
  copyToClipboard: (text: string, field: string) => void
  copiedField: string | null
  userMembership: UserMembership | null
}) {
  const { product } = userProduct
  const isEvent = ['EVENT', 'WEBINAR'].includes(product.productType)
  const isUpcoming = isEvent && product.eventDate && new Date(product.eventDate) > new Date()
  const isPast = isEvent && product.eventDate && new Date(product.eventDate) <= new Date()
  
  const getTypeIcon = () => {
    switch (product.productType) {
      case 'DIGITAL': return <FileText className="w-5 h-5" />
      case 'EVENT':
      case 'WEBINAR': return <Video className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  const getTypeBadge = () => {
    const types = {
      'DIGITAL': { label: 'Digital', color: 'bg-blue-100 text-blue-700' },
      'EVENT': { label: 'Event', color: 'bg-green-100 text-green-700' },
      'WEBINAR': { label: 'Webinar', color: 'bg-purple-100 text-purple-700' },
    }
    const type = types[product.productType as keyof typeof types] || { label: product.productType, color: 'bg-gray-100 text-gray-700' }
    return <Badge className={type.color}>{type.label}</Badge>
  }

  const handleDownload = (file: DownloadFile) => {
    toast.info('Mengunduh file...')
    window.open(file.url, '_blank')
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        {product.thumbnail && (
          <div className="md:w-48 h-48 md:h-auto bg-gray-100 flex-shrink-0">
            <img 
              src={product.thumbnail} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              {getTypeBadge()}
              {isUpcoming && (
                <Badge className="bg-green-500 text-white">
                  <Clock className="w-3 h-3 mr-1" />
                  Upcoming
                </Badge>
              )}
              {isPast && (
                <Badge variant="secondary">Selesai</Badge>
              )}
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
          
          {product.shortDescription && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {product.shortDescription}
            </p>
          )}

          {/* Event Details */}
          {isEvent && product.eventDate && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>
                  {new Date(product.eventDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {/* Meeting Link */}
              {product.eventUrl && isUpcoming && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Link Meeting:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={product.eventUrl} 
                      readOnly 
                      className="text-xs h-8"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(product.eventUrl!, `link-${product.id}`)}
                    >
                      {copiedField === `link-${product.id}` ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => window.open(product.eventUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Meeting ID & Password */}
              {product.meetingId && isUpcoming && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Meeting ID:</span>
                    <code className="bg-gray-200 px-2 py-0.5 rounded">{product.meetingId}</code>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(product.meetingId!, `mid-${product.id}`)}
                    >
                      {copiedField === `mid-${product.id}` ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {product.meetingPassword && isUpcoming && (
                <div className="flex items-center gap-2 text-sm">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Password:</span>
                  <code className="bg-gray-200 px-2 py-0.5 rounded">
                    {showPassword[product.id] ? product.meetingPassword : '••••••'}
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowPassword({ 
                      ...showPassword, 
                      [product.id]: !showPassword[product.id] 
                    })}
                  >
                    {showPassword[product.id] ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(product.meetingPassword!, `pwd-${product.id}`)}
                  >
                    {copiedField === `pwd-${product.id}` ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Download Files */}
          {product.downloadableFiles && product.downloadableFiles.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700">File Download:</p>
              {product.downloadableFiles.map((file, idx) => (
                <Button 
                  key={idx}
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="truncate">{file.name}</span>
                  {file.size && (
                    <span className="ml-auto text-xs text-gray-500">{file.size}</span>
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Upsell Section */}
          {product.targetMembership && !userMembership && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Star className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-800">Upgrade ke {product.targetMembership.name}</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    {product.upsaleMessage || 'Dapatkan akses unlimited dan benefit eksklusif lainnya!'}
                  </p>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700" asChild>
                    <Link href={`/checkout/${product.targetMembership.slug}`}>
                      {product.upsaleDiscount && product.upsaleDiscount > 0 
                        ? `Upgrade Diskon ${product.upsaleDiscount}%`
                        : 'Upgrade Sekarang'
                      }
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Info */}
          <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
            <span>
              Dibeli: {new Date(userProduct.purchaseDate).toLocaleDateString('id-ID')}
            </span>
            <span>
              Rp {Number(userProduct.price).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
