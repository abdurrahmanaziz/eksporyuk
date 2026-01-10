'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  MapPin,
  Calendar,
  Users,
  FileText,
  MessageCircle,
  Heart,
  Shield,
  Crown,
  Star,
  UserCheck,
  Clock,
  ArrowLeft,
  Settings,
  Mail,
  ExternalLink,
  Camera,
  Loader2,
  UserPlus,
  UserMinus,
  Package,
  BookOpen,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface UserProfile {
  id: string
  name: string
  username: string
  avatar: string | null
  coverImage: string | null
  bio: string | null
  role: string
  province: string | null
  city: string | null
  district: string | null
  locationVerified: boolean
  isOnline: boolean
  lastSeenAt: string | null
  createdAt: string
  isFounder: boolean
  isCoFounder: boolean
  isOwnProfile: boolean
  isFollowing: boolean
  _count: {
    posts: number
    groupMemberships: number
    followers: number
    following: number
    courseEnrollments: number
  }
  supplierProfile?: {
    companyName: string
    logo: string | null
    businessCategory: string | null
    _count: {
      products: number
    }
  }
  affiliateProfile?: {
    affiliateCode: string
    tier: number
    totalEarnings: number
    totalConversions: number
  }
  mentorProfile?: {
    expertise: string | null
    bio: string | null
    rating: number
    totalStudents: number
    totalCourses: number
  }
  posts: Array<{
    id: string
    content: string
    createdAt: string
    type: string
    images?: string[]
    _count: {
      likes: number
      comments: number
    }
    author: {
      id: string
      name: string
      avatar: string | null
      username: string
    }
    group: {
      id: string
      name: string
      slug: string
      avatar: string | null
    } | null
  }>
  groupMemberships: Array<{
    role: string
    joinedAt: string
    group: {
      id: string
      name: string
      slug: string
      avatar: string | null
      type: string
      _count: {
        members: number
      }
    }
  }>
}

