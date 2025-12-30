'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  UserPlus,
  UserMinus
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Link from 'next/link'

interface UserProfileProps {
  userId: string
}

export default function UserProfile({ userId }: UserProfileProps) {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/profile`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    setFollowLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST'
      })
      
      if (res.ok) {
        fetchProfile()
      }
    } catch (error) {
      console.error('Follow error:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Profil tidak ditemukan</p>
      </div>
    )
  }

  const { user, isOwnProfile, isFollowing } = profile

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.image || ''} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {user.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-gray-500">@{user.username || user.email.split('@')[0]}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {user.role === 'ADMIN' ? 'Admin' : user.role === 'MENTOR' ? 'Mentor' : 'Member'}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      Bergabung {formatDistanceToNow(new Date(user.createdAt), { 
                        addSuffix: true,
                        locale: idLocale 
                      })}
                    </div>
                  </div>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? 'outline' : 'default'}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Berhenti Mengikuti
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Ikuti
                        </>
                      )}
                    </Button>
                    <Link href={`/messages?userId=${userId}`}>
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Kirim Pesan
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {user.bio && (
                <p className="mt-4 text-gray-700">{user.bio}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-6 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.stats.posts}</div>
                  <div className="text-sm text-gray-500">Postingan</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.stats.comments}</div>
                  <div className="text-sm text-gray-500">Komentar</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.stats.likes}</div>
                  <div className="text-sm text-gray-500">Suka</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.stats.followers}</div>
                  <div className="text-sm text-gray-500">Pengikut</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.stats.following}</div>
                  <div className="text-sm text-gray-500">Mengikuti</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.stats.groups}</div>
                  <div className="text-sm text-gray-500">Grup</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList>
          <TabsTrigger value="activity">Aktivitas Terkini</TabsTrigger>
          <TabsTrigger value="groups">Grup</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          {/* Recent Posts */}
          {user.recentActivity.posts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Postingan Terbaru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.recentActivity.posts.map((post: any) => (
                  <Link
                    key={post.id}
                    href={`/community/groups/${post.groupId}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">
                          Di {post.group?.name || 'Grup Tidak Diketahui'}
                        </p>
                        <p className="text-gray-700 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post._count.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post._count.comments}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                              locale: idLocale
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Comments */}
          {user.recentActivity.comments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Komentar Terbaru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.recentActivity.comments.map((comment: any) => (
                  <Link
                    key={comment.id}
                    href={`/community/groups/${comment.post.group.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm text-gray-500 mb-1">
                      Mengomentari di {comment.post?.group?.name || 'Grup Tidak Diketahui'}
                    </p>
                    <p className="text-gray-700">{comment.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: idLocale
                      })}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {user.recentActivity.posts.length === 0 && user.recentActivity.comments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Belum ada aktivitas</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          {user.groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.groups.map((group: any) => (
                <Link key={group.id} href={`/community/groups/${group.slug || group.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {group.image && (
                          <img
                            src={group.image}
                            alt={group.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{group.name}</h3>
                          <Badge variant="outline" className="mt-1">
                            {group.type === 'PUBLIC' ? 'Publik' : 'Privat'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Belum bergabung dengan grup manapun</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
