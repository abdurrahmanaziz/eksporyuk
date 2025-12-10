'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { UpgradeMembershipModal } from '@/components/admin/UpgradeMembershipModal'
import { toast } from 'sonner'
import { Calendar, Clock, CreditCard, History, Mail, User, Wallet } from 'lucide-react'

interface UserMembership {
  id: string
  startDate: string
  endDate: string
  status: string
  isActive: boolean
  autoRenew: boolean
  activatedAt: string | null
  createdAt: string
  membership: {
    id: string
    name: string
    slug: string
    description: string
    price: number
    duration: number | null
  }
}

interface UserData {
  id: string
  email: string
  name: string
  username: string
  role: string
  whatsapp: string | null
  createdAt: string
  wallet: {
    balance: number
    balancePending: number
  } | null
  userMemberships: UserMembership[]
  _count: {
    transactions: number
  }
}

export default function UserMembershipsPage() {
  const params = useParams()
  const userId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchActivities()
  }, [userId])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/memberships`)
      if (res.ok) {
        const data = await res.json()
        setUserData(data.user)
      } else {
        toast.error('Gagal memuat data user')
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    setLoadingActivities(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/activities?type=membership`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">User tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeMembership = userData.userMemberships.find(m => m.isActive)

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* User Header */}
      <div>
        <h1 className="text-3xl font-bold">Kelola Membership User</h1>
        <p className="text-muted-foreground mt-1">
          Upgrade, perpanjang, atau ubah paket membership
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Nama</p>
                <p className="text-sm text-muted-foreground">{userData.name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{userData.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Saldo Wallet</p>
                <p className="text-sm text-muted-foreground">
                  Rp {(userData.wallet?.balance || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Total Transaksi</p>
                <p className="text-sm text-muted-foreground">
                  {userData._count.transactions} transaksi
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Memberships */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Membership Aktif</CardTitle>
              <CardDescription>
                Paket membership yang sedang berjalan
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeMembership ? (
            <div className="border rounded-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{activeMembership.membership.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeMembership.membership.description}
                  </p>
                </div>
                <Badge variant={activeMembership.isActive ? 'default' : 'secondary'}>
                  {activeMembership.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dimulai</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activeMembership.startDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Berakhir</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activeMembership.endDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sisa Waktu</p>
                    <p className={`text-sm font-medium ${
                      getRemainingDays(activeMembership.endDate) > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {getRemainingDays(activeMembership.endDate) > 0 
                        ? `${getRemainingDays(activeMembership.endDate)} hari`
                        : `Expired ${Math.abs(getRemainingDays(activeMembership.endDate))} hari lalu`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <UpgradeMembershipModal
                  userMembership={activeMembership}
                  userEmail={userData.email}
                  onSuccess={() => {
                    fetchUserData()
                    fetchActivities()
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Harga: Rp {activeMembership.membership.price.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <p className="text-muted-foreground">Tidak ada membership aktif</p>
              <p className="text-sm text-muted-foreground mt-1">
                User belum memiliki paket membership yang aktif
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Memberships History */}
      {userData.userMemberships.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Membership</CardTitle>
            <CardDescription>
              Semua paket membership yang pernah dimiliki
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userData.userMemberships
                .filter(m => !m.isActive)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((membership) => (
                  <div key={membership.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{membership.membership.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(membership.startDate).toLocaleDateString('id-ID')} - {' '}
                          {new Date(membership.endDate).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <Badge variant="secondary">{membership.status}</Badge>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Log Aktivitas
          </CardTitle>
          <CardDescription>
            Riwayat upgrade dan perubahan membership
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingActivities ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      {activity.metadata && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {JSON.stringify(activity.metadata)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada aktivitas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