interface ProfileResponse {
  user: UserProfile
  posts: any[]
  roleData?: {
    products?: any[]
    courses?: any[]
    topLinks?: any[]
  }
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const username = params?.username as string

  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    if (username) {
      fetchProfile()
    }
  }, [username])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/${username}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Profil tidak ditemukan')
        } else {
          setError('Gagal memuat profil')
        }
        return
      }

      const data = await response.json()
      setProfile(data)
      setFollowing(data.user.isFollowing)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Terjadi kesalahan saat memuat profil')
    } finally {
      setLoading(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    const formData = new FormData()
    formData.append('cover', file)

    try {
      const response = await fetch('/api/user/cover', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('Cover photo berhasil diupload')
        fetchProfile()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal upload cover photo')
      }
    } catch (error) {
      console.error('Error uploading cover:', error)
      toast.error('Gagal upload cover photo')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleFollow = async () => {
    if (!profile) return
    
    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.user.id }),
      })

      if (response.ok) {
        setFollowing(!following)
        toast.success(following ? 'Berhenti mengikuti' : 'Berhasil mengikuti')
        fetchProfile()
      }
    } catch (error) {
      console.error('Error following user:', error)
      toast.error('Gagal mengikuti user')
    }
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-800', icon: Shield },
      MENTOR: { label: 'Mentor', color: 'bg-purple-100 text-purple-800', icon: Star },
      AFFILIATE: { label: 'Affiliate', color: 'bg-green-100 text-green-800', icon: ExternalLink },
      MEMBER_PREMIUM: { label: 'Premium', color: 'bg-blue-100 text-blue-800', icon: Crown },
      MEMBER_FREE: { label: 'Member', color: 'bg-gray-100 text-gray-800', icon: Users },
    }
    return badges[role as keyof typeof badges] || badges.MEMBER_FREE
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: idLocale })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} jam lalu`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} hari lalu`
    
    return formatDate(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Users className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{error || 'Profil tidak ditemukan'}</h2>
        <p className="text-muted-foreground mb-4">Username yang Anda cari tidak tersedia</p>
        <Button onClick={() => router.push('/member-directory')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Region
        </Button>
      </div>
    )
  }

  const roleBadge = getRoleBadge(profile.user?.role || 'MEMBER_FREE')
  const RoleIcon = roleBadge.icon
  const isOwnProfile = profile.user.isOwnProfile || false
  const user = profile.user
  const posts = profile.posts || []
  const roleData = profile.roleData

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-500 to-purple-600">
        {user?.coverImage && (
          <Image
            src={user.coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        )}
        
        {/* Upload Cover Button (only for own profile) */}
        {isOwnProfile && (
          <label className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-lg">
            <div className="flex items-center gap-2">
              {uploadingCover ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {user?.coverImage ? 'Ganti Cover' : 'Upload Cover'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
              disabled={uploadingCover}
            />
          </label>
        )}
      </div>

      {/* Profile Content */}
      <div className="container mx-auto p-4 max-w-6xl -mt-20">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-gray-800">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                <AvatarFallback className="text-3xl">
                  {user?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user?.isOnline && (
                <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 rounded-full ring-4 ring-white dark:ring-gray-800" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  {/* Name & Special Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h1 className="text-2xl font-bold">{user?.name}</h1>
                    {user?.isFounder && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Founder
                      </Badge>
                    )}
                    {user?.isCoFounder && (
                      <Badge className="bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Co-Founder
                      </Badge>
                    )}
                  </div>

                  {/* Username & Role */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-muted-foreground">@{user?.username}</span>
                    <Badge className={roleBadge.color}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleBadge.label}
                    </Badge>
                  </div>

                  {/* Location */}
                  {(user?.city || user?.province) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[user.city, user.province].filter(Boolean).join(', ')}
                      </span>
                      {user.locationVerified && (
                        <UserCheck className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  )}

                  {/* Online Status */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <div className={`h-2 w-2 rounded-full ${user?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span>
                      {user?.isOnline 
                        ? 'Online' 
                        : user?.lastSeenAt 
                          ? `Terakhir dilihat ${formatRelativeTime(user.lastSeenAt)}`
                          : 'Offline'
                      }
                    </span>
                  </div>

                  {/* Bio */}
                  {user?.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-3 max-w-2xl">{user.bio}</p>
                  )}

                  {/* Member Since */}
                  {user?.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Bergabung sejak {formatDate(user.createdAt)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Link href="/profile">
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profil
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button
                        onClick={handleFollow}
                        variant={following ? 'outline' : 'default'}
                      >
                        {following ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Berhenti Ikuti
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Ikuti
                          </>
                        )}
                      </Button>
                      <Button onClick={() => router.push(`/chat?user=${user?.id}`)} variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Pesan
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user?._count.posts || 0}</div>
                  <div className="text-sm text-muted-foreground">Postingan</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user?._count.followers || 0}</div>
                  <div className="text-sm text-muted-foreground">Pengikut</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user?._count.following || 0}</div>
                  <div className="text-sm text-muted-foreground">Mengikuti</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user?._count.groupMemberships || 0}</div>
                  <div className="text-sm text-muted-foreground">Grup</div>
                </div>
                {user?.role === 'MENTOR' && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{user._count.courseEnrollments || 0}</div>
                    <div className="text-sm text-muted-foreground">Siswa</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">
            <FileText className="h-4 w-4 mr-2" />
            Postingan ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="h-4 w-4 mr-2" />
            Grup ({user?.groupMemberships.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada postingan</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar || undefined} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/profile/${post.author.username}`} className="font-semibold hover:underline">
                          {post.author.name}
                        </Link>
                        {post.group && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <Link 
                              href={`/community/groups/${post.group.slug}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {post.group.name}
                            </Link>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatRelativeTime(post.createdAt)}
                      </p>
                      <div className="prose prose-sm max-w-none mb-3" dangerouslySetInnerHTML={{ __html: post.content }} />
                      
                      {/* Post Images */}
                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {post.images.slice(0, 4).map((image, idx) => (
                            <div key={idx} className="relative h-48">
                              <Image
                                src={image}
                                alt={`Post image ${idx + 1}`}
                                fill
                                className="object-cover rounded-lg"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post._count.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post._count.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          {!user?.groupMemberships || user.groupMemberships.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum bergabung di grup manapun</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.groupMemberships.map((membership) => (
                <Card key={membership.group.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <Link href={`/community/groups/${membership.group.slug}`}>
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={membership.group.avatar || undefined} />
                          <AvatarFallback>
                            {membership.group.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {membership.group.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {membership.group.type}
                            </Badge>
                            {membership.role !== 'MEMBER' && (
                              <Badge className="text-xs bg-purple-100 text-purple-800">
                                {membership.role}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{membership.group._count.members} member</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}

